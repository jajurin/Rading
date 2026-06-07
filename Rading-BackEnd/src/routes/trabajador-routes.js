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

// POST /trabajador/registrar
// Body: { nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria?,
//         categoria, descripcion, zonaTrabajo, DispComienzo, DispFinal, foto? }
router.post("/registrar", async (req, res) => {
    try {
        const result = await svc.registrarTrabajador(req.body)
        res.status(201).json({ message: "Trabajador registrado correctamente", ...result })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al registrar trabajador", error })
    }
})

// GET /trabajador/buscarCliente?texto=&estrellas=&categoria=&distancia=&horario=&fijo=
router.get("/buscarCliente", async (req, res) => {
    try {
        const { texto, estrellas, categoria, distancia, horario, fijo } = req.query
        const resultado = await svc.buscarConFiltrosTr(texto, estrellas, categoria, distancia, horario, fijo)
        res.status(200).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al buscar clientes", error })
    }
})

// GET /trabajador/trabajosRealizados/:id
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