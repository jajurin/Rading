import config from '../../configs/dbconfig.js'
import pkg from 'pg'
const { Client } = pkg

// Si la última posición tiene más de esto, se considera vieja (el celu del
// trabajador dejó de reportar: app cerrada, sin señal, etc.)
const UBICACION_VIGENCIA_MIN = 5

export default class ubicacionRepository {

    // Lo llama el TRABAJADOR cada ~10 s mientras va en camino.
    // Solo guarda si el trabajo es suyo, está EN PROCESO y todavía no
    // confirmó la llegada: después de llegar ya no se comparte nada.
    guardarUbicacionTrabajador = async (idTrabajo, idTrabajador, lat, lng) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `UPDATE "Cliente-Trabajador"
                 SET ubicacion_trabajador_lat = $3,
                     ubicacion_trabajador_lng = $4,
                     ubicacion_trabajador_at = now()
                 WHERE id = $1
                   AND "IdTrabajador" = $2
                   AND estado = 'EN PROCESO'
                   AND llegada_trabajador_at IS NULL
                 RETURNING id`,
                [idTrabajo, idTrabajador, lat, lng]
            )
            return result.rowCount > 0
        } catch (err) {
            console.error('Error en guardarUbicacionTrabajador:', err)
            throw err
        } finally {
            await client.end()
        }
    }

    // Lo llama el CLIENTE dueño del trabajo. Devuelve null si no hay
    // nada para mostrar (no es su trabajo, ya llegó, o no hay posición).
    obtenerUbicacionTrabajador = async (idTrabajo, idCliente) => {
        const client = new Client(config)
        try {
            await client.connect()
            const result = await client.query(
                `SELECT
                    ubicacion_trabajador_lat AS lat,
                    ubicacion_trabajador_lng AS lng,
                    ubicacion_trabajador_at AS "actualizadoEn",
                    (ubicacion_trabajador_at > now() - ($3 * INTERVAL '1 minute')) AS vigente
                 FROM "Cliente-Trabajador"
                 WHERE id = $1
                   AND "IdCliente" = $2
                   AND estado = 'EN PROCESO'
                   AND llegada_trabajador_at IS NULL
                   AND ubicacion_trabajador_lat IS NOT NULL
                   AND ubicacion_trabajador_lng IS NOT NULL`,
                [idTrabajo, idCliente, UBICACION_VIGENCIA_MIN]
            )
            return result.rows[0] ?? null
        } catch (err) {
            console.error('Error en obtenerUbicacionTrabajador:', err)
            throw err
        } finally {
            await client.end()
        }
    }
}