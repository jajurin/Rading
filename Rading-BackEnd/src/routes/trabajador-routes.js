import { Router } from "express"
import TrabajadorServices from "../services/trabajador-services.js"

const router = Router()
const svc = new TrabajadorServices()

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
    try {
        const idTrabajador = req.params.id
        const trabajosRealizados = await svc.mostrarTrabajosRealizados(idTrabajador)
        res.status(200).json(trabajosRealizados)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener trabajos realizados", error })
    }
})

export default router