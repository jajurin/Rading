import solicitudRepository from "../../repositories/cliente/solicitud-repositories.js";
import { analizarSolicitud } from "./solicitudIA-service.js"; // ✅ Importa la nueva función

export default class SolicitudServices {
    #repo

    constructor() {
        this.#repo = new solicitudRepository()
    }

    analizar = async (descripcionOriginal) => {
        const servicios = await this.#repo.listarServicios()
        const resultado = await analizarSolicitud(descripcionOriginal, servicios) // ✅ Usa la nueva

        const servicioElegido = servicios.find((s) => s.id === resultado.servicioId)

        return {
            ...resultado,
            servicioNombre: servicioElegido?.nombre ?? null,
            servicios: servicios.map((s) => ({ id: s.id, nombre: s.nombre, categoria: s.categoria_nombre })),
        }
    }

    confirmarSolicitud = async (body) => {
        const solicitud = {
            idCliente: body.idCliente,
            servicioId: body.servicioId,
            distancia: body.distancia ?? null,
            // 👇 Plazo elegido por el cliente con el selector de fecha/hora.
            // Vienen como dato estructurado (no texto libre): "fechaRequerida"
            // en formato YYYY-MM-DD (columna date) y "horarioRequerido" en
            // formato HH:mm (columna time). Si el cliente no eligió plazo,
            // ambos llegan en null.
            fechaRequerida: body.fechaRequerida ?? null,
            horarioRequerido: body.horarioRequerido ?? null,
            fijo: body.fijo,
            precio: body.precio,
            emergencia: body.emergencia ?? false,
            descripcion: body.descripcion,
            descripcionOriginal: body.descripcionOriginal,
            // 👇 NUEVO: dirección/lat/lng de esta solicitud puntual. Si el
            // cliente dejó su dirección predeterminada, el front manda los
            // mismos valores que ya tiene guardados en su perfil (Usuario);
            // si eligió "otra dirección", vienen los de esa dirección
            // (validados contra Nominatim en CrearSolicitud.js).
            direccion: body.direccion ?? null,
            lat: body.lat ?? null,
            lng: body.lng ?? null,
        }

        if (!solicitud.idCliente) throw new Error("idCliente es requerido")
        if (!solicitud.servicioId) throw new Error("servicioId es requerido")
        if (!solicitud.descripcion) throw new Error("descripcion es requerida")
        if (typeof solicitud.precio !== "number" || solicitud.precio < 0) {
            throw new Error("precio inválido")
        }

        return await this.#repo.crearSolicitud(solicitud)
    }

    // 👇 NUEVO: guarda una foto ya subida a disco (o al storage que uses)
    // asociada a una solicitud existente. "archivo" viene armado por el
    // middleware de multer en la ruta (ver solicitud-routes.js): { url,
    // idTrabajo, orden }.
    subirImagen = async ({ idTrabajo, url, orden, idCliente }) => {
        if (!idTrabajo) throw new Error("idTrabajo es requerido")
        if (!url) throw new Error("No se recibió el archivo")

        // Chequeo de pertenencia: evita que se puedan colgar fotos en el
        // trabajo de otro cliente solo adivinando el id.
        const trabajo = await this.#repo.obtenerTrabajoDeCliente(idTrabajo, idCliente)
        if (!trabajo) throw new Error("La solicitud indicada no existe o no te pertenece")

        return await this.#repo.crearImagenSolicitud({ idTrabajo, url, orden })
    }
}