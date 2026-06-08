import { Router } from "express"
import { enviarCodigoVerificacion } from "../services/email-service.js"
import UsuarioServices from "../services/usuario-services.js"

const router = Router()  // ← esto faltaba
const codigosPendientes = new Map()
const svc = new UsuarioServices()

// POST /verificacion/enviar-codigo
router.post("/enviar-codigo", async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: "Email requerido" })

        const existe = await svc.existeEmail(email)
        if (existe) {
            return res.status(409).json({ message: "El email ya está registrado" })
        }

        const codigo = Math.floor(100000 + Math.random() * 900000).toString()
        const expira = Date.now() + 10 * 60 * 1000

        codigosPendientes.set(email, { codigo, expira })
        await enviarCodigoVerificacion(email, codigo)

        res.status(200).json({ message: "Código enviado" })
    } catch (error) {
        console.error("Error enviar-codigo:", error)
        res.status(500).json({ message: "Error al enviar código" })
    }
})

// POST /verificacion/verificar-codigo
router.post("/verificar-codigo", (req, res) => {
    try {
        const { email, codigo } = req.body
        if (!email || !codigo) return res.status(400).json({ message: "Email y código requeridos" })

        const entrada = codigosPendientes.get(email)
        if (!entrada) return res.status(404).json({ message: "No hay código pendiente para este email" })

        if (Date.now() > entrada.expira) {
            codigosPendientes.delete(email)
            return res.status(410).json({ message: "El código expiró" })
        }

        if (entrada.codigo !== codigo) return res.status(401).json({ message: "Código incorrecto" })

        codigosPendientes.delete(email)
        res.status(200).json({ message: "Email verificado correctamente" })
    } catch (error) {
        console.error("Error verificar-codigo:", error)
        res.status(500).json({ message: "Error al verificar código" })
    }
})

export default router