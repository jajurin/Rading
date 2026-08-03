import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import ChatServices from "../services/chat-services.js"

const router = Router()
const svc = new ChatServices()

// Carpeta donde van a quedar los archivos subidos
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "chat")
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
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB, ajustá a gusto
})

// GET /chat/abrir?idCliente=1&idTrabajador=2  -> devuelve (o crea) el chat_id
router.get("/abrir", async (req, res) => {
    try {
        const { idCliente, idTrabajador } = req.query
        const chatId = await svc.obtenerOCrearChat(idCliente, idTrabajador)
        res.status(200).json({ chatId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al abrir chat", error: error.message })
    }
})

// GET /chat/cliente/:idCliente  -> lista de chats para la pantalla ChatsCliente
router.get("/cliente/:idCliente", async (req, res) => {
    try {
        const chats = await svc.obtenerChatsCliente(req.params.idCliente)
        res.status(200).json(chats)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener chats", error: error.message })
    }
})

// GET /chat/trabajador/:idTrabajador
router.get("/trabajador/:idTrabajador", async (req, res) => {
    try {
        const chats = await svc.obtenerChatsTrabajador(req.params.idTrabajador)
        res.status(200).json(chats)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener chats", error: error.message })
    }
})

// GET /chat/:chatId/mensajes
router.get("/:chatId/mensajes", async (req, res) => {
    try {
        const mensajes = await svc.obtenerMensajes(req.params.chatId)
        res.status(200).json(mensajes)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener mensajes", error: error.message })
    }
})

// POST /chat/mensaje  { chatId, enviadorId, contenido, tipo }
router.post("/mensaje", async (req, res) => {
    try {
        const mensaje = await svc.enviarMensaje(req.body)
        res.status(201).json(mensaje)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al enviar mensaje", error: error.message })
    }
})

// PUT /chat/:chatId/leido  { userId }
router.put("/:chatId/leido", async (req, res) => {
    try {
        const { userId } = req.body
        const result = await svc.marcarComoLeidos(req.params.chatId, userId)
        res.status(200).json({ marcados: result.length })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al marcar como leído", error: error.message })
    }
})

router.post("/mensaje/archivo", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se recibió ningún archivo" })
        }

        const { chatId, idCliente, idTrabajador, enviadorId } = req.body
        const archivoUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`

        // IMAGEN si el mimetype empieza con "image/", si no ARCHIVO
        const tipo = req.file.mimetype.startsWith('image/') ? 'IMAGEN' : 'ARCHIVO'

        const mensaje = await svc.enviarMensajeArchivo({
            chatId,
            idCliente,
            idTrabajador,
            enviadorId,
            archivoUrl,
            archivoNombre: req.file.originalname,
            tipo,
        })

        res.status(201).json(mensaje)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al enviar archivo", error: error.message })
    }
})

export default router