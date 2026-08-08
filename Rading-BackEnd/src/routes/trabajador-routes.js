import { Router } from "express"
import TrabajadorServices from "../services/trabajador-services.js"

const router = Router()
const svc = new TrabajadorServices()

// Valida que el id venga como número entero positivo real (rechaza
// null, undefined, "null", strings vacíos, negativos, etc.)
const idValido = (raw) => {
    const n = Number(raw)
    return raw !== undefined && raw !== null && Number.isInteger(n) && n > 0
}

router.get("/todos", async (req, res) => {
    try {
        const trabajadores = await svc.mostrarTodosLosTrabajadores()
        res.status(200).json(trabajadores)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener trabajadores", error })
    }
})

router.post("/registrar", async (req, res) => {
    try {
        const result = await svc.registrarTrabajador(req.body)
        res.status(201).json({ message: "Trabajador registrado correctamente", ...result })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al registrar trabajador", error })
    }
})

router.get("/trabajosActivos/:id", async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ message: "id de trabajador inválido" })
    }
    try {
        const trabajosActivos = await svc.mostrarTrabajosActivos(req.params.id)
        res.status(200).json(trabajosActivos)
    } catch (error) {
        res.status(500).json({ message: "Error al obtener trabajos activos", error })
    }
})

// GET /trabajador/resumen/:id
// Resumen del día: ganancias, trabajos completados y rating, todo de HOY.
router.get("/resumen/:id", async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ message: "id de trabajador inválido" })
    }
    try {
        const resumen = await svc.obtenerResumenDiario(req.params.id)
        res.status(200).json(resumen)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener resumen diario", error })
    }
})

// GET /trabajador/buscarCliente?texto=&estrellas=&servicio_id=&fijo=&emergencia=&distanciaMax=&horarioDesde=&horarioHasta=
router.get("/buscarCliente", async (req, res) => {
    try {
        const {
            texto, estrellas, servicio_id, fijo, emergencia,
            distanciaMax, horarioDesde, horarioHasta,
            precioMin, precioMax   // ← nuevo
        } = req.query

        const resultado = await svc.buscarConFiltrosTr(
            texto, estrellas, servicio_id, fijo, emergencia,
            distanciaMax, horarioDesde, horarioHasta,
            precioMin, precioMax   // ← nuevo
        )
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al buscar solicitudes", error })
    }
})

router.get("/trabajosRealizados/:id", async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ message: "id de trabajador inválido" })
    }
    try {
        const idTrabajador = req.params.id
        const trabajosRealizados = await svc.mostrarTrabajosRealizados(idTrabajador)
        res.status(200).json(trabajosRealizados)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener trabajos realizados", error })
    }
})
router.get("/detalleOferta/:id", async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ message: "id de solicitud inválido" })
    }
    try {
        const detalle = await svc.obtenerDetalleOferta(req.params.id)
        if (!detalle) {
            return res.status(404).json({ message: "Solicitud no encontrada" })
        }
        res.status(200).json(detalle)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener detalle de la oferta", error })
    }
})
router.get("/solicitudesNuevas/:id", async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ message: "id de trabajador inválido" })
    }
    try {
        const radioKm = req.query.radioKm ? Number(req.query.radioKm) : 20
        const solicitudes = await svc.buscarOfertasCercanas(req.params.id, radioKm)
        res.status(200).json(solicitudes)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener solicitudes nuevas", error })
    }
})
// GET /trabajador/ofertasCercanas/:id?radioKm=5
router.get("/ofertasCercanas/:id", async (req, res) => {
    if (!idValido(req.params.id)) {
        return res.status(400).json({ message: "id de trabajador inválido" })
    }
    try {
        const radioKm = req.query.radioKm ? Number(req.query.radioKm) : 5
        const ofertas = await svc.buscarOfertasCercanas(req.params.id, radioKm)
        res.status(200).json(ofertas)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener ofertas cercanas", error })
    }
})

export default router