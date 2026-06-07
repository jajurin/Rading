import config from '../../configs/dbconfig.js'
import usuarioRepository from '../general/usuario-repositories.js'
import pkg from 'pg'
const { Client } = pkg

export default class clienteRepository {
#usuarioRepo = new usuarioRepository() 
    /**
     * Busca trabajadores por nombre/apellido (texto libre).
     * Si se pasan ids, filtra solo entre esos ids (usado tras aplicar filtros).
     */
    buscarTrabajador = async (texto, ids = []) => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            // Trabajador hereda de Usuario mediante IdPersona
            let sql = `
                SELECT
                    t.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.direccion,
                    u.telefono,
                    t.categoria,
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

    /**
     * Filtra trabajadores por criterios y devuelve sus ids.
     * La tabla de unión se llama "Cliente-Trabajador" en el diagrama.
     */
    filtrarTr = async (estrellas, categoria, distancia, horario) => {
        const client = new Client(config)

        try {
            await client.connect()

            let sql = `
              SELECT DISTINCT t.id
                FROM "Trabajador" t
                LEFT JOIN "Cliente-Trabajador" ct ON ct."IdTrabajador" = t.id
                WHERE 1=1
            `

            const values = []
            let i = 1

            if (estrellas !== undefined && estrellas !== null) {
                sql += ` AND t.estrellas >= $${i}`
                values.push(Number(estrellas))
                i++
            }

            if (categoria) {
                sql += ` AND t.categoria = $${i}`
                values.push(categoria)
                i++
            }

            if (distancia !== undefined && distancia !== null) {
                sql += ` AND ct.distancia <= $${i}`
                values.push(Number(distancia))
                i++
            }

            if (horario) {
                sql += ` AND ct.horario = $${i}`
                values.push(horario)
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
    /**
     * Muestra los trabajos activos (EN PROCESO) de un cliente.
     */
    mostrarTrabajosActivos = async (idCliente) => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                SELECT
                    u.nombre,
                    u.apellido,
                    ct.distancia,
                    ct.horario,
                    ct.categoria,
                    ct.estado,
                    ct."fecha_iniciado"
                FROM "Cliente-Trabajador" ct
                INNER JOIN "Trabajador" t ON ct."IdTrabajador" = t.id
                INNER JOIN "Usuario" u ON t."IdPersona" = u.id
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

    /**
     * Registra un cliente: inserta en Usuario y luego en Cliente.
     * Recibe un objeto con todos los campos del modelo.
     */
   registrarCliente = async (cliente) => {
    const client = new Client(config)

    try {
        // Buscar usuario existente
        const usuario = await this.#usuarioRepo.buscarPorEmail(
            cliente.email
        )

        if (!usuario) {
            throw new Error(
                `No existe un usuario con el email ${cliente.email}`
            )
        }

        await client.connect()

        // Evitar registrar dos veces al mismo cliente
        const existeCliente = await client.query(
            `
            SELECT id
            FROM "Cliente"
            WHERE "IdPersona" = $1
            `,
            [usuario.id]
        )

        if (existeCliente.rows.length > 0) {
            throw new Error(
                `El usuario ${cliente.email} ya es cliente`
            )
        }

        const sqlCliente = `
            INSERT INTO "Cliente"
            (
                "IdPersona",
                preferencias,
                estrellas
            )
            VALUES ($1,$2,$3)
            RETURNING id
        `

        const resultCliente = await client.query(
            sqlCliente,
            [
                usuario.id,
                cliente.preferencias ?? null,
                0
            ]
        )

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
                    c.preferencias,
                    c.estrellas
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
}