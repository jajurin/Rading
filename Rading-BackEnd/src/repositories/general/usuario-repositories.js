import config from '../../configs/dbconfig.js'
import pkg from 'pg'
const { Client } = pkg

export default class usuarioRepository {

    registrarUsuario = async (usuario) => {
        const client = new Client(config)
        try {
            await client.connect()

            const sql = `
                INSERT INTO "Usuario"
                (nombre, apellido, email, direccion, contrasena, telefono, "fechaNac", "DNI", "IdCuentaBancaria")
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                RETURNING id
            `
            const values = [
                usuario.nombre,
                usuario.apellido,
                usuario.email,
                usuario.direccion,
                usuario.contrasena,
                usuario.telefono,
                usuario.fechaNac,
                usuario.dni,
                usuario.IdCuentaBancaria ?? null
            ]

            const result = await client.query(sql, values)
            return result.rows[0].id

        } catch (err) {
            console.error('Error en registrarUsuario:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    buscarPorEmail = async (email) => {
        const client = new Client(config)
        try {
            await client.connect()
            const sql = `SELECT * FROM "Usuario" WHERE email = $1 LIMIT 1`
            const result = await client.query(sql, [email])
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en buscarPorEmail:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // 👇 Nuevo: verificar DNI duplicado
    buscarPorDni = async (dni) => {
        const client = new Client(config)
        try {
            await client.connect()
            const sql = `SELECT * FROM "Usuario" WHERE "DNI" = $1 LIMIT 1`
            const result = await client.query(sql, [dni])
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en buscarPorDni:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    existeEmail = async (email) => {
        const usuario = await this.buscarPorEmail(email)
        return usuario !== null
    }
    buscarPorDni = async (dni) => {
    const client = new Client(config)
    try {
        await client.connect()
        const sql = `SELECT * FROM "Usuario" WHERE "DNI" = $1 LIMIT 1`
        const result = await client.query(sql, [dni])
        return result.rows[0] ?? null
    } finally {
        await client.end()
    }
}
esTrabajador = async (idUsuario) => {
    const client = new Client(config)
    try {
        await client.connect()
        // Cambiá "Trabajador" por el nombre exacto de tu tabla
        const sql = `SELECT id FROM "Trabajador" WHERE id = $1 LIMIT 1`
        const result = await client.query(sql, [idUsuario])
        return result.rows.length > 0
    } catch (err) {
        console.error('Error en esTrabajador:', err)
        throw err
    } finally {
        await client.end()
    }
}
buscarIdCliente = async (idUsuario) => {
    const client = new Client(config)
    try {
        await client.connect()
        const sql = `SELECT id FROM "Cliente" WHERE "IdPersona" = $1 LIMIT 1`
        const result = await client.query(sql, [idUsuario])
        return result.rows[0]?.id ?? null
    } catch (err) {
        console.error('Error en buscarIdCliente:', err)
        throw err
    } finally {
        await client.end()
    }
}
}