import { Router } from "express"
import NotificacionServices from "../services/notificacion-services.js"
import notificacionRepository from "../repositories/notificacion/notificacion-repositories.js"

const router = Router()
const repo = new notificacionRepository()
const svc = new NotificacionServices()

const idValido = (raw) => {
    const n = Number(raw)
    return raw !== undefined && raw !== null && Number.isInteger(n) && n > 0
}

/**
 * GET /notificacion/usuario/:idUsuario?limite=50
 * Lista las últimas notificaciones del usuario (idUsuario = id de la tabla Usuario).
 */
router.get("/usuario/:idUsuario", async (req, res) => {
    if (!idValido(req.params.idUsuario)) {
        return res.status(400).json({ message: "idUsuario inválido" })
    }
    try {
        const limite = req.query.limite ? Number(req.query.limite) : 50
        const notificaciones = await repo.listar(req.params.idUsuario, limite)
        res.status(200).json(notificaciones)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener notificaciones", error: error.message })
    }
})

/**
 * GET /notificacion/usuario/:idUsuario/no-leidas
 * Devuelve la cantidad de notificaciones sin leer del usuario.
 */
router.get("/usuario/:idUsuario/no-leidas", async (req, res) => {
    if (!idValido(req.params.idUsuario)) {
        return res.status(400).json({ message: "idUsuario inválido" })
    }
    try {
        const cantidad = await repo.contarNoLeidas(req.params.idUsuario)
        res.status(200).json({ cantidad })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al contar notificaciones", error: error.message })
    }
})

/**
 * PUT /notificacion/:id/leida  { idUsuario }
 * Marca UNA notificación como leída. idUsuario valida que sea del dueño.
 */
router.put("/:id/leida", async (req, res) => {
    const { idUsuario } = req.body
    if (!idValido(req.params.id) || !idValido(idUsuario)) {
        return res.status(400).json({ message: "id o idUsuario inválidos" })
    }
    try {
        await repo.marcarLeida(req.params.id, idUsuario)
        res.status(200).json({ ok: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al marcar notificación como leída", error: error.message })
    }
})

/**
 * PUT /notificacion/todas-leidas  { idUsuario }
 * Marca TODAS las notificaciones del usuario como leídas.
 */
router.put("/todas-leidas", async (req, res) => {
    const { idUsuario } = req.body
    if (!idValido(idUsuario)) {
        return res.status(400).json({ message: "idUsuario inválido" })
    }
    try {
        const marcadas = await repo.marcarTodasLeidas(idUsuario)
        res.status(200).json({ ok: true, marcadas })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al marcar notificaciones", error: error.message })
    }
})

export default router