import config from '../../configs/dbconfig.js'
import pkg from 'pg'
const { Client } = pkg

export default class solicitudRepository {

    // Trae { id, nombre } de todos los servicios activos, para que la IA
    // elija entre los nombres reales en vez de inventar categorías propias.
    listarServicios = async () => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                SELECT s.id, s.nombre, cs.nombre AS categoria_nombre
                FROM "Servicio" s
                INNER JOIN "CategoriaServicio" cs ON cs.id = s.categoria_id
            `

            result = await client.query(sql)

        } catch (err) {
            console.error('Error en listarServicios:', err)
            throw err
        } finally {
            await client.end()
        }

        return result?.rows ?? []
    }

    // Crea la solicitud en Cliente-Trabajador. IdTrabajador queda en null:
    // se asigna después, cuando un trabajador toma el trabajo o gana la subasta.
    crearSolicitud = async (solicitud) => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                INSERT INTO "Cliente-Trabajador"
                    ("IdCliente", "IdTrabajador", servicio_id, distancia,
                     horario_requerido, fijo, precio, emergencia,
                     descripcion, "descripcionOriginal", estado, fecha_iniciado)
                VALUES
                    ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDIENTE', NOW())
                RETURNING id, estado, fecha_iniciado
            `

            const values = [
                solicitud.idCliente,
                solicitud.servicioId,
                solicitud.distancia ?? null,
                solicitud.horarioRequerido ?? null,
                solicitud.fijo,
                solicitud.precio,
                solicitud.emergencia ?? false,
                solicitud.descripcion,
                solicitud.descripcionOriginal,
            ]

            result = await client.query(sql, values)

        } catch (err) {
            console.error('Error en crearSolicitud:', err)
            throw err
        } finally {
            await client.end()
        }

        return result?.rows?.[0] ?? null
    }
}