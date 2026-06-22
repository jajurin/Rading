import { Router } from "express"
import SolicitudServices from "../services/services-ia/solicitud-services.js"

const router = Router()
const svc = new SolicitudServices()

/**
 * POST /solicitud/analizar
 * Body: { descripcionOriginal: string }
 *
 * Analiza la descripción del cliente con IA y devuelve una propuesta
 * (descripción mejorada, servicio sugerido, precio estimado). No guarda
 * nada en la base — el cliente confirma/edita y recién ahí se llama a
 * POST /solicitud/confirmar.
 */
router.post("/analizar", async (req, res) => {
    try {
        const { descripcionOriginal } = req.body
        const resultado = await svc.analizar(descripcionOriginal)
        res.status(200).json({ ok: true, data: resultado })
    } catch (error) {
        console.error(error)
        const esErrorDeInput = error.message?.includes("descripcionOriginal es requerida")
        const status = esErrorDeInput ? 400 : 502
        const body = {
            ok: false,
            message: esErrorDeInput ? error.message : "Error al analizar la solicitud",
            error: error.message,
        }

        // Para depuración local: incluir stack/causa si está habilitado
        if (process.env.DEBUG_AI_ERRORS === 'true' || process.env.NODE_ENV !== 'production') {
            body.stack = error.stack
            if (error.cause) body.cause = String(error.cause)
        }

        res.status(status).json(body)
    }
})

/**
 * POST /solicitud/confirmar
 * Body: {
 *   idCliente, servicioId, descripcion, descripcionOriginal,
 *   precio, fijo, emergencia?, distancia?, horarioRequerido?
 * }
 *
 * Crea la fila real en Cliente-Trabajador. IdTrabajador queda null hasta
 * que alguien tome el trabajo o gane la subasta.
 */
router.post("/confirmar", async (req, res) => {
    try {
        const resultado = await svc.confirmarSolicitud(req.body)
        res.status(201).json({ ok: true, message: "Solicitud creada correctamente", data: resultado })
    } catch (error) {
        console.error(error)
        res.status(400).json({ ok: false, message: "Error al crear la solicitud", error: error.message })
    }
})

export default router