import { Router } from "express"
import ClienteServices from "../services/cliente-services.js";

const router = Router()
const svc = new ClienteServices()

// GET /cliente/todos
router.get("/todos", async (req, res) => {
    try {
        const clientes = await svc.mostrarTodosLosClientes()
        res.status(200).json(clientes)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener clientes", error })
    }
})

// POST /cliente/registrar
router.post("/registrar", async (req, res) => {
    try {
        const result = await svc.registrarCliente(req.body)
        res.status(201).json({ message: "Cliente registrado correctamente", ...result })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al registrar cliente", error })
    }
})

/**
 * GET /cliente/buscarTrabajador
 * Query params:
 *   texto        {string}  opcional  — nombre o apellido
 *   estrellas    {number}  opcional  — mínimo de estrellas (1-5)
 *   especialidad {string}  opcional  — nombre de especialidad (una sola)
 *   horarioDesde {string}  opcional  — HH:MM inicio del rango
 *   horarioHasta {string}  opcional  — HH:MM fin del rango
 *   distancia    {number}  opcional  — reservado (requiere integración con API de mapas)
 *
 * Al menos uno de los parámetros debe estar presente, si no retorna [].
 */
router.get("/buscarTrabajador", async (req, res) => {
    try {
        const { texto, estrellas, especialidad, horarioDesde, horarioHasta, distancia } = req.query
        const resultado = await svc.buscarConFiltrosCl(
            texto, estrellas, especialidad, horarioDesde, horarioHasta, distancia
        )
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al buscar trabajadores", error })
    }
})

// GET /cliente/trabajosActivos/:id
router.get("/trabajosActivos/:id", async (req, res) => {
    try {
        const idCliente = req.params.id
        const trabajosActivos = await svc.mostrarTrabajosActivos(idCliente)
        res.status(200).json(trabajosActivos)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener trabajos activos", error })
    }
})

export default router