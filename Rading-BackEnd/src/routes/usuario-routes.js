import { Router } from "express"
import UsuarioServices, { MSG_CREDENCIALES } from "../services/usuario-services.js"
import { limiteLogin, limiteSensible } from "../utils/limitadores.js"

const router = Router()
const svc = new UsuarioServices()

const esTexto = (v) => typeof v === 'string' && v.trim().length > 0

// POST /usuario/registrar
router.post("/registrar", limiteSensible, async (req, res) => {
    try {
        const { nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni } = req.body ?? {}

        if (!nombre || !apellido || !email || !direccion || !contrasena || !telefono || !fechaNac || !dni) {
            return res.status(400).json({ message: "Todos los campos son requeridos" })
        }
        if (typeof contrasena !== 'string' || contrasena.length < 8 || contrasena.length > 72) {
            // bcrypt ignora todo lo que pasa de 72 bytes
            return res.status(400).json({ message: "La contraseña debe tener entre 8 y 72 caracteres" })
        }

        const idUsuario = await svc.registrarUsuario(req.body)
        res.status(201).json({ message: "Usuario registrado correctamente", idUsuario })
    } catch (error) {
        if (error.message?.includes("ya está registrado")) {
            return res.status(409).json({ message: error.message })
        }
        console.error(error)
        res.status(500).json({ message: "Error al registrar usuario" })
    }
})

// POST /usuario/login
router.post("/login", limiteLogin, async (req, res) => {
    try {
        const { identificador, contrasena } = req.body ?? {}
        if (!esTexto(identificador) || !esTexto(contrasena))
            return res.status(400).json({ message: "Identificador y contraseña requeridos" })

        const usuario = await svc.login({ identificador: identificador.trim(), contrasena })
        res.status(200).json({ message: "Login exitoso", usuario })
    } catch (error) {
        if (error.message === MSG_CREDENCIALES) {
            return res.status(401).json({ message: error.message })
        }
        console.error(error)
        res.status(500).json({ message: "Error en login" })
    }
})

// GET /usuario/buscar?email=ejemplo@mail.com  (el servicio ya devuelve el usuario sin contraseña)
router.get("/buscar", limiteSensible, async (req, res) => {
    try {
        const { email } = req.query
        if (!esTexto(email)) return res.status(400).json({ message: "El email es requerido" })

        const usuario = await svc.buscarPorEmail(email)
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" })

        res.status(200).json(usuario)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al buscar usuario" })
    }
})

// GET /usuario/existe?email=ejemplo@mail.com
router.get("/existe", limiteSensible, async (req, res) => {
    try {
        const { email } = req.query
        if (!esTexto(email)) return res.status(400).json({ message: "El email es requerido" })

        const existe = await svc.existeEmail(email)
        res.status(200).json({ existe })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error al verificar email" })
    }
})

export default router