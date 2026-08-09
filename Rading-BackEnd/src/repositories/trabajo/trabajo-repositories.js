    import config from '../../configs/dbconfig.js'
    import pkg from 'pg'
    const { Client } = pkg

    export default class trabajoRepository {

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