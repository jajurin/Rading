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
        const {
            texto, estrellas, especialidad,
            horarioDesde, horarioHasta,
            lat, lng, radioKm,
        } = req.query

        const resultado = await svc.buscarConFiltrosCl({
            texto,
            estrellas: estrellas ? Number(estrellas) : null,
            especialidad,
            horarioDesde,
            horarioHasta,
            lat: lat != null ? Number(lat) : null,
            lng: lng != null ? Number(lng) : null,
            radioKm: radioKm ? Number(radioKm) : null,
        })

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
// GET /cliente/categorias
router.get("/categorias", async (req, res) => {
    try {
        const categorias = await svc.mostrarCategorias()
        res.status(200).json(categorias)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener categorías", error })
    }
})

// GET /cliente/recientes/:id
router.get("/recientes/:id", async (req, res) => {
    try {
        const idCliente = req.params.id
        const recientes = await svc.mostrarRecientes(idCliente)
        res.status(200).json(recientes)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener recientes", error })
    }
})
// GET /cliente/categorias
router.get("/categorias", async (req, res) => {
    try {
        const categorias = await svc.mostrarCategorias()
        res.status(200).json(categorias)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener categorías", error })
    }
})

// GET /cliente/servicios/:categoriaId
router.get("/servicios/:categoriaId", async (req, res) => {
    try {
        const servicios = await svc.mostrarServiciosPorCategoria(req.params.categoriaId)
        res.status(200).json(servicios)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener servicios", error })
    }
})
// GET /cliente/servicios-preferidos/:idCliente
router.get("/servicios-preferidos/:idCliente", async (req, res) => {
    try {
        const servicios = await svc.mostrarServiciosPreferidos(req.params.idCliente)
        res.status(200).json(servicios)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener servicios preferidos", error })
    }
})

// GET /cliente/recientes/:id
router.get("/recientes/:id", async (req, res) => {
    try {
        const recientes = await svc.mostrarRecientes(req.params.id)
        res.status(200).json(recientes)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al obtener recientes", error })
    }
})
// POST /cliente/resenia
// POST /cliente/resenia
router.post("/resenia", async (req, res) => {
    try {
        const result = await svc.crearReseñaCliente(req.body)
        res.status(201).json({ message: "Reseña creada correctamente", ...result })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al crear reseña", error: error.message })
    }
})
// GET /cliente/ofertas/:idTrabajo
// GET /cliente/ofertas/pendientes/:idCliente  👈 AHORA VA PRIMERO
router.get('/ofertas/pendientes/:idCliente', async (req, res) => {
    console.log('🔵 ENTRÓ a /ofertas/pendientes/:idCliente con idCliente =', req.params.idCliente)
    try {
        const data = await svc.contarOfertasPendientes(req.params.idCliente)
        console.log('🟢 pendientes encontradas:', data)
        res.json(data)
    } catch (err) {
        console.log('🔴 ERROR COMPLETO:', err)
        res.status(500).json({ message: err.message })
    }
})

// GET /cliente/ofertas/:idTrabajo  👈 AHORA VA DESPUÉS
router.get('/ofertas/:idTrabajo', async (req, res) => {
    console.log('🔵 ENTRÓ a /ofertas/:idTrabajo con idTrabajo =', req.params.idTrabajo)
    try {
        const ofertas = await svc.buscarOfertasPorTrabajo(req.params.idTrabajo)
        console.log('🟢 ofertas encontradas:', ofertas)
        res.json(ofertas)
    } catch (err) {
        console.log('🔴 ERROR COMPLETO:', err)
        res.status(500).json({ message: err.message })
    }
})

router.post('/ofertas/:idOferta/aceptar', async (req, res) => {
    try {
        const resultado = await svc.aceptarOferta(req.params.idOferta)
        res.json(resultado)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})
export default router