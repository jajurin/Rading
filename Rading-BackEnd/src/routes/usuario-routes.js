import { Router } from "express"
import UsuarioServices from "../services/usuario-services.js"

const router = Router()
const svc = new UsuarioServices()

// POST /usuario/registrar
router.post("/registrar", async (req, res) => {
    try {
        const { nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni } = req.body

        if (!nombre || !apellido || !email || !direccion || !contrasena || !telefono || !fechaNac || !dni) {
            return res.status(400).json({ message: "Todos los campos son requeridos" })
        }

        const idUsuario = await svc.registrarUsuario(req.body)
        res.status(201).json({ message: "Usuario registrado correctamente", idUsuario })

    } catch (error) {
        if (error.message.includes("ya está registrado")) {
            return res.status(409).json({ message: error.message })
        }
        console.error(error)
        res.status(500).json({ message: "Error al registrar usuario", error })
    }
})

// GET /usuario/buscar?email=ejemplo@mail.com
router.get("/buscar", async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ message: "El email es requerido" })

        const usuario = await svc.buscarPorEmail(email)
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" })

        res.status(200).json(usuario)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al buscar usuario", error })
    }
})

// GET /usuario/existe?email=ejemplo@mail.com
router.get("/existe", async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ message: "El email es requerido" })

        const existe = await svc.existeEmail(email)
        res.status(200).json({ existe })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al verificar email", error })
    }
})

export default router