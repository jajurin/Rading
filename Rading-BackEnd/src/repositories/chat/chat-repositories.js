import config from '../../configs/dbconfig.js'
import pkg from 'pg'
const { Client } = pkg

export default class chatRepository {

    // Busca el chat entre un cliente y un trabajador. Si no existe, lo crea.
    buscarOCrearChat = async (idCliente, idTrabajador) => {
        const client = new Client(config)
        try {
            await client.connect()

            const buscar = await client.query(
                `SELECT id FROM "Chat" WHERE id_cliente = $1 AND id_trabajador = $2`,
                [idCliente, idTrabajador]
            )

            if (buscar.rows.length > 0) return buscar.rows[0].id

            const crear = await client.query(
                `INSERT INTO "Chat" (id_cliente, id_trabajador, updated_at)
                 VALUES ($1, $2, now())
                 RETURNING id`,
                [idCliente, idTrabajador]
            )

            return crear.rows[0].id
        } catch (err) {
            console.error('Error en buscarOCrearChat:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // Lista de chats del cliente, con último mensaje y no leídos
    obtenerChatsCliente = async (idCliente) => {
        const client = new Client(config)
        try {
            await client.connect()
            const sql = `
                SELECT
                    c.id AS chat_id,
                    c.id_trabajador,
                    c.last_message_at,
                    u.nombre,
                    u.apellido,
                    t.foto,
                    ult.contenido AS ultimo_mensaje,
                    ult.tipo AS ultimo_tipo,
                    ult.enviador_id AS ultimo_enviador_id,
                    ult.created_at AS ultimo_created_at,
                    (
                        SELECT COUNT(*) FROM "Mensajes" m
                        WHERE m.chat_id = c.id
                        AND m.enviador_id <> $1
                        AND m.deleted_at IS NULL
                        AND NOT EXISTS (
                            SELECT 1 FROM "Mensajes_Estatus" me
                            WHERE me.mensaje_id = m.id AND me.user_id = $1
                        )
                    ) AS no_leidos
                FROM "Chat" c
                INNER JOIN "Trabajador" t ON t.id = c.id_trabajador
                INNER JOIN "Usuario" u ON u.id = t."IdPersona"
                LEFT JOIN LATERAL (
                    SELECT contenido, tipo, enviador_id, created_at
                    FROM "Mensajes"
                    WHERE chat_id = c.id AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                ) ult ON true
                WHERE c.id_cliente = $1
                ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            `
            const result = await client.query(sql, [idCliente])
            return result?.rows ?? []
        } catch (err) {
            console.error('Error en obtenerChatsCliente:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // Lista de chats del trabajador (misma lógica, invertida)
    obtenerChatsTrabajador = async (idTrabajador) => {
        const client = new Client(config)
        try {
            await client.connect()
            const sql = `
                SELECT
                    c.id AS chat_id,
                    c.id_cliente,
                    c.last_message_at,
                    u.nombre,
                    u.apellido,
                    ult.contenido AS ultimo_mensaje,
                    ult.tipo AS ultimo_tipo,
                    ult.enviador_id AS ultimo_enviador_id,
                    ult.created_at AS ultimo_created_at,
                    (
                        SELECT COUNT(*) FROM "Mensajes" m
                        WHERE m.chat_id = c.id
                        AND m.enviador_id <> $1
                        AND m.deleted_at IS NULL
                        AND NOT EXISTS (
                            SELECT 1 FROM "Mensajes_Estatus" me
                            WHERE me.mensaje_id = m.id AND me.user_id = $1
                        )
                    ) AS no_leidos
                FROM "Chat" c
                INNER JOIN "Cliente" cl ON cl.id = c.id_cliente
                INNER JOIN "Usuario" u ON u.id = cl."IdPersona"
                LEFT JOIN LATERAL (
                    SELECT contenido, tipo, enviador_id, created_at
                    FROM "Mensajes"
                    WHERE chat_id = c.id AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                ) ult ON true
                WHERE c.id_trabajador = $1
                ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            `
            const result = await client.query(sql, [idTrabajador])
            return result?.rows ?? []
        } catch (err) {
            console.error('Error en obtenerChatsTrabajador:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // Mensajes de un chat, con estado de lectura de cada uno
    // Mensajes de un chat, con estado de lectura de cada uno
obtenerMensajes = async (chatId) => {
    const client = new Client(config)
    try {
        await client.connect()
        const sql = `
            SELECT
                m.id,
                m.chat_id,
                m.enviador_id,
                m.contenido,
                m.tipo,
                m.created_at,
                EXISTS (
                    SELECT 1 FROM "Mensajes_Estatus" me
                    WHERE me.mensaje_id = m.id AND me.user_id <> m.enviador_id
                ) AS leido
            FROM "Mensajes" m
            WHERE m.chat_id = $1 AND m.deleted_at IS NULL
            ORDER BY m.created_at ASC
        `
        const result = await client.query(sql, [chatId])
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en obtenerMensajes:', err)
        throw err
    } finally {
        await client.end()
    }
}
   // Reemplazá el método enviarMensaje por este:
enviarMensaje = async ({ chatId, idCliente, idTrabajador, enviadorId, contenido, tipo = 'TEXTO' }) => {
    const client = new Client(config)
    try {
        await client.connect()
        await client.query('BEGIN')

        let finalChatId = chatId

        // Si no vino chatId, buscamos o creamos el chat entre cliente y trabajador
        if (!finalChatId) {
            const buscar = await client.query(
                `SELECT id FROM "Chat" WHERE id_cliente = $1 AND id_trabajador = $2`,
                [idCliente, idTrabajador]
            )

            if (buscar.rows.length > 0) {
                finalChatId = buscar.rows[0].id
            } else {
                const crear = await client.query(
                    `INSERT INTO "Chat" (id_cliente, id_trabajador, updated_at)
                     VALUES ($1, $2, now())
                     RETURNING id`,
                    [idCliente, idTrabajador]
                )
                finalChatId = crear.rows[0].id
            }
        }

        const sql = `
            INSERT INTO "Mensajes" (chat_id, enviador_id, contenido, tipo)
            VALUES ($1, $2, $3, $4)
            RETURNING id, chat_id, enviador_id, contenido, tipo, created_at
        `
        const result = await client.query(sql, [finalChatId, enviadorId, contenido, tipo])

        await client.query(
            `UPDATE "Chat" SET last_message_at = now(), updated_at = now() WHERE id = $1`,
            [finalChatId]
        )

        await client.query('COMMIT')
        return result.rows[0]
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error en enviarMensaje:', err)
        throw err
    } finally {
        await client.end()
    }
}



// Guarda un mensaje de tipo ARCHIVO (imagen o documento ya subido a disco/storage)
enviarMensajeArchivo = async ({ chatId, idCliente, idTrabajador, enviadorId, archivoUrl, archivoNombre, tipo }) => {
    const client = new Client(config)
    try {
        await client.connect()
        await client.query('BEGIN')

        let finalChatId = chatId

        if (!finalChatId) {
            const buscar = await client.query(
                `SELECT id FROM "Chat" WHERE id_cliente = $1 AND id_trabajador = $2`,
                [idCliente, idTrabajador]
            )
            if (buscar.rows.length > 0) {
                finalChatId = buscar.rows[0].id
            } else {
                const crear = await client.query(
                    `INSERT INTO "Chat" (id_cliente, id_trabajador, updated_at)
                     VALUES ($1, $2, now())
                     RETURNING id`,
                    [idCliente, idTrabajador]
                )
                finalChatId = crear.rows[0].id
            }
        }

        // Guardamos la URL del archivo como contenido; archivoNombre queda
        // en un aparte por si después querés mostrarlo distinto en el chat
        const sql = `
            INSERT INTO "Mensajes" (chat_id, enviador_id, contenido, tipo)
            VALUES ($1, $2, $3, $4)
            RETURNING id, chat_id, enviador_id, contenido, tipo, created_at
        `
        const result = await client.query(sql, [finalChatId, enviadorId, archivoUrl, tipo])

        await client.query(
            `UPDATE "Chat" SET last_message_at = now(), updated_at = now() WHERE id = $1`,
            [finalChatId]
        )

        await client.query('COMMIT')
        return { ...result.rows[0], archivoNombre }
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error en enviarMensajeArchivo:', err)
        throw err
    } finally {
        await client.end()
    }
}
    // Marca como leídos todos los mensajes del chat que NO son del usuario que abre el chat
    marcarComoLeidos = async (chatId, userId) => {
        const client = new Client(config)
        try {
            await client.connect()
            const sql = `
                INSERT INTO "Mensajes_Estatus" (mensaje_id, user_id, leido_fecha)
                SELECT m.id, $2, now()
                FROM "Mensajes" m
                WHERE m.chat_id = $1
                AND m.enviador_id <> $2
                AND NOT EXISTS (
                    SELECT 1 FROM "Mensajes_Estatus" me
                    WHERE me.mensaje_id = m.id AND me.user_id = $2
                )
                RETURNING mensaje_id
            `
            const result = await client.query(sql, [chatId, userId])
            return result?.rows ?? []
        } catch (err) {
            console.error('Error en marcarComoLeidos:', err)
            throw err
        } finally {
            await client.end()
        }
    }
}