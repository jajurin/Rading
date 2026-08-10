import config from '../../configs/dbconfig.js'
import usuarioRepository from '../general/usuario-repositories.js'
import pkg from 'pg'
const { Client } = pkg
const DURACION_SUBASTA_HORAS = 2
export default class trabajadorRepository {
 #usuarioRepo = new usuarioRepository()
    /**
     * Busca clientes por nombre/apellido (texto libre).
     * Si se pasan ids, filtra solo entre esos ids (usado tras aplicar filtros).
     */
    buscarCliente = async (texto, ids = []) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        let sql = `
            SELECT
                c.id,
                u.nombre,
                u.apellido,
                u.email,
                u.direccion,
                u.telefono,
                c.categoria_id,
                c.estrellas
            FROM "Cliente" c
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            WHERE (
                u.nombre ILIKE $1
                OR u.apellido ILIKE $1
            )
        `

        const values = [`%${texto}%`]

        if (ids.length > 0) {
            sql += ` AND c.id = ANY($2)`
            values.push(ids)
        }

        result = await client.query(sql, values)

    } catch (err) {
        console.error('Error en buscarCliente:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}
enviarOferta = async (idTrabajo, idTrabajador, { precio, costoExtraMin = null, costoExtraMax = null, mensaje = null }) => {
    const client = new Client(config)
    try {
        await client.connect()

        const trabajo = await client.query(
            `SELECT id, fijo, estado, "IdTrabajador", precio, subasta_termina
             FROM "Cliente-Trabajador"
             WHERE id = $1`,
            [idTrabajo]
        )
        const ct = trabajo.rows[0]
        if (!ct) throw new Error('La solicitud no existe')
        if (ct.estado !== 'PENDIENTE' || ct.IdTrabajador != null) {
            throw new Error('Esta solicitud ya no está disponible')
        }

        // Evita que el mismo trabajador se postule/oferte dos veces mientras
        // tenga una oferta pendiente activa (aplica a fijo y a subasta).
        const yaOferto = await client.query(
            `SELECT id FROM "Oferta"
             WHERE "idTrabajo" = $1 AND "idTrabajador" = $2 AND "ESTADO_OFERTA" = 'PENDIENTE'`,
            [idTrabajo, idTrabajador]
        )
        if (yaOferto.rows.length > 0) {
            throw new Error('Ya te postulaste a este trabajo')
        }

        // ── Precio fijo: el trabajador se POSTULA al precio que ya fijó el
        // cliente. NO se asigna automático — queda PENDIENTE en "Oferta" y
        // es el cliente el que elige (vía aceptarOferta), igual que en la
        // subasta. Puede haber varios trabajadores postulados al mismo
        // trabajo mientras el cliente no elija a ninguno. ──
        if (ct.fijo) {
            const ofertaResult = await client.query(
                `INSERT INTO "Oferta"
                    ("idTrabajador", "idTrabajo", precio, "costoExtraMin", "costoExtraMax", mensaje, "ESTADO_OFERTA", fecha_creado)
                 VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', now())
                 RETURNING *`,
                [idTrabajador, idTrabajo, ct.precio, costoExtraMin, costoExtraMax, mensaje]
            )
            return { modo: 'fijo', oferta: ofertaResult.rows[0] }
        }

        // ── Subasta: la primera oferta arranca el reloj ──
        let subastaTermina = ct.subasta_termina
        if (!subastaTermina) {
            const abrir = await client.query(
                `UPDATE "Cliente-Trabajador"
                 SET subasta_termina = now() + ($2 * INTERVAL '1 hour')
                 WHERE id = $1 AND subasta_termina IS NULL
                 RETURNING subasta_termina`,
                [idTrabajo, DURACION_SUBASTA_HORAS]
            )
            subastaTermina = abrir.rows[0]?.subasta_termina ?? subastaTermina
        } else if (new Date(subastaTermina) <= new Date()) {
            throw new Error('La subasta para esta solicitud ya cerró')
        }

        const ofertaResult = await client.query(
            `INSERT INTO "Oferta"
                ("idTrabajador", "idTrabajo", precio, "costoExtraMin", "costoExtraMax", mensaje, "ESTADO_OFERTA", fecha_creado)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', now())
             RETURNING *`,
            [idTrabajador, idTrabajo, precio, costoExtraMin, costoExtraMax, mensaje]
        )

        return { modo: 'subasta', oferta: ofertaResult.rows[0], subastaTermina }
    } catch (err) {
        console.error('Error en enviarOferta:', err)
        throw err
    } finally {
        await client.end()
    }
}

// Detecta subastas cuyo plazo venció y todavía nadie asignó. NO asigna
// automáticamente al ganador — solo identifica cuál sería (menor precio,
// empate → más vieja) y lo devuelve para avisar por chat. La decisión
// final de asignar SIGUE siendo del cliente, vía aceptarOferta (en
// cliente-repositories.js). Las ofertas quedan todas PENDIENTE, nada se
// marca ACEPTADA/RECHAZADA acá.
//
// Requiere la columna:
//   ALTER TABLE "Cliente-Trabajador"
//   ADD COLUMN aviso_cierre_enviado boolean NOT NULL DEFAULT false;
// para no reenviar el mismo aviso en cada corrida del cron.
avisarSubastasVencidas = async () => {
    const client = new Client(config)
    const resultados = []
    try {
        await client.connect()

        const vencidas = await client.query(
            `SELECT ct.id, ct."IdCliente"
             FROM "Cliente-Trabajador" ct
             WHERE ct.fijo = false
               AND ct.estado = 'PENDIENTE'
               AND ct."IdTrabajador" IS NULL
               AND ct.subasta_termina IS NOT NULL
               AND ct.subasta_termina <= now()
               AND ct.aviso_cierre_enviado = false`
        )

        for (const ct of vencidas.rows) {
            try {
                await client.query('BEGIN')

                // Lock preventivo: si justo en este instante el cliente
                // está aceptando una oferta a mano (aceptarOferta también
                // usa FOR UPDATE sobre esta misma fila), esperamos acá a
                // que termine para no leer un estado a medio escribir.
                const fila = await client.query(
                    `SELECT id, estado, "IdTrabajador", aviso_cierre_enviado
                     FROM "Cliente-Trabajador"
                     WHERE id = $1
                     FOR UPDATE`,
                    [ct.id]
                )

                const f = fila.rows[0]
                if (!f || f.estado !== 'PENDIENTE' || f.IdTrabajador != null || f.aviso_cierre_enviado) {
                    // Ya se asignó a mano, o ya se avisó antes: nada que hacer.
                    await client.query('COMMIT')
                    continue
                }

                const ganadora = await client.query(
                    `SELECT o.id, o."idTrabajador", o.precio,
                            t."IdPersona" AS "idUsuarioTrabajador",
                            cli."IdPersona" AS "idUsuarioCliente",
                            u.nombre, u.apellido
                     FROM "Oferta" o
                     INNER JOIN "Trabajador" t ON t.id = o."idTrabajador"
                     INNER JOIN "Usuario" u ON u.id = t."IdPersona"
                     INNER JOIN "Cliente" cli ON cli.id = $2
                     WHERE o."idTrabajo" = $1 AND o."ESTADO_OFERTA" = 'PENDIENTE'
                     ORDER BY o.precio ASC, o.fecha_creado ASC
                     LIMIT 1`,
                    [ct.id, ct.IdCliente]
                )

                if (ganadora.rows.length === 0) {
                    // Nadie ofertó: reabre el reloj para recibir ofertas de nuevo.
                    await client.query(
                        `UPDATE "Cliente-Trabajador" SET subasta_termina = NULL WHERE id = $1`,
                        [ct.id]
                    )
                    await client.query('COMMIT')
                    continue
                }

                const oferta = ganadora.rows[0]

                // Único UPDATE que hacemos: marcar que ya avisamos.
                // No tocamos IdTrabajador, estado, ni ESTADO_OFERTA.
                await client.query(
                    `UPDATE "Cliente-Trabajador"
                     SET aviso_cierre_enviado = true
                     WHERE id = $1 AND estado = 'PENDIENTE'`,
                    [ct.id]
                )

                await client.query('COMMIT')

                resultados.push({
                    idTrabajo: ct.id,
                    idCliente: ct.IdCliente,
                    idOfertaGanadora: oferta.id,
                    idTrabajador: oferta.idTrabajador,
                    idUsuarioTrabajador: oferta.idUsuarioTrabajador,
                    idUsuarioCliente: oferta.idUsuarioCliente,
                    nombreTrabajador: `${oferta.nombre} ${oferta.apellido}`,
                    precio: oferta.precio,
                })
            } catch (err) {
                await client.query('ROLLBACK')
                console.error(`Error avisando cierre de subasta ${ct.id}:`, err)
            }
        }
    } finally {
        await client.end()
    }
    return resultados
}
mostrarTrabajosActivos = async (idTrabajador) => {
    const client = new Client(config)
    try {
        await client.connect()
        const sql = `
            SELECT
                ct.id,
                u.nombre,
                u.apellido,
                c.estrellas,
                ct.estado,
                ct.fecha_iniciado,
                ct.distancia,
                ct.fijo,
                ct.precio,
                ct.servicio_id,
                ct.emergencia,
                ct.horario_requerido,
                ct.horario_finalizado,
                ct.trabajo_iniciado_en,
                CASE
                    WHEN ct.trabajo_iniciado_en IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (now() - ct.trabajo_iniciado_en)) / 60
                    ELSE NULL
                END AS "duracionMinutos",
                s.nombre AS servicio_nombre
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            WHERE ct."IdTrabajador" = $1
            AND ct.estado = 'EN PROCESO'
        `
        const result = await client.query(sql, [idTrabajador])
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en mostrarTrabajosActivos (trabajador):', err)
        throw err
    } finally {
        await client.end()
    }
}
mostrarMisOfertas = async (idTrabajador) => {
    const client = new Client(config)
    try {
        await client.connect()
        const sql = `
            SELECT
                o.id AS "idOferta",
                o."idTrabajo",
                o.precio,
                o."costoExtraMin",
                o."costoExtraMax",
                o.mensaje,
                o."ESTADO_OFERTA" AS estado,
                o.fecha_creado,
                ct.descripcion,
                ct.horario_requerido,
                ct.fijo,
                ct.emergencia,
                ct.estado AS "estadoTrabajo",
                ct."IdTrabajador" AS "idTrabajadorAsignado",
                u.nombre,
                u.apellido,
                s.nombre AS servicio_nombre,
                cs.nombre AS categoria_nombre
            FROM "Oferta" o
            INNER JOIN "Cliente-Trabajador" ct ON ct.id = o."idTrabajo"
            INNER JOIN "Cliente" c ON c.id = ct."IdCliente"
            INNER JOIN "Usuario" u ON u.id = c."IdPersona"
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            LEFT JOIN "CategoriaServicio" cs ON cs.id = s.categoria_id
            WHERE o."idTrabajador" = $1
            ORDER BY o.fecha_creado DESC
        `
        const result = await client.query(sql, [idTrabajador])
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en mostrarMisOfertas:', err)
        throw err
    } finally {
        await client.end()
    }
}
/**
 * El trabajador edita una oferta que ya envió, mientras siga PENDIENTE.
 * No se puede editar si ya fue ACEPTADA o RECHAZADA, ni si es de otro
 * trabajador.
 */
editarOferta = async (idOferta, idTrabajador, { precio, costoExtraMin = null, costoExtraMax = null, mensaje = null }) => {
    const client = new Client(config)
    try {
        await client.connect()

        const ofertaResult = await client.query(
            `SELECT id, "idTrabajador", "ESTADO_OFERTA" FROM "Oferta" WHERE id = $1`,
            [idOferta]
        )
        const oferta = ofertaResult.rows[0]
        if (!oferta) throw new Error('La oferta no existe')
        if (Number(oferta.idTrabajador) !== Number(idTrabajador)) {
            throw new Error('Esta oferta no te pertenece')
        }
        if (oferta.ESTADO_OFERTA !== 'PENDIENTE') {
            throw new Error('Solo podés editar ofertas pendientes')
        }

        const actualizada = await client.query(
            `UPDATE "Oferta"
             SET precio = $1, "costoExtraMin" = $2, "costoExtraMax" = $3, mensaje = $4
             WHERE id = $5
             RETURNING *`,
            [precio, costoExtraMin, costoExtraMax, mensaje, idOferta]
        )
        return actualizada.rows[0]
    } catch (err) {
        console.error('Error en editarOferta:', err)
        throw err
    } finally {
        await client.end()
    }
}
    /**
     * Muestra los trabajos realizados (TERMINADO o CANCELADO) de un trabajador.
     */
   mostrarTrabajosRealizados = async (idTrabajador) => {
    const client = new Client(config)
    try {
        await client.connect()
        const sql = `
            SELECT
                ct.id,
                u.nombre,
                u.apellido,
                c.estrellas,
                ct.estado,
                ct.fecha_iniciado,
                ct.fecha_acabado,
                ct.distancia,
                ct.fijo,
                ct.precio,
                ct.servicio_id,
                ct.horario_requerido,
                ct.horario_finalizado,
                s.nombre AS servicio_nombre
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            WHERE ct."IdTrabajador" = $1
            AND ct.estado IN ('TERMINADO', 'CANCELADO')
        `
        const result = await client.query(sql, [idTrabajador])
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en mostrarTrabajosRealizados:', err)
        throw err
    } finally {
        await client.end()
    }
}

    /**
     * Resumen del día para el trabajador: ganancias, trabajos completados
     * y rating promedio, todo calculado sobre HOY (CURRENT_DATE).
     *
     * - ganancias_hoy y trabajos_completados: se calculan sobre
     *   "Cliente-Trabajador" con estado = 'TERMINADO' y fecha_acabado = hoy.
     * - rating: promedio de "ReseñaCliente".estrellas recibidas hoy.
     *   Si el trabajador no tiene reseñas hoy, devuelve null (el front puede
     *   mostrar el estrellas general del Trabajador como fallback).
     */
    obtenerResumenDiario = async (idTrabajador) => {
        const client = new Client(config)
        try {
            await client.connect()

            const sql = `
                SELECT
                    COALESCE((
                        SELECT SUM(ct.precio)
                        FROM "Cliente-Trabajador" ct
                        WHERE ct."IdTrabajador" = $1
                          AND ct.estado = 'TERMINADO'
                          AND ct.fecha_acabado = CURRENT_DATE
                    ), 0) AS ganancias_hoy,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM "Cliente-Trabajador" ct
                        WHERE ct."IdTrabajador" = $1
                          AND ct.estado = 'TERMINADO'
                          AND ct.fecha_acabado = CURRENT_DATE
                    ), 0) AS trabajos_completados,
                    (
                        SELECT AVG(r.estrellas)
                        FROM "ReseñaCliente" r
                        WHERE r."idTrabajador" = $1
                          AND r."fechaCreacion"::date = CURRENT_DATE
                    ) AS rating_hoy,
                    (
                        SELECT t.estrellas
                        FROM "Trabajador" t
                        WHERE t.id = $1
                    ) AS rating_general
            `

            const result = await client.query(sql, [idTrabajador])
            const row = result?.rows?.[0]

            if (!row) {
                return { ganancias_hoy: 0, trabajos_completados: 0, rating: 0 }
            }

            // Si hoy no tuvo reseñas, caemos al rating general del trabajador.
            const rating = row.rating_hoy !== null
                ? Number(row.rating_hoy)
                : Number(row.rating_general ?? 0)

            return {
                ganancias_hoy: Number(row.ganancias_hoy),
                trabajos_completados: Number(row.trabajos_completados),
                rating,
            }
        } catch (err) {
            console.error('Error en obtenerResumenDiario:', err)
            throw err
        } finally {
            await client.end()
        }
    }
/**
 * Ofertas cercanas para el trabajador: solo solicitudes PENDIENTE sin
 * asignar. Calcula la distancia real (haversine) entre la ubicación
 * del trabajador (obtenida de su propio Usuario vía IdPersona) y la
 * de LA SOLICITUD (ct.lat/ct.lng en Cliente-Trabajador). Solo servicios
 * que este trabajador ofrece.
 */
buscarOfertasCercanas = async (idTrabajador, radioKm = 20) => {
    const client = new Client(config)
    try {
        await client.connect()

        const sql = `
            WITH trab AS (
                SELECT ut.lat, ut.lng
                FROM "Trabajador" t
                INNER JOIN "Usuario" ut ON ut.id = t."IdPersona"
                WHERE t.id = $1
            )
            SELECT
                ct.id,
                ct.servicio_id,
                ct.horario_requerido,
                ct.horario_finalizado,
                ct.fijo,
                ct.emergencia,
                ct.precio,
                ct."precioEstimadoIA",
                ct.descripcion,
                ct.estado,
                ct.fecha_iniciado,
                ct.direccion,
                ct.lat,
                ct.lng,
                u.nombre,
                u.apellido,
                c.estrellas,
                s.nombre AS servicio_nombre,
                cs.nombre AS categoria_nombre,
                (
                    6371 * acos(
                        LEAST(1, GREATEST(-1,
                            cos(radians(trab.lat)) * cos(radians(ct.lat)) *
                            cos(radians(ct.lng) - radians(trab.lng)) +
                            sin(radians(trab.lat)) * sin(radians(ct.lat))
                        ))
                    )
                ) AS distancia
            FROM "Cliente-Trabajador" ct
            CROSS JOIN trab
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            LEFT JOIN "CategoriaServicio" cs ON cs.id = s.categoria_id
            WHERE ct.estado = 'PENDIENTE'
              AND ct."IdTrabajador" IS NULL
              AND trab.lat IS NOT NULL AND trab.lng IS NOT NULL
              AND ct.lat IS NOT NULL AND ct.lng IS NOT NULL
              AND ct.servicio_id IN (
                  SELECT servicios_id
                  FROM "Trabajador_Servicio"
                  WHERE trabajadores_id = $1
              )
              AND NOT EXISTS (
                  SELECT 1 FROM "Oferta" o
                  WHERE o."idTrabajo" = ct.id
                    AND o."idTrabajador" = $1
                    AND o."ESTADO_OFERTA" = 'PENDIENTE'
              )
              AND (
                  6371 * acos(
                      LEAST(1, GREATEST(-1,
                          cos(radians(trab.lat)) * cos(radians(ct.lat)) *
                          cos(radians(ct.lng) - radians(trab.lng)) +
                          sin(radians(trab.lat)) * sin(radians(ct.lat))
                      ))
                  )
              ) <= $2
            ORDER BY ct.emergencia DESC, distancia ASC
        `

        const result = await client.query(sql, [idTrabajador, radioKm])
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en buscarOfertasCercanas:', err)
        throw err
    } finally {
        await client.end()
    }
}

   obtenerDetalleOferta = async (idTrabajo, idTrabajador = null) => {
    const client = new Client(config)
    try {
        await client.connect()

        const sql = `
            SELECT
                ct.id,
                ct.descripcion,
                ct.horario_requerido,
                ct.horario_finalizado,
                ct.fijo,
                ct.emergencia,
                ct.precio,
                ct."precioEstimadoIA",
                ct.estado,
                ct.fecha_iniciado,
                ct.lat,
                ct.lng,
                ct.direccion,
                u.nombre,
                u.apellido,
                c.estrellas,
                s.nombre AS servicio_nombre,
                cs.nombre AS categoria_nombre,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object('id', si.id, 'url', si.url)
                            ORDER BY si.orden ASC
                        )
                        FROM "SolicitudImagen" si
                        WHERE si."idTrabajo" = ct.id
                    ), '[]'
                ) AS imagenes,
                CASE
                    WHEN $2::int IS NOT NULL AND ct.lat IS NOT NULL AND ct.lng IS NOT NULL THEN (
                        SELECT
                            6371 * acos(
                                LEAST(1, GREATEST(-1,
                                    cos(radians(ut.lat)) * cos(radians(ct.lat)) *
                                    cos(radians(ct.lng) - radians(ut.lng)) +
                                    sin(radians(ut.lat)) * sin(radians(ct.lat))
                                ))
                            )
                        FROM "Trabajador" t
                        INNER JOIN "Usuario" ut ON ut.id = t."IdPersona"
                        WHERE t.id = $2::int
                          AND ut.lat IS NOT NULL AND ut.lng IS NOT NULL
                    )
                    ELSE NULL
                END AS distancia
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            LEFT JOIN "CategoriaServicio" cs ON cs.id = s.categoria_id
            WHERE ct.id = $1
        `

        const result = await client.query(sql, [idTrabajo, idTrabajador])
        return result?.rows?.[0] ?? null
    } catch (err) {
        console.error('Error en obtenerDetalleOferta:', err)
        throw err
    } finally {
        await client.end()
    }
}

    /**
     * Registra un trabajador: inserta en Usuario y luego en Trabajador.
     * Recibe un objeto con todos los campos del modelo.
     */
 registrarTrabajador = async (trabajador) => {
    const client = new Client(config)

    try {
        const usuario = await this.#usuarioRepo.buscarPorEmail(trabajador.email)
        if (!usuario) throw new Error(`No existe un usuario con el email ${trabajador.email}`)

        await client.connect()

        const existeTrabajador = await client.query(
            `SELECT id FROM "Trabajador" WHERE "IdPersona" = $1`,
            [usuario.id]
        )
        if (existeTrabajador.rows.length > 0) throw new Error(`El usuario ${trabajador.email} ya es trabajador`)

        // Insertar en Trabajador SIN servicio_id
        const sqlTrabajador = `
            INSERT INTO "Trabajador"
            ("IdPersona", descripcion, "zonaTrabajo", "DispComienzo", "DispFinal", foto, estrellas)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id
        `
        const resultTrabajador = await client.query(sqlTrabajador, [
            usuario.id,
            trabajador.descripcion,
            trabajador.zonaTrabajo,
            trabajador.DispComienzo,
            trabajador.DispFinal,
            trabajador.foto,
            trabajador.estrellas
        ])

        const idTrabajador = resultTrabajador.rows[0].id

        // Insertar cada servicio en Trabajador_Servicio
        for (const servicioId of trabajador.servicios) {
            await client.query(
                `INSERT INTO "Trabajador_Servicio" (trabajadores_id, servicios_id) VALUES ($1, $2)`,
                [idTrabajador, servicioId]
            )
        }

        return { success: true, idUsuario: usuario.id, idTrabajador }

    } catch (err) {
        console.error('Error en registrarTrabajador:', err)
        throw err
    } finally {
        await client.end()
    }
}

    mostrarTodosLosTrabajadores = async () => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                SELECT
                    t.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.direccion,
                    u.telefono
                FROM "Trabajador" t
                INNER JOIN "Usuario" u ON t."IdPersona" = u.id
            `

            result = await client.query(sql)

        } catch (err) {
            console.error('Error en mostrarTodosLosClientes:', err)
            throw err
        } finally {
            await client.end()
        }

        return result?.rows ?? []
    }
   buscarSolicitudes = async (texto, ids = []) => {
    const client = new Client(config)
    try {
        await client.connect()

        let sql = `
            SELECT
                ct.id,
                ct.servicio_id,
                ct.horario_requerido,
                ct.horario_finalizado,
                ct.distancia,
                ct.fijo,
                ct.emergencia,
                ct.precio,
                ct.estado,
                ct.fecha_iniciado,
                u.nombre,
                u.apellido,
                u.email,
                u.telefono,
                c.estrellas,
                s.nombre AS especialidad
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON ct.servicio_id = s.id
            WHERE ct.estado = 'PENDIENTE'
            AND ct."IdTrabajador" IS NULL
        `

        const values = []

        if (texto && texto.trim()) {
            sql += ` AND (u.nombre ILIKE $1 OR u.apellido ILIKE $1)`
            values.push(`%${texto.trim()}%`)
        }

        if (ids.length > 0) {
            sql += ` AND ct.id = ANY($${values.length + 1})`
            values.push(ids)
        }

        const result = await client.query(sql, values)
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en buscarSolicitudes:', err)
        throw err
    } finally {
        await client.end()
    }
}
 obtenerEstado = async (idTrabajo) => {
        const client = new Client(config)
        try {
            await client.connect()
            const sql = `
                SELECT
                    ct.id,
                    ct.estado,
                    ct."IdCliente" AS "idCliente",
                    ct."IdTrabajador" AS "idTrabajador",
                    ct.llegada_cliente_at,
                    ct.llegada_trabajador_at,
                    ct.trabajo_iniciado_en,
                    ct.fin_cliente_at,
                    ct.fin_trabajador_at,
                    ct.fecha_acabado,
                    cli."IdPersona" AS "idUsuarioCliente",
                    trab."IdPersona" AS "idUsuarioTrabajador"
                FROM "Cliente-Trabajador" ct
                INNER JOIN "Cliente" cli ON cli.id = ct."IdCliente"
                LEFT JOIN "Trabajador" trab ON trab.id = ct."IdTrabajador"
                WHERE ct.id = $1
            `
            const result = await client.query(sql, [idTrabajo])
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en obtenerEstado (trabajo):', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // rol: 'CLIENTE' | 'TRABAJADOR'. Idempotente: si ya había confirmado,
    // no pisa la fecha original (COALESCE). Bloquea la fila con FOR UPDATE
    // para que dos confirmaciones simultáneas no pisen el chequeo de
    // "¿ya confirmaron ambos?".
    confirmarLlegada = async (idTrabajo, rol) => {
        const client = new Client(config)
        const columna = rol === 'CLIENTE' ? 'llegada_cliente_at' : 'llegada_trabajador_at'
        try {
            await client.connect()
            await client.query('BEGIN')

            const filaResult = await client.query(
                `SELECT id, estado, "IdCliente" AS "idCliente", "IdTrabajador" AS "idTrabajador"
                 FROM "Cliente-Trabajador"
                 WHERE id = $1
                 FOR UPDATE`,
                [idTrabajo]
            )
            const fila = filaResult.rows[0]
            if (!fila) throw new Error('El trabajo no existe')
            if (fila.estado !== 'EN PROCESO') throw new Error('Este trabajo no está en proceso')

            await client.query(
                `UPDATE "Cliente-Trabajador" SET ${columna} = COALESCE(${columna}, now()) WHERE id = $1`,
                [idTrabajo]
            )

            const actualizado = await client.query(
                `SELECT llegada_cliente_at, llegada_trabajador_at, trabajo_iniciado_en
                 FROM "Cliente-Trabajador" WHERE id = $1`,
                [idTrabajo]
            )
            const { llegada_cliente_at, llegada_trabajador_at, trabajo_iniciado_en } = actualizado.rows[0]

            let iniciadoAhora = false
            if (llegada_cliente_at && llegada_trabajador_at && !trabajo_iniciado_en) {
                await client.query(
                    `UPDATE "Cliente-Trabajador" SET trabajo_iniciado_en = now() WHERE id = $1`,
                    [idTrabajo]
                )
                iniciadoAhora = true
            }

            await client.query('COMMIT')

            return {
                idTrabajo,
                idCliente: fila.idCliente,
                idTrabajador: fila.idTrabajador,
                ambasLlegadasConfirmadas: !!(llegada_cliente_at && llegada_trabajador_at),
                trabajoIniciadoAhora: iniciadoAhora,
            }
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('Error en confirmarLlegada:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    confirmarFin = async (idTrabajo, rol) => {
        const client = new Client(config)
        const columna = rol === 'CLIENTE' ? 'fin_cliente_at' : 'fin_trabajador_at'
        try {
            await client.connect()
            await client.query('BEGIN')

            const filaResult = await client.query(
                `SELECT id, estado, trabajo_iniciado_en,
                        "IdCliente" AS "idCliente", "IdTrabajador" AS "idTrabajador"
                 FROM "Cliente-Trabajador"
                 WHERE id = $1
                 FOR UPDATE`,
                [idTrabajo]
            )
            const fila = filaResult.rows[0]
            if (!fila) throw new Error('El trabajo no existe')
            if (fila.estado !== 'EN PROCESO') throw new Error('Este trabajo no está en proceso')
            if (!fila.trabajo_iniciado_en) throw new Error('Todavía no se confirmó el inicio del trabajo')

            await client.query(
                `UPDATE "Cliente-Trabajador" SET ${columna} = COALESCE(${columna}, now()) WHERE id = $1`,
                [idTrabajo]
            )

            const actualizado = await client.query(
                `SELECT fin_cliente_at, fin_trabajador_at FROM "Cliente-Trabajador" WHERE id = $1`,
                [idTrabajo]
            )
            const { fin_cliente_at, fin_trabajador_at } = actualizado.rows[0]

            let terminadoAhora = false
            if (fin_cliente_at && fin_trabajador_at) {
                await client.query(
                    `UPDATE "Cliente-Trabajador"
                     SET estado = 'TERMINADO', fecha_acabado = CURRENT_DATE
                     WHERE id = $1 AND estado = 'EN PROCESO'`,
                    [idTrabajo]
                )
                terminadoAhora = true
            }

            await client.query('COMMIT')

            return {
                idTrabajo,
                idCliente: fila.idCliente,
                idTrabajador: fila.idTrabajador,
                ambosFinesConfirmados: !!(fin_cliente_at && fin_trabajador_at),
                trabajoTerminadoAhora: terminadoAhora,
            }
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('Error en confirmarFin:', err)
            throw err
        } finally {
            await client.end()
        }
    }

/**
 * Filtra solicitudes PENDIENTE. Cuando se pasa distanciaMax, la distancia
 * se calcula EN VIVO (haversine) entre la ubicación actual del trabajador
 * (idTrabajador) y la de cada solicitud (ct.lat/ct.lng) — igual que en
 * buscarOfertasCercanas. Antes esto comparaba contra ct.distancia, una
 * columna estática que no depende de quién está buscando, así que el
 * filtro de distancia nunca reflejaba la posición real del trabajador.
 */
filtrarSolicitudes = async (idTrabajador, estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta, precioMin, precioMax) => {
    const client = new Client(config)
    try {
        await client.connect()

        const usarDistancia = !!(distanciaMax && idTrabajador)

        let sql = `
            SELECT DISTINCT ct.id
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
        `

        if (usarDistancia) {
            sql += `
                CROSS JOIN (
                    SELECT ut.lat, ut.lng
                    FROM "Trabajador" t
                    INNER JOIN "Usuario" ut ON ut.id = t."IdPersona"
                    WHERE t.id = $1
                ) trab
            `
        }

        sql += `
            WHERE ct.estado = 'PENDIENTE'
            AND ct."IdTrabajador" IS NULL
        `

        const values = []
        let i = 1

        if (usarDistancia) {
            values.push(Number(idTrabajador))
            i = 2
        }

        if (estrellas) {
            sql += ` AND c.estrellas >= $${i++}`
            values.push(Number(estrellas))
        }

        if (servicio_id) {
            sql += ` AND ct.servicio_id = $${i++}`
            values.push(Number(servicio_id))
        }

        // fijo: 'true' = fijo, 'false' = subasta
        if (fijo !== undefined && fijo !== null && fijo !== '') {
            sql += ` AND ct.fijo = $${i++}`
            values.push(fijo === 'true')
        }

        if (emergencia !== undefined && emergencia !== null && emergencia !== '') {
            sql += ` AND ct.emergencia = $${i++}`
            values.push(emergencia === 'true')
        }

        if (usarDistancia) {
            sql += `
                AND trab.lat IS NOT NULL AND trab.lng IS NOT NULL
                AND ct.lat IS NOT NULL AND ct.lng IS NOT NULL
                AND (
                    6371 * acos(
                        LEAST(1, GREATEST(-1,
                            cos(radians(trab.lat)) * cos(radians(ct.lat)) *
                            cos(radians(ct.lng) - radians(trab.lng)) +
                            sin(radians(trab.lat)) * sin(radians(ct.lat))
                        ))
                    )
                ) <= $${i++}
            `
            values.push(Number(distanciaMax))
        }

        // horario_requerido: filtrar por rango
        if (horarioDesde) {
            sql += ` AND ct.horario_requerido <= $${i++}`
            values.push(horarioDesde)
        }
        if (horarioHasta) {
            sql += ` AND ct.horario_finalizado <= $${i++}`
            values.push(horarioHasta)
        }
        if (precioMin) {
            sql += ` AND ct.precio >= $${i++}`
            values.push(Number(precioMin))
        }
        if (precioMax) {
            sql += ` AND ct.precio <= $${i++}`
            values.push(Number(precioMax))
        }

        const result = await client.query(sql, values)
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en filtrarSolicitudes:', err)
        throw err
    } finally {
        await client.end()
    }
}
}