import { Router } from "express"
import UbicacionServices from "../services/ubicaciones-services.js"

const router = Router()
const svc = new UbicacionServices()

const idValido = (raw) => {
    const n = Number(raw)
    return raw !== undefined && raw !== null && Number.isInteger(n) && n > 0
}

// POST /trabajador/trabajo/:idTrabajo/ubicacion  { idTrabajador, lat, lng }
router.post('/trabajador/trabajo/:idTrabajo/ubicacion', async (req, res) => {
    const { idTrabajador, lat, lng } = req.body
    if (!idValido(req.params.idTrabajo) || !idValido(idTrabajador)) {
        return res.status(400).json({ message: "idTrabajo o idTrabajador inválido" })
    }
    try {
        const resultado = await svc.guardarUbicacionTrabajador(req.params.idTrabajo, idTrabajador, lat, lng)
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        const status = /Coordenadas|no te pertenece/.test(error.message) ? 400 : 500
        res.status(status).json({ message: error.message || "Error al guardar la ubicación" })
    }
})

// GET /cliente/trabajo/:idTrabajo/ubicacion?idCliente=
// 204 = no hay ubicación para mostrar (ya llegó, no es tu trabajo, o todavía no reportó)
router.get('/cliente/trabajo/:idTrabajo/ubicacion', async (req, res) => {
    const { idCliente } = req.query
    if (!idValido(req.params.idTrabajo) || !idValido(idCliente)) {
        return res.status(400).json({ message: "idTrabajo o idCliente inválido" })
    }
    try {
        const ubicacion = await svc.obtenerUbicacionTrabajador(req.params.idTrabajo, idCliente)
        if (!ubicacion) return res.status(204).end()
        res.status(200).json(ubicacion)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener la ubicación" })
    }
})

export default router