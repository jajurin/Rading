import { Router } from "express"
import TrabajoServices from "../services/trabajo-services.js"

const router = Router()
const svc = new TrabajoServices()

// Valida que el id venga como número entero positivo real
const idValido = (raw) => {
    const n = Number(raw)
    return raw !== undefined && raw !== null && Number.isInteger(n) && n > 0
}

// GET /trabajo/:idTrabajo/estado
router.get('/:idTrabajo/estado', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const estado = await svc.obtenerEstado(req.params.idTrabajo)
        res.status(200).json(estado)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

// POST /trabajo/:idTrabajo/confirmar-llegada  { rol: 'CLIENTE' | 'TRABAJADOR' }
router.post('/:idTrabajo/confirmar-llegada', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const resultado = await svc.confirmarLlegada(req.params.idTrabajo, req.body.rol)
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

// POST /trabajo/:idTrabajo/confirmar-fin  { rol: 'CLIENTE' | 'TRABAJADOR' }
router.post('/:idTrabajo/confirmar-fin', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const resultado = await svc.confirmarFin(req.params.idTrabajo, req.body.rol)
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

export default router