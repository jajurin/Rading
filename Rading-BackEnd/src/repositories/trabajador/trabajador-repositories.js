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
 
            // Cliente hereda de Usuario mediante IdPersona
            let sql = `
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
 
    /**
     * Filtra clientes por criterios y devuelve sus ids.
     */
    filtrarCl = async (estrellas, categoria, distancia, horario, fijo) => {
        const client = new Client(config)
        let result
 
        try {
            await client.connect()
 
            const sql = `
                SELECT c.id
                FROM "Cliente-Trabajador" ct
                INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
                WHERE c.estrellas >= $1
                AND ct.categoria = $2
                AND ct.distancia <= $3
                AND ct.horario = $4
                AND ct.fijo = $5
            `
 
            const values = [estrellas, categoria, distancia, horario, fijo]
            result = await client.query(sql, values)
 
        } catch (err) {
            console.error('Error en filtrarCl:', err)
            throw err
        } finally {
            await client.end()
        }
 
        return result?.rows ?? []
    }
 
    /**
     * Muestra los trabajos realizados (TERMINADO o CANCELADO) de un trabajador.
     */
    mostrarTrabajosRealizados = async (idTrabajador) => {
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
                    ct.fijo,
                    ct.estado,
                    ct."fecha_iniciado",
                    ct."fecha_acabado"
                FROM "Cliente-Trabajador" ct
                INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
                INNER JOIN "Usuario" u ON c."IdPersona" = u.id
                WHERE ct."IdTrabajador" = $1
                AND ct.estado IN ('TERMINADO', 'CANCELADO')
            `
 
            result = await client.query(sql, [idTrabajador])
 
        } catch (err) {
            console.error('Error en mostrarTrabajosRealizados:', err)
            throw err
        } finally {
            await client.end()
        }
 
        return result?.rows ?? []
    }
 
    /**
     * Registra un trabajador: inserta en Usuario y luego en Trabajador.
     * Recibe un objeto con todos los campos del modelo.
     */
  registrarTrabajador = async (trabajador) => {
    const client = new Client(config)

    try {
        // Buscar usuario existente
        const usuario = await this.#usuarioRepo.buscarPorEmail(
            trabajador.email
        )

        if (!usuario) {
            throw new Error(
                `No existe un usuario con el email ${trabajador.email}`
            )
        }

        await client.connect()

        // Evitar registrar dos veces al mismo trabajador
        const existeTrabajador = await client.query(
            `
            SELECT id
            FROM "Trabajador"
            WHERE "IdPersona" = $1
            `,
            [usuario.id]
        )

        if (existeTrabajador.rows.length > 0) {
            throw new Error(
                `El usuario ${trabajador.email} ya es trabajador`
            )
        }

        const sqlTrabajador = `
            INSERT INTO "Trabajador"
            (
                "IdPersona",
                categoria,
                descripcion,
                "zonaTrabajo",
                "DispComienzo",
                "DispFinal",
                foto,
                estrellas
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING id
        `

        const resultTrabajador = await client.query(
            sqlTrabajador,
            [
                usuario.id,
                trabajador.categoria,
                trabajador.descripcion,
                trabajador.zonaTrabajo,
                trabajador.DispComienzo,
                trabajador.DispFinal,
                trabajador.foto ?? null,
                0
            ]
        )

        return {
            success: true,
            idUsuario: usuario.id,
            idTrabajador: resultTrabajador.rows[0].id
        }

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
}