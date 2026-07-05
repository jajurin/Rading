import config from '../../configs/dbconfig.js'
    import usuarioRepository from '../general/usuario-repositories.js'
    import pkg from 'pg'
    const { Client } = pkg

    export default class clienteRepository {
        #usuarioRepo = new usuarioRepository()

        buscarTrabajador = async (texto, ids = []) => {
            const client = new Client(config)
            let result

            try {
                await client.connect()

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
                    FROM "Trabajador" t
                    INNER JOIN "Usuario" u ON t."IdPersona" = u.id
                    WHERE (
                        u.nombre ILIKE $1
                        OR u.apellido ILIKE $1
                    )
                `

                const values = [`%${texto}%`]

                if (ids.length > 0) {
                    sql += ` AND t.id = ANY($2)`
                    values.push(ids)
                }

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
                    idUsuario: usuario.id,
                    idCliente: resultCliente.rows[0].id
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

     // ← NUEVO: categoría preferida guardada en el Cliente
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

        // 👇 NUEVO: guarda la nota puntual en el trabajo calificado
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
    }