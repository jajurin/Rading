import { Client } from '../../configs/db.js'
import { hashear, esHash } from '../../utils/password.js'
import config from '../../configs/dbconfig.js'

export default class usuarioRepository {

    registrarUsuario = async (usuario) => {
        const client = new Client()
        try {
            await client.connect()

            // La contraseña nunca se guarda en texto plano.
            const contrasena = esHash(usuario.contrasena) ? usuario.contrasena : await hashear(usuario.contrasena)

            const sql = `
                INSERT INTO "Usuario"
                (nombre, apellido, email, direccion, contrasena, telefono, "fechaNac", "DNI", "IdCuentaBancaria", lat, lng)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                RETURNING id
            `
            const values = [
                usuario.nombre,
                usuario.apellido,
                usuario.email,
                usuario.direccion,
                contrasena,
                usuario.telefono,
                usuario.fechaNac,
                usuario.dni,
                usuario.IdCuentaBancaria ?? null,
                usuario.lat ?? null,
                usuario.lng ?? null
            ]

            const result = await client.query(sql, values)
            return result.rows[0].id
        } catch (err) {
            console.error('Error en registrarUsuario:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    buscarPorEmail = async (email) => {
        const client = new Client()
        try {
            await client.connect()
            const result = await client.query(`SELECT * FROM "Usuario" WHERE email = $1 LIMIT 1`, [email])
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en buscarPorEmail:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    buscarPorDni = async (dni) => {
        const client = new Client()
        try {
            await client.connect()
            const result = await client.query(`SELECT * FROM "Usuario" WHERE "DNI" = $1 LIMIT 1`, [dni])
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en buscarPorDni:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    existeEmail = async (email) => {
        const usuario = await this.buscarPorEmail(email)
        return usuario !== null
    }

    actualizarContrasena = async (idUsuario, contrasenaHasheada) => {
        const client = new Client()
        try {
            await client.connect()
            await client.query(`UPDATE "Usuario" SET contrasena = $1 WHERE id = $2`, [contrasenaHasheada, idUsuario])
        } finally {
            await client.end()
        }
    }

    buscarIdTrabajador = async (idUsuario) => {
        const client = new Client()
        try {
            await client.connect()
            const result = await client.query(`SELECT id FROM "Trabajador" WHERE "IdPersona" = $1 LIMIT 1`, [idUsuario])
            return result.rows[0]?.id ?? null
        } catch (err) {
            console.error('Error en buscarIdTrabajador:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    esTrabajador = async (idUsuario) => {
        const client = new Client()
        try {
            await client.connect()
            const result = await client.query(`SELECT id FROM "Trabajador" WHERE "IdPersona" = $1 LIMIT 1`, [idUsuario])
            return result.rows.length > 0
        } catch (err) {
            console.error('Error en esTrabajador:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    buscarIdCliente = async (idUsuario) => {
        const client = new Client()
        try {
            await client.connect()
            const result = await client.query(`SELECT id FROM "Cliente" WHERE "IdPersona" = $1 LIMIT 1`, [idUsuario])
            return result.rows[0]?.id ?? null
        } catch (err) {
            console.error('Error en buscarIdCliente:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }
}