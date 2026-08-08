import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import SolicitudServices from "../services/services-ia/solicitud-services.js"

const router = Router()
const svc = new SolicitudServices()

// Carpeta donde van a quedar las fotos de las solicitudes. Mismo patrón
// que uploads/chat en chat-routes.js, solo que en su propia subcarpeta
// para no mezclarlas con los archivos del chat.
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "solicitudes")
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB, igual que en chat-routes.js
    fileFilter: (req, file, cb) => {
        // Acá solo tiene sentido aceptar imágenes (a diferencia del chat,
        // que también deja subir documentos).
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("El archivo debe ser una imagen"))
        }
        cb(null, true)
    }
})

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
 *   precio, fijo, emergencia?, distancia?, horarioRequerido?,
 *   direccion?, lat?, lng?
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

/**
 * POST /solicitud/imagen
 * multipart/form-data: { file, idTrabajo, orden?, idCliente? }
 *
 * Sube UNA foto y la asocia a una solicitud (Cliente-Trabajador) ya
 * creada, insertando la fila en "SolicitudImagen". Se llama una vez por
 * cada foto (ver subirImagenes en CrearSolicitud.js, que hace un loop).
 * "idCliente" es opcional pero recomendado: si viene, el service valida
 * que la solicitud le pertenezca a ese cliente antes de guardar la foto.
 */
router.post("/imagen", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, message: "No se recibió ninguna imagen" })
        }

        const { idTrabajo, orden, idCliente } = req.body
        const url = `${req.protocol}://${req.get('host')}/uploads/solicitudes/${req.file.filename}`

        const imagen = await svc.subirImagen({
            idTrabajo: idTrabajo ? Number(idTrabajo) : null,
            url,
            orden: orden != null ? Number(orden) : 0,
            idCliente: idCliente ? Number(idCliente) : null,
        })

        res.status(201).json({ ok: true, data: imagen })
    } catch (error) {
        console.error(error)
        const esErrorDeInput =
            error.message?.includes("idTrabajo es requerido") ||
            error.message?.includes("no existe o no te pertenece")
        const status = esErrorDeInput ? 400 : 500
        res.status(status).json({ ok: false, message: error.message || "Error al subir la imagen", error: error.message })
    }
})

export default router