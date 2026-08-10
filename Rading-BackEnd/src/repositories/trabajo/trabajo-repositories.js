import config from '../../configs/dbconfig.js'
import pkg from 'pg'
const { Client } = pkg

export default class trabajoRepository {

    // Genera un código numérico de 4 dígitos para que el CLIENTE se lo
    // dicte al TRABAJADOR cuando llega al domicilio. Solo se puede generar
    // si el trabajo está EN PROCESO.
    generarCodigoLlegada = async (idTrabajo) => {
        const client = new Client(config)
        try {
            await client.connect()
            const codigo = Math.floor(1000 + Math.random() * 9000).toString() // 4 dígitos

            const sql = `
                UPDATE "Cliente-Trabajador"
                SET codigo_llegada = $1,
                    codigo_llegada_generado_en = now(),
                    codigo_llegada_intentos = 0
                WHERE id = $2 AND estado = 'EN PROCESO'
                RETURNING id
            `
            const result = await client.query(sql, [codigo, idTrabajo])
            if (result.rowCount === 0) throw new Error('El trabajo no existe o no está en proceso')

            return { codigo, validezMinutos: 15 }
        } catch (err) {
            console.error('Error en generarCodigoLlegada:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // Lo usa el TRABAJADOR: ingresa el código que le dictó el cliente.
    // Chequea vencimiento (15 min) y límite de intentos (5) antes de
    // aceptar. Bloquea la fila con FOR UPDATE para evitar carreras entre
    // intentos concurrentes.
    confirmarLlegadaConCodigo = async (idTrabajo, codigoIngresado) => {
        const client = new Client(config)
        const VALIDEZ_MINUTOS = 15
        const MAX_INTENTOS = 5

        try {
            await client.connect()
            await client.query('BEGIN')

            const filaResult = await client.query(
                `SELECT id, estado, codigo_llegada, codigo_llegada_generado_en, codigo_llegada_intentos,
                        "IdCliente" AS "idCliente", "IdTrabajador" AS "idTrabajador"
                 FROM "Cliente-Trabajador"
                 WHERE id = $1
                 FOR UPDATE`,
                [idTrabajo]
            )
            const fila = filaResult.rows[0]
            if (!fila) throw new Error('El trabajo no existe')
            if (fila.estado !== 'EN PROCESO') throw new Error('Este trabajo no está en proceso')
            if (!fila.codigo_llegada) throw new Error('Todavía no se generó un código de llegada')

            if (fila.codigo_llegada_intentos >= MAX_INTENTOS) {
                throw new Error('Se alcanzó el máximo de intentos. Pedile al cliente un código nuevo')
            }

            const minutosPasados = fila.codigo_llegada_generado_en
                ? (Date.now() - new Date(fila.codigo_llegada_generado_en).getTime()) / 60000
                : Infinity

            if (minutosPasados > VALIDEZ_MINUTOS) {
                throw new Error('El código venció. Pedile al cliente que genere uno nuevo')
            }

            if (fila.codigo_llegada !== codigoIngresado) {
                await client.query(
                    `UPDATE "Cliente-Trabajador" SET codigo_llegada_intentos = codigo_llegada_intentos + 1 WHERE id = $1`,
                    [idTrabajo]
                )
                await client.query('COMMIT')
                throw new Error('Código incorrecto')
            }

            await client.query(
                `UPDATE "Cliente-Trabajador"
                 SET llegada_trabajador_at = COALESCE(llegada_trabajador_at, now()),
                     trabajo_iniciado_en = COALESCE(trabajo_iniciado_en, now())
                 WHERE id = $1`,
                [idTrabajo]
            )

            await client.query('COMMIT')

            return {
                idTrabajo,
                idCliente: fila.idCliente,
                idTrabajador: fila.idTrabajador,
                trabajoIniciadoAhora: true,
            }
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('Error en confirmarLlegadaConCodigo:', err)
            throw err
        } finally {
            await client.end()
        }
    }
// Genera el código de 4 dígitos que el CLIENTE le dicta al TRABAJADOR
    // para cerrar el trabajo. Requiere que el trabajo ya esté iniciado.
    generarCodigoFin = async (idTrabajo) => {
        const client = new Client(config)
        try {
            await client.connect()
            const codigo = Math.floor(1000 + Math.random() * 9000).toString()

            const sql = `
                UPDATE "Cliente-Trabajador"
                SET codigo_fin = $1,
                    codigo_fin_generado_en = now(),
                    codigo_fin_intentos = 0
                WHERE id = $2 AND estado = 'EN PROCESO' AND trabajo_iniciado_en IS NOT NULL
                RETURNING id
            `
            const result = await client.query(sql, [codigo, idTrabajo])
            if (result.rowCount === 0) throw new Error('El trabajo no existe, no está en proceso o todavía no inició')

            return { codigo, validezMinutos: 15 }
        } catch (err) {
            console.error('Error en generarCodigoFin:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // Lo usa el TRABAJADOR: ingresa el código que le dictó el cliente para
    // cerrar el trabajo. Mismo esquema de vencimiento (15 min) e intentos
    // (5) que confirmarLlegadaConCodigo.
    confirmarFinConCodigo = async (idTrabajo, codigoIngresado) => {
        const client = new Client(config)
        const VALIDEZ_MINUTOS = 15
        const MAX_INTENTOS = 5

        try {
            await client.connect()
            await client.query('BEGIN')

            const filaResult = await client.query(
                `SELECT id, estado, trabajo_iniciado_en, codigo_fin, codigo_fin_generado_en, codigo_fin_intentos,
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
            if (!fila.codigo_fin) throw new Error('Todavía no se generó un código de cierre')

            if (fila.codigo_fin_intentos >= MAX_INTENTOS) {
                throw new Error('Se alcanzó el máximo de intentos. Pedile al cliente un código nuevo')
            }

            const minutosPasados = fila.codigo_fin_generado_en
                ? (Date.now() - new Date(fila.codigo_fin_generado_en).getTime()) / 60000
                : Infinity

            if (minutosPasados > VALIDEZ_MINUTOS) {
                throw new Error('El código venció. Pedile al cliente que genere uno nuevo')
            }

            if (fila.codigo_fin !== codigoIngresado) {
                await client.query(
                    `UPDATE "Cliente-Trabajador" SET codigo_fin_intentos = codigo_fin_intentos + 1 WHERE id = $1`,
                    [idTrabajo]
                )
                await client.query('COMMIT')
                throw new Error('Código incorrecto')
            }

            await client.query(
                `UPDATE "Cliente-Trabajador"
                 SET fin_trabajador_at = COALESCE(fin_trabajador_at, now()),
                     fin_cliente_at = COALESCE(fin_cliente_at, now()),
                     estado = 'TERMINADO',
                     fecha_acabado = CURRENT_DATE
                 WHERE id = $1`,
                [idTrabajo]
            )

            await client.query('COMMIT')

            return {
                idTrabajo,
                idCliente: fila.idCliente,
                idTrabajador: fila.idTrabajador,
                trabajoTerminadoAhora: true,
            }
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('Error en confirmarFinConCodigo:', err)
            throw err
        } finally {
            await client.end()
        }
    }
    // Estado completo de un trabajo + ids de Usuario (cliente y trabajador),
    // necesarios para saber quién es "enviadorId" al avisar por chat.
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
}