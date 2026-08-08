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
    //
    // 👇 Se agregan direccion/lat/lng: si el cliente eligió "otra dirección"
    // en CrearSolicitud.js, viajan esos valores; si no, el front ya manda
    // los mismos datos que tiene guardados en su perfil (Usuario.direccion/
    // lat/lng). Con esto la solicitud queda geolocalizada de forma
    // independiente del perfil, que es lo que usa buscarOfertasCercanas
    // (trabajadorRepository) para calcular la distancia contra cada
    // trabajador vía haversine.
    crearSolicitud = async (solicitud) => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                INSERT INTO "Cliente-Trabajador"
                    ("IdCliente", "IdTrabajador", servicio_id, distancia,
                     horario_requerido, fijo, precio, emergencia,
                     descripcion, "descripcionOriginal", estado, fecha_iniciado,
                     direccion, lat, lng)
                VALUES
                    ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDIENTE', NOW(),
                     $10, $11, $12)
                RETURNING id, estado, fecha_iniciado, direccion, lat, lng
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
                solicitud.direccion ?? null,
                solicitud.lat ?? null,
                solicitud.lng ?? null,
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

    // 👇 NUEVO: guarda una foto adjunta a una solicitud ya creada.
    // "url" es la ruta pública final del archivo (ver upload middleware en
    // solicitud-routes.js); "orden" define el orden del carrusel, igual
    // que ya usás en obtenerDetalleOferta (trabajadorRepository), que
    // arma el json_agg ordenado por si.orden ASC.
    crearImagenSolicitud = async ({ idTrabajo, url, orden }) => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                INSERT INTO "SolicitudImagen" ("idTrabajo", url, orden)
                VALUES ($1, $2, $3)
                RETURNING id, "idTrabajo", url, orden
            `

            result = await client.query(sql, [idTrabajo, url, orden ?? 0])

        } catch (err) {
            console.error('Error en crearImagenSolicitud:', err)
            throw err
        } finally {
            await client.end()
        }

        return result?.rows?.[0] ?? null
    }

    // 👇 Chequeo simple de que el trabajo exista y le pertenezca al cliente,
    // para no dejar que cualquiera adjunte fotos a un idTrabajo ajeno.
    // Se usa antes de guardar la imagen en el service.
    obtenerTrabajoDeCliente = async (idTrabajo, idCliente) => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                SELECT id, "IdCliente"
                FROM "Cliente-Trabajador"
                WHERE id = $1
            `

            result = await client.query(sql, [idTrabajo])

            const fila = result?.rows?.[0] ?? null
            if (!fila) return null
            if (idCliente != null && String(fila.IdCliente) !== String(idCliente)) return null
            return fila

        } catch (err) {
            console.error('Error en obtenerTrabajoDeCliente:', err)
            throw err
        } finally {
            await client.end()
        }
    }
}