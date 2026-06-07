

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
// Body: { nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria?, preferencias? }
router.post("/registrar", async (req, res) => {
    try {
        const result = await svc.registrarCliente(req.body)
        res.status(201).json({ message: "Cliente registrado correctamente", ...result })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al registrar cliente", error })
    }
})
 
// GET /cliente/buscarTrabajador?texto=&estrellas=&categoria=&distancia=&horario=
router.get("/buscarTrabajador", async (req, res) => {
    try {
        const { texto, estrellas, categoria, distancia, horario } = req.query
        const resultado = await svc.buscarConFiltrosCl(texto, estrellas, categoria, distancia, horario)
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