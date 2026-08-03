import { Router } from "express"
import ChatServices from "../services/chat-services.js"

const router = Router()
const svc = new ChatServices()

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

export default router