import { Client } from '../../configs/db.js'
import config from '../../configs/dbconfig.js'

const THROTTLE_SEGUNDOS_MENSAJE = 60

// Qué columna de configuracionusuario controla cada tipo de notificación.
// Los tipos que no están acá (códigos de llegada/cierre, trabajo finalizado)
// se envían siempre, porque son parte del flujo del trabajo.
const PREF_POR_TIPO = {
    MENSAJE: 'notifmensajes',

    OFERTA_NUEVA: 'notifofertas',
    SOLICITUD_NUEVA: 'notifofertas',
    OFERTA_ACEPTADA: 'notifofertas',
    OFERTA_RECHAZADA: 'notifofertas',
    TRABAJO_ACEPTADO: 'notifofertas',
    SUBASTA_CIERRE: 'notifofertas',

    RESEÑA_NUEVA: 'notifresenas',
}

// Tipos que no deben repetirse: si ya existe una notificación igual
// (mismos valores en `data`), no se crea otra.
// `texto` se compara como texto y `numero` como número (93600 == "93600.00").
const DEDUPE_POR_TIPO = {
    OFERTA_NUEVA: { texto: ['idTrabajo', 'idTrabajador'], numero: ['precio'] },
}

export default class notificacionRepository {

    // Devuelve la notificación creada, o null si:
    //  - el usuario tiene desactivado ese tipo de aviso en Configuración, o
    //  - ya existe una notificación igual (ver DEDUPE_POR_TIPO).
    crear = async ({ idUsuario, tipo, titulo, mensaje, data = {} }) => {
        const client = new Client(config)
        let enTransaccion = false
        try {
            await client.connect()

            // Las columnas/claves salen de mapas fijos (nunca del input), así que es seguro interpolarlas.
            const filtros = []

            // Si el usuario no tiene fila en configuracionusuario, se asume activado.
            const col = PREF_POR_TIPO[tipo]
            if (col) {
                filtros.push(
                    `COALESCE((SELECT cu.${col} FROM configuracionusuario cu WHERE cu.idusuario = $1::bigint), true)`
                )
            }

            const dedupe = DEDUPE_POR_TIPO[tipo]
            let claveLock = null
            if (dedupe) {
                const iguales = [
                    ...dedupe.texto.map(
                        (k) => `(n.data->>'${k}') IS NOT DISTINCT FROM ($5::jsonb->>'${k}')`
                    ),
                    ...dedupe.numero.map(
                        (k) => `NULLIF(n.data->>'${k}', '')::numeric IS NOT DISTINCT FROM NULLIF($5::jsonb->>'${k}', '')::numeric`
                    ),
                ]
                filtros.push(
                    `NOT EXISTS (
                         SELECT 1 FROM "Notificacion" n
                         WHERE n."idUsuario" = $1::bigint
                           AND n.tipo = $2::varchar
                           AND ${iguales.join(' AND ')}
                     )`
                )
                // Lock por clave: si llegan dos pedidos idénticos al mismo tiempo,
                // el segundo espera al primero y recién ahí evalúa el NOT EXISTS.
                claveLock = `${tipo}:${idUsuario}:${dedupe.texto.map((k) => data[k]).join(':')}`
                await client.query('BEGIN')
                enTransaccion = true
                await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [claveLock])
            }

            const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''

            const result = await client.query(
                `INSERT INTO "Notificacion" ("idUsuario", tipo, titulo, mensaje, data, leida, created_at)
                 SELECT $1::bigint, $2::varchar, $3::varchar, $4::varchar, $5::jsonb, false, now()
                 ${where}
                 RETURNING id, "idUsuario", tipo, titulo, mensaje, data, leida, created_at`,
                [idUsuario, tipo, titulo, mensaje, JSON.stringify(data)]
            )

            if (enTransaccion) {
                await client.query('COMMIT')
                enTransaccion = false
            }
            return result.rows[0] ?? null
        } catch (err) {
            if (enTransaccion) {
                try { await client.query('ROLLBACK') } catch {}
            }
            console.error('Error en notificacionRepository.crear:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    crearMensajeConThrottle = async ({ idUsuario, chatId, titulo, mensaje, data = {} }) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `INSERT INTO "Notificacion" ("idUsuario", tipo, titulo, mensaje, data, leida, created_at)
                 SELECT $1::bigint, 'MENSAJE', $2::varchar, $3::varchar, $4::jsonb, false, now()
                 WHERE COALESCE(
                         (SELECT cu.notifmensajes FROM configuracionusuario cu WHERE cu.idusuario = $1::bigint),
                         true
                       )
                   AND NOT EXISTS (
                     SELECT 1 FROM "Notificacion" n
                     WHERE n."idUsuario" = $1::bigint
                       AND n.tipo = 'MENSAJE'
                       AND n.data->>'chatId' = $5
                       AND n.created_at > now() - ($6 || ' seconds')::interval
                   )
                 RETURNING id`,
                [idUsuario, titulo, mensaje, JSON.stringify(data), String(chatId), String(THROTTLE_SEGUNDOS_MENSAJE)]
            )
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en notificacionRepository.crearMensajeConThrottle:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    // Salta a los trabajadores que tienen desactivadas las notificaciones de ofertas
    crearParaTrabajadoresDeServicio = async ({ servicioId, titulo, mensaje, data = {} }) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `INSERT INTO "Notificacion" ("idUsuario", tipo, titulo, mensaje, data, leida, created_at)
                 SELECT t."IdPersona", 'SOLICITUD_NUEVA', $1, $2, $3, false, now()
                 FROM "Trabajador_Servicio" ts
                 INNER JOIN "Trabajador" t ON t.id = ts.trabajadores_id
                 LEFT JOIN configuracionusuario cu ON cu.idusuario = t."IdPersona"
                 WHERE ts.servicios_id = $4
                   AND COALESCE(cu.notifofertas, true)
                 RETURNING id`,
                [titulo, mensaje, JSON.stringify(data), servicioId]
            )
            return result.rows.length
        } catch (err) {
            console.error('Error en notificacionRepository.crearParaTrabajadoresDeServicio:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    listar = async (idUsuario, limite = 50) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT id, "idUsuario", tipo, titulo, mensaje, data, leida, created_at
                 FROM "Notificacion"
                 WHERE "idUsuario" = $1
                 ORDER BY created_at DESC
                 LIMIT $2`,
                [idUsuario, limite]
            )
            return result.rows
        } catch (err) {
            console.error('Error en notificacionRepository.listar:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    contarNoLeidas = async (idUsuario) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT COUNT(*) AS cantidad FROM "Notificacion"
                 WHERE "idUsuario" = $1 AND leida = false`,
                [idUsuario]
            )
            return Number(result.rows[0].cantidad)
        } catch (err) {
            console.error('Error en notificacionRepository.contarNoLeidas:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    marcarLeida = async (idNotificacion, idUsuario) => {
        const client = new Client(config)
        try {
            await client.connect()
            await client.query(
                `UPDATE "Notificacion" SET leida = true
                 WHERE id = $1 AND "idUsuario" = $2`,
                [idNotificacion, idUsuario]
            )
        } catch (err) {
            console.error('Error en notificacionRepository.marcarLeida:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    marcarTodasLeidas = async (idUsuario) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `UPDATE "Notificacion" SET leida = true
                 WHERE "idUsuario" = $1 AND leida = false`,
                [idUsuario]
            )
            return result.rowCount
        } catch (err) {
            console.error('Error en notificacionRepository.marcarTodasLeidas:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    // ── Resolvers de contexto ───────────────────────────────────────────────

    obtenerContextoOferta = async (idTrabajo, idTrabajador) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT
                    ct."IdCliente" AS "idCliente",
                    cli."IdPersona" AS "idUsuarioCliente",
                    ct.servicio_id AS "servicioId",
                    s.nombre AS "servicioNombre",
                    ct.precio AS "precioSolicitud",
                    t.id AS "idTrabajador",
                    t."IdPersona" AS "idUsuarioTrabajador",
                    ut.nombre AS "trabajadorNombre",
                    ut.apellido AS "trabajadorApellido",
                    uc.nombre AS "clienteNombre",
                    uc.apellido AS "clienteApellido"
                 FROM "Cliente-Trabajador" ct
                 INNER JOIN "Cliente" cli ON cli.id = ct."IdCliente"
                 INNER JOIN "Usuario" uc ON uc.id = cli."IdPersona"
                 LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
                 INNER JOIN "Trabajador" t ON t.id = $2
                 INNER JOIN "Usuario" ut ON ut.id = t."IdPersona"
                 WHERE ct.id = $1`,
                [idTrabajo, idTrabajador]
            )
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en notificacionRepository.obtenerContextoOferta:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    obtenerContextoTrabajo = async (idTrabajo) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT
                    ct."IdCliente" AS "idCliente",
                    cli."IdPersona" AS "idUsuarioCliente",
                    ct."IdTrabajador" AS "idTrabajador",
                    trab."IdPersona" AS "idUsuarioTrabajador",
                    s.nombre AS "servicioNombre",
                    ct.precio AS "precio",
                    uc.nombre AS "clienteNombre",
                    uc.apellido AS "clienteApellido",
                    ut.nombre AS "trabajadorNombre",
                    ut.apellido AS "trabajadorApellido"
                 FROM "Cliente-Trabajador" ct
                 INNER JOIN "Cliente" cli ON cli.id = ct."IdCliente"
                 INNER JOIN "Usuario" uc ON uc.id = cli."IdPersona"
                 LEFT JOIN "Trabajador" trab ON trab.id = ct."IdTrabajador"
                 LEFT JOIN "Usuario" ut ON ut.id = trab."IdPersona"
                 LEFT JOIN "Servicio" s ON s.id = ct.servicio_id
                 WHERE ct.id = $1`,
                [idTrabajo]
            )
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en notificacionRepository.obtenerContextoTrabajo:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    obtenerContextoChat = async (chatId) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT
                    c.id_cliente AS "idCliente",
                    cli."IdPersona" AS "idUsuarioCliente",
                    uc.nombre AS "clienteNombre",
                    c.id_trabajador AS "idTrabajador",
                    trab."IdPersona" AS "idUsuarioTrabajador",
                    ut.nombre AS "trabajadorNombre"
                 FROM "Chat" c
                 INNER JOIN "Cliente" cli ON cli.id = c.id_cliente
                 INNER JOIN "Usuario" uc ON uc.id = cli."IdPersona"
                 INNER JOIN "Trabajador" trab ON trab.id = c.id_trabajador
                 INNER JOIN "Usuario" ut ON ut.id = trab."IdPersona"
                 WHERE c.id = $1`,
                [chatId]
            )
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en notificacionRepository.obtenerContextoChat:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }

    obtenerUsuarioTrabajadorPorTrabajo = async (idTrabajo) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT t."IdPersona" AS "idUsuarioTrabajador",
                        ut.nombre, ut.apellido
                 FROM "Cliente-Trabajador" ct
                 INNER JOIN "Trabajador" t ON t.id = ct."IdTrabajador"
                 INNER JOIN "Usuario" ut ON ut.id = t."IdPersona"
                 WHERE ct.id = $1`,
                [idTrabajo]
            )
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en notificacionRepository.obtenerUsuarioTrabajadorPorTrabajo:', err.message)
            throw err
        } finally {
            await client.end()
        }
    }
}