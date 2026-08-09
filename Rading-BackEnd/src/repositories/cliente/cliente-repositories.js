import config from '../../configs/dbconfig.js'
    import usuarioRepository from '../general/usuario-repositories.js'
    import pkg from 'pg'
    const { Client } = pkg

    export default class clienteRepository {
        #usuarioRepo = new usuarioRepository()

       buscarTrabajador = async (filtros = {}) => {
    const {
        texto, estrellas, especialidad,
        horarioDesde, horarioHasta,
        lat, lng, radioKm,
    } = filtros

    const client = new Client(config)
    let result

    try {
        await client.connect()

        const values = []
        let i = 1

        const distanciaSelect = (lat != null && lng != null)
            ? `, (
                6371 * acos(
                    LEAST(1, GREATEST(-1,
                        cos(radians($${i})) * cos(radians(u.lat)) *
                        cos(radians(u.lng) - radians($${i + 1})) +
                        sin(radians($${i})) * sin(radians(u.lat))
                    ))
                )
              ) AS distancia_km`
            : ''

        if (lat != null && lng != null) {
            values.push(lat, lng)
            i += 2
        }

        let sql = `
            SELECT
                t.id,
                u.nombre,
                u.apellido,
                u.email,
                u.direccion,
                u.telefono,
                t.descripcion,
                t."zonaTrabajo",
                t."DispComienzo",
                t."DispFinal",
                t.foto,
                t.estrellas
                ${distanciaSelect}
            FROM "Trabajador" t
            INNER JOIN "Usuario" u ON t."IdPersona" = u.id
            WHERE 1=1
        `

        if (texto && texto.trim()) {
            sql += ` AND (u.nombre ILIKE $${i} OR u.apellido ILIKE $${i})`
            values.push(`%${texto.trim()}%`)
            i++
        }

        if (estrellas) {
            sql += ` AND t.estrellas >= $${i}`
            values.push(Number(estrellas))
            i++
        }

        if (especialidad) {
            sql += ` AND t.id IN (
                SELECT ts.trabajadores_id FROM "Trabajador_Servicio" ts
                INNER JOIN "Servicio" s ON s.id = ts.servicios_id
                WHERE s.nombre = $${i}
            )`
            values.push(especialidad)
            i++
        }

        if (horarioDesde) {
            sql += ` AND t."DispComienzo" <= $${i}::time`
            values.push(horarioDesde)
            i++
        }

        if (horarioHasta) {
            sql += ` AND t."DispFinal" >= $${i}::time`
            values.push(horarioHasta)
            i++
        }

        if (lat != null && lng != null && radioKm) {
            sql += ` AND (
                6371 * acos(
                    LEAST(1, GREATEST(-1,
                        cos(radians($1)) * cos(radians(u.lat)) *
                        cos(radians(u.lng) - radians($2)) +
                        sin(radians($1)) * sin(radians(u.lat))
                    ))
                )
            ) <= $${i}`
            values.push(radioKm)
            i++
        }

        sql += (lat != null && lng != null) ? ` ORDER BY distancia_km ASC` : ` ORDER BY u.nombre ASC`

        result = await client.query(sql, values)

    } catch (err) {
        console.error('Error en buscarTrabajador:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}

        buscarTrabajadorPorIds = async (ids) => {
            if (!ids || ids.length === 0) return []
            const client = new Client(config)

            try {
                await client.connect()

                const sql = `
                    SELECT
                        t.id,
                        u.nombre,
                        u.apellido,
                        u.email,
                        u.direccion,
                        u.telefono,
                        t.descripcion,
                        t."zonaTrabajo",
                        t."DispComienzo",
                        t."DispFinal",
                        t.foto,
                        t.estrellas
                    FROM "Trabajador" t
                    INNER JOIN "Usuario" u ON t."IdPersona" = u.id
                    WHERE t.id = ANY($1)
                `

                const result = await client.query(sql, [ids])
                return result?.rows ?? []

            } catch (err) {
                console.error('Error en buscarTrabajadorPorIds:', err)
                throw err
            } finally {
                await client.end()
            }
        }

        filtrarTr = async (estrellas, especialidad, horarioDesde, horarioHasta) => {
            const client = new Client(config)

            try {
                await client.connect()

                let sql = `
                    SELECT DISTINCT t.id
                    FROM "Trabajador" t
                    INNER JOIN "Trabajador_Servicio" ts ON ts.trabajadores_id = t.id
                    INNER JOIN "Servicio" s ON s.id = ts.servicios_id
                    INNER JOIN "CategoriaServicio" cs ON cs.id = s.categoria_id
                    WHERE 1=1
                `

                const values = []
                let i = 1

                if (estrellas !== undefined && estrellas !== null) {
                    sql += ` AND t.estrellas >= $${i}`
                    values.push(Number(estrellas))
                    i++
                }

                if (especialidad) {
                    sql += ` AND s.nombre = $${i}`
                    values.push(especialidad)
                    i++
                }

                if (horarioDesde) {
                    sql += ` AND t."DispComienzo" <= $${i}::time`
                    values.push(horarioDesde)
                    i++
                }

                if (horarioHasta) {
                    sql += ` AND t."DispFinal" >= $${i}::time`
                    values.push(horarioHasta)
                    i++
                }

                const result = await client.query(sql, values)
                return result?.rows ?? []

            } catch (err) {
                console.error('Error en filtrarTr:', err)
                throw err
            } finally {
                await client.end()
            }
        }

       mostrarTrabajosActivos = async (idCliente) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        const sql = `
            SELECT
                ct.id,
                t.id AS "idTrabajador",
                u.nombre,
                u.apellido,
                t.foto,
                t.estrellas,
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
            INNER JOIN "Trabajador" t ON ct."IdTrabajador" = t.id
            INNER JOIN "Usuario" u ON t."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            WHERE ct."IdCliente" = $1
            AND ct.estado = 'EN PROCESO'
        `
        result = await client.query(sql, [idCliente])
    } catch (err) {
        console.error('Error en mostrarTrabajosActivos:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}

       registrarCliente = async (cliente) => {
    const client = new Client(config)

    try {
        const usuario = await this.#usuarioRepo.buscarPorEmail(cliente.email)

        if (!usuario) {
            throw new Error(`No existe un usuario con el email ${cliente.email}`)
        }

        await client.connect()

        const existeCliente = await client.query(
            `SELECT id FROM "Cliente" WHERE "IdPersona" = $1`,
            [usuario.id]
        )

        if (existeCliente.rows.length > 0) {
            throw new Error(`El usuario ${cliente.email} ya es cliente`)
        }

        const sqlCliente = `
            INSERT INTO "Cliente"
            ("IdPersona", estrellas, categoria_id)
            VALUES ($1, $2, $3)
            RETURNING id
        `
        const resultCliente = await client.query(sqlCliente, [
            usuario.id,
            cliente.estrellas,
            cliente.categoriaId ?? null
        ])

        return {
            success: true,
            usuario: {
                id: usuario.id,
                idCliente: resultCliente.rows[0].id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                lat: usuario.lat ?? null,
                lng: usuario.lng ?? null,
                tipo: 'cliente',
            }
        }

    } catch (err) {
        console.error('Error en registrarCliente:', err)
        throw err
    } finally {
        await client.end()
    }
}

        mostrarTodosLosClientes = async () => {
            const client = new Client(config)
            let result

            try {
                await client.connect()

                const sql = `
                    SELECT
                        c.id,
                        u.nombre,
                        u.apellido,
                        u.email,
                        u.direccion,
                        u.telefono,
                        c.categoria_id,
                        c.estrellas,
                        c."reseñasEnv",
                        c."reseñasRec"
                    FROM "Cliente" c
                    INNER JOIN "Usuario" u ON c."IdPersona" = u.id
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

     // ← categoría preferida guardada en el Cliente
obtenerCategoriaCliente = async (idCliente) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        const sql = `
            SELECT categoria_id
            FROM "Cliente"
            WHERE id = $1
        `

        result = await client.query(sql, [idCliente])

    } catch (err) {
        console.error('Error en obtenerCategoriaCliente:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows[0]?.categoria_id ?? null
}
        mostrarServiciosPorCategoria = async (categoriaId) => {
            const client = new Client(config)
            let result

            try {
                await client.connect()

                const sql = `
                    SELECT id, nombre, categoria_id
                    FROM "Servicio"
                    WHERE categoria_id = $1
                    ORDER BY nombre
                `

                result = await client.query(sql, [categoriaId])

            } catch (err) {
                console.error('Error en mostrarServiciosPorCategoria:', err)
                throw err
            } finally {
                await client.end()
            }

            return result?.rows ?? []
        }

      mostrarRecientes = async (idCliente, limite = 6) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        const sql = `
            SELECT * FROM (
                SELECT DISTINCT ON (t.id)
                    t.id AS "idTrabajador",
                    ct.id AS "idTrabajo",
                    u.nombre,
                    u.apellido,
                    t.foto,
                    ct.estado,
                    ct.fecha_iniciado,
                    ct.fecha_acabado,
                    ct.precio,
                    ct."estrellasCliente",
                    s.nombre AS servicio_nombre
                FROM "Cliente-Trabajador" ct
                INNER JOIN "Trabajador" t ON ct."IdTrabajador" = t.id
                INNER JOIN "Usuario" u ON t."IdPersona" = u.id
                LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
                WHERE ct."IdCliente" = $1
                  AND ct.estado <> 'EN PROCESO'
                ORDER BY t.id, ct.fecha_iniciado DESC
            ) sub
            ORDER BY fecha_iniciado DESC
            LIMIT $2
        `

        result = await client.query(sql, [idCliente, limite])

    } catch (err) {
        console.error('Error en mostrarRecientes:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}
crearReseñaCliente = async (reseña) => {
    const client = new Client(config)

    try {
        await client.connect()
        await client.query('BEGIN')

        const sqlInsert = `
            INSERT INTO "ReseñaCliente"
           ("idTrabajador", "idCliente", "idTrabajo", estrellas, razon, descripcion, "comentarioBajaCalificacion", "bloqueoSolicitado")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `
        const values = [
            reseña.idTrabajador,
            reseña.idCliente,
            reseña.idTrabajo,
            reseña.estrellas,
            reseña.razon,
            reseña.descripcion,
            reseña.comentarioBajaCalificacion ?? null,
            reseña.bloqueoSolicitado ?? false
        ]

        const resultInsert = await client.query(sqlInsert, values)
        const idReseña = resultInsert.rows[0].id

        // Recalcula promedio real a partir de todas las reseñas del trabajador
        const sqlPromedio = `
            SELECT AVG(estrellas)::numeric(3,2) AS promedio, COUNT(*) AS total
            FROM "ReseñaCliente"
            WHERE "idTrabajador" = $1
        `
        const resultPromedio = await client.query(sqlPromedio, [reseña.idTrabajador])
        const { promedio, total } = resultPromedio.rows[0]

        await client.query(
            `UPDATE "Trabajador" SET estrellas = $1, "reseñasRec" = $2 WHERE id = $3`,
            [promedio, total, reseña.idTrabajador]
        )

        // guarda la nota puntual en el trabajo calificado
        await client.query(
            `UPDATE "Cliente-Trabajador" SET "estrellasCliente" = $1 WHERE id = $2`,
            [reseña.estrellas, reseña.idTrabajo]
        )

        await client.query('COMMIT')
        return { id: idReseña, nuevoPromedio: promedio, totalReseñas: total }

    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error en crearReseñaCliente:', err)
        throw err
    } finally {
        await client.end()
    }
}
// Cliente ve todas las ofertas pendientes de un trabajo (Cliente-Trabajador)
buscarOfertasPorTrabajo = async (idTrabajo) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        const sql = `
            SELECT
    o.id,
    o."idTrabajador",
    o.precio,
    o."costoExtraMin",
    o."costoExtraMax",
    o.mensaje,
    o."ESTADO_OFERTA" AS estado,
    u.nombre,
    u.apellido,
    t.foto,
    t.estrellas,
    ct.precio AS "precioSolicitud",
    ct.fijo,
    ct.emergencia,
    ct.subasta_termina AS "subastaTermina"
FROM "Oferta" o
INNER JOIN "Trabajador" t ON t.id = o."idTrabajador"
INNER JOIN "Usuario" u ON u.id = t."IdPersona"
INNER JOIN "Cliente-Trabajador" ct ON ct.id = o."idTrabajo"
WHERE o."idTrabajo" = $1
  AND o."ESTADO_OFERTA" = 'PENDIENTE'
ORDER BY o.fecha_creado ASC
        `
        result = await client.query(sql, [idTrabajo])
    } catch (err) {
        console.error('Error en buscarOfertasPorTrabajo:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}

// Cliente acepta una oferta → completa el Cliente-Trabajador que ya existía "abierto"
//
// FIX carrera con avisarSubastasVencidas: se bloquea la fila de
// Cliente-Trabajador con FOR UPDATE (así el cron espera si esta
// transacción está en curso, y viceversa) y el UPDATE final vuelve a
// chequear estado = 'PENDIENTE'. Además trae idUsuarioCliente (necesario
// para que el chat de aviso al trabajador figure como enviado por el
// cliente, no por el propio trabajador).
aceptarOferta = async (idOferta) => {
    const client = new Client(config)

    try {
        await client.connect()
        await client.query('BEGIN')

        const ofertaResult = await client.query(
            `SELECT
                o.id,
                o."idTrabajador",
                o.precio,
                o."ESTADO_OFERTA" AS estado_actual,
                ct.id AS "idTrabajo",
                ct."IdCliente" AS "idCliente",
                ct.estado AS "estadoTrabajo",
                ct."IdTrabajador" AS "idTrabajadorAsignado",
                ct.precio AS "precioSolicitud",
                trab."IdPersona" AS "idUsuarioTrabajador",
                cli."IdPersona" AS "idUsuarioCliente"
             FROM "Oferta" o
             INNER JOIN "Cliente-Trabajador" ct ON ct.id = o."idTrabajo"
             INNER JOIN "Trabajador" trab ON trab.id = o."idTrabajador"
             INNER JOIN "Cliente" cli ON cli.id = ct."IdCliente"
             WHERE o.id = $1
             FOR UPDATE OF ct`,
            [idOferta]
        )
        const oferta = ofertaResult.rows[0]

        if (!oferta) throw new Error('Oferta no encontrada')

        if (oferta.estado_actual !== 'PENDIENTE') {
            throw new Error('Esta oferta ya fue procesada')
        }
        if (oferta.estadoTrabajo !== 'PENDIENTE' || oferta.idTrabajadorAsignado != null) {
            throw new Error('Esta solicitud ya fue asignada a otro trabajador')
        }

        const precioFinal = oferta.precio ?? oferta.precioSolicitud

        const asignado = await client.query(
            `UPDATE "Cliente-Trabajador"
             SET "IdTrabajador" = $1, precio = $2, estado = 'EN PROCESO', fecha_iniciado = now()
             WHERE id = $3 AND estado = 'PENDIENTE' AND "IdTrabajador" IS NULL
             RETURNING id`,
            [oferta.idTrabajador, precioFinal, oferta.idTrabajo]
        )

        if (asignado.rowCount === 0) {
            throw new Error('Esta solicitud ya fue asignada a otro trabajador')
        }

        const ofertaActualizada = await client.query(
            `UPDATE "Oferta" SET "ESTADO_OFERTA" = 'ACEPTADA'
             WHERE id = $1 AND "ESTADO_OFERTA" = 'PENDIENTE'
             RETURNING id`,
            [idOferta]
        )
        if (ofertaActualizada.rowCount === 0) {
            throw new Error('Esta solicitud ya fue asignada a otro trabajador')
        }

        await client.query(
            `UPDATE "Oferta" SET "ESTADO_OFERTA" = 'RECHAZADA' WHERE "idTrabajo" = $1 AND id <> $2`,
            [oferta.idTrabajo, idOferta]
        )

        await client.query('COMMIT')

        return {
            idTrabajo: oferta.idTrabajo,
            idCliente: oferta.idCliente,
            idTrabajador: oferta.idTrabajador,
            idUsuarioTrabajador: oferta.idUsuarioTrabajador,
            idUsuarioCliente: oferta.idUsuarioCliente,
            precioFinal,
        }

    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error en aceptarOferta:', err.message)
        throw err
    } finally {
        await client.end()
    }
}
// Agrupa ofertas pendientes por cada trabajo "abierto" del cliente
contarOfertasPendientes = async (idCliente) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        const sql = `
           SELECT
    ct.id AS "idTrabajo",
    s.nombre AS servicio_nombre,
    ct.fijo,
    ct.emergencia,
    ct.subasta_termina AS "subastaTermina",
    COUNT(o.id) AS "cantidadOfertas"
FROM "Cliente-Trabajador" ct
LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
INNER JOIN "Oferta" o ON o."idTrabajo" = ct.id
    AND o."ESTADO_OFERTA" = 'PENDIENTE'
WHERE ct."IdCliente" = $1
  AND ct."IdTrabajador" IS NULL
GROUP BY ct.id, s.nombre, ct.fijo, ct.emergencia, ct.subasta_termina
ORDER BY ct.id DESC
        `
        result = await client.query(sql, [idCliente])

    } catch (err) {
        console.error('Error en contarOfertasPendientes:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}
    }