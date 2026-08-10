import { Router } from "express"
import TrabajoServices from "../services/trabajo-services.js"

const router = Router()
const svc = new TrabajoServices()

const idValido = (raw) => {
    const n = Number(raw)
    return raw !== undefined && raw !== null && Number.isInteger(n) && n > 0
}

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

router.post('/:idTrabajo/generar-codigo-llegada', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const data = await svc.generarCodigoLlegada(req.params.idTrabajo)
        res.status(200).json(data)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

router.post('/:idTrabajo/confirmar-codigo-llegada', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const resultado = await svc.confirmarLlegadaConCodigo(req.params.idTrabajo, req.body.codigo)
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

// NUEVO: falta esta ruta para generar el código de cierre
router.post('/:idTrabajo/generar-codigo-fin', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const data = await svc.generarCodigoFin(req.params.idTrabajo)
        res.status(200).json(data)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

// NUEVO: equivalente a confirmar-codigo-llegada, para el cierre
router.post('/:idTrabajo/confirmar-codigo-fin', async (req, res) => {
    if (!idValido(req.params.idTrabajo)) {
        return res.status(400).json({ message: "idTrabajo inválido" })
    }
    try {
        const resultado = await svc.confirmarFinConCodigo(req.params.idTrabajo, req.body.codigo)
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(400).json({ message: error.message })
    }
})

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