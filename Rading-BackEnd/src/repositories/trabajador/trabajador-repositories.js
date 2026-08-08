import config from '../../configs/dbconfig.js'
import usuarioRepository from '../general/usuario-repositories.js'
import pkg from 'pg'
const { Client } = pkg
 
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
 * asignar, dentro del radio pedido (usa la columna ct.distancia que ya
 * calculan) y solo de los servicios que este trabajador ofrece.
 */
buscarOfertasCercanas = async (idTrabajador, radioKm = 5) => {
    const client = new Client(config)
    try {
        await client.connect()

        const sql = `
            SELECT
                ct.id,
                ct.servicio_id,
                ct.horario_requerido,
                ct.horario_finalizado,
                ct.distancia,
                ct.fijo,
                ct.emergencia,
                ct.precio,
                ct."precioEstimadoIA",
                ct.descripcion,
                ct.estado,
                ct.fecha_iniciado,
                u.nombre,
                u.apellido,
                c.estrellas,
                s.nombre AS servicio_nombre,
                cs.nombre AS categoria_nombre
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
            LEFT JOIN "CategoriaServicio" cs ON cs.id = s.categoria_id
            WHERE ct.estado = 'PENDIENTE'
              AND ct."IdTrabajador" IS NULL
              AND ct.distancia <= $2
              AND ct.servicio_id IN (
                  SELECT servicios_id
                  FROM "Trabajador_Servicio"
                  WHERE trabajadores_id = $1
              )
            ORDER BY ct.emergencia DESC, ct.distancia ASC
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

filtrarSolicitudes = async (estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta, precioMin, precioMax) => {
    const client = new Client(config)
    try {
        await client.connect()

        let sql = `
            SELECT DISTINCT ct.id
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            WHERE ct.estado = 'PENDIENTE'
            AND ct."IdTrabajador" IS NULL
        `

        const values = []
        let i = 1

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

        if (distanciaMax) {
            sql += ` AND ct.distancia <= $${i++}`
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