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
            horarioRequerido: body.horarioRequerido ?? null,
            fijo: body.fijo,
            precio: body.precio,
            emergencia: body.emergencia ?? false,
            descripcion: body.descripcion,
            descripcionOriginal: body.descripcionOriginal,
        }

        if (!solicitud.idCliente) throw new Error("idCliente es requerido")
        if (!solicitud.servicioId) throw new Error("servicioId es requerido")
        if (!solicitud.descripcion) throw new Error("descripcion es requerida")
        if (typeof solicitud.precio !== "number" || solicitud.precio < 0) {
            throw new Error("precio inválido")
        }

        return await this.#repo.crearSolicitud(solicitud)
    }
}