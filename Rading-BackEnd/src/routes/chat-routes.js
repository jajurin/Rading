import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import ChatServices from "../services/chat-services.js"

const router = Router()
const svc = new ChatServices()

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "chat")
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    }
})

router.get('/buscar/:idCliente/:idTrabajador', async (req, res) => {
  try {
    const { idCliente, idTrabajador } = req.params
    const chatId = await svc.buscarChat(idCliente, idTrabajador)
    res.json({ chatId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error al buscar el chat', error: err.message })
  }
})

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }
})

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

router.get("/cliente/:idCliente", async (req, res) => {
    try {
        const { idUsuario } = req.query
        const chats = await svc.obtenerChatsCliente(req.params.idCliente, idUsuario)
        res.status(200).json(chats)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener chats", error: error.message })
    }
})

router.get("/trabajador/:idTrabajador", async (req, res) => {
    try {
        const { idUsuario } = req.query
        const chats = await svc.obtenerChatsTrabajador(req.params.idTrabajador, idUsuario)
        res.status(200).json(chats)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener chats", error: error.message })
    }
})

router.get("/:chatId/mensajes", async (req, res) => {
    try {
        const mensajes = await svc.obtenerMensajes(req.params.chatId)
        res.status(200).json(mensajes)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener mensajes", error: error.message })
    }
})

router.post("/mensaje", async (req, res) => {
    try {
        const mensaje = await svc.enviarMensaje(req.body)
        res.status(201).json(mensaje)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al enviar mensaje", error: error.message })
    }
})

// PUT /chat/mensaje/:id  { contenido, userId }  -> editar un mensaje de tipo TEXTO propio
router.put("/mensaje/:id", async (req, res) => {
    try {
        const { contenido, userId } = req.body
        if (!contenido || !userId) {
            return res.status(400).json({ message: "Faltan contenido o userId" })
        }
        const mensaje = await svc.editarMensaje(req.params.id, contenido, userId)
        if (!mensaje) {
            return res.status(404).json({ message: "Mensaje no encontrado o no editable" })
        }
        res.status(200).json(mensaje)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al editar mensaje", error: error.message })
    }
})

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

        const { chatId, idCliente, idTrabajador, enviadorId, duracionAudio } = req.body
        const archivoUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`

        // IMAGEN / VIDEO / AUDIO / ARCHIVO según mimetype
        let tipo = 'ARCHIVO'
        if (req.file.mimetype.startsWith('image/')) tipo = 'IMAGEN'
        else if (req.file.mimetype.startsWith('video/')) tipo = 'VIDEO'
        else if (req.file.mimetype.startsWith('audio/')) tipo = 'AUDIO'

        const mensaje = await svc.enviarMensajeArchivo({
            chatId,
            idCliente,
            idTrabajador,
            enviadorId,
            archivoUrl,
            archivoNombre: req.file.originalname,
            tipo,
            duracionAudio: tipo === 'AUDIO' && duracionAudio ? Number(duracionAudio) : null,
        })

        res.status(201).json(mensaje)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al enviar archivo", error: error.message })
    }
})

export default router