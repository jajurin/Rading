import { Router } from "express"
import crypto from "crypto"
import { enviarCodigoVerificacion } from "../services/email-service.js"
import UsuarioServices from "../services/usuario-services.js"
import { limiteEnvioCodigo, limiteSensible } from "../utils/limitadores.js"

const router = Router()
const codigosPendientes = new Map()
const svc = new UsuarioServices()

const MAX_INTENTOS = 5
const VIGENCIA_MS = 10 * 60 * 1000

// Limpieza periódica de códigos vencidos (evita que el Map crezca sin límite).
setInterval(() => {
    const ahora = Date.now()
    for (const [email, e] of codigosPendientes) if (ahora > e.expira) codigosPendientes.delete(email)
}, 5 * 60 * 1000).unref()

const normalizar = (email) => String(email).trim().toLowerCase()

const iguales = (a, b) => {
    const ba = Buffer.from(String(a))
    const bb = Buffer.from(String(b))
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

// POST /verificacion/enviar-codigo
router.post("/enviar-codigo", limiteEnvioCodigo, async (req, res) => {
    try {
        const { email } = req.body ?? {}
        if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ message: "Email requerido" })

        const existe = await svc.existeEmail(email)
        if (existe) return res.status(409).json({ message: "El email ya está registrado" })

        const codigo = crypto.randomInt(100000, 1000000).toString()
        codigosPendientes.set(normalizar(email), { codigo, expira: Date.now() + VIGENCIA_MS, intentos: 0 })
        await enviarCodigoVerificacion(email, codigo)

        res.status(200).json({ message: "Código enviado" })
    } catch (error) {
        console.error("Error enviar-codigo:", error.message)
        res.status(500).json({ message: "Error al enviar código" })
    }
})

// POST /verificacion/verificar-codigo
router.post("/verificar-codigo", limiteSensible, (req, res) => {
    try {
        const { email, codigo } = req.body ?? {}
        if (typeof email !== 'string' || !email || codigo == null || codigo === '')
            return res.status(400).json({ message: "Email y código requeridos" })

        const clave = normalizar(email)
        const entrada = codigosPendientes.get(clave)
        if (!entrada) return res.status(404).json({ message: "No hay código pendiente para este email" })

        if (Date.now() > entrada.expira) {
            codigosPendientes.delete(clave)
            return res.status(410).json({ message: "El código expiró" })
        }

        if (!iguales(entrada.codigo, codigo)) {
            entrada.intentos += 1
            if (entrada.intentos >= MAX_INTENTOS) {
                codigosPendientes.delete(clave)
                return res.status(429).json({ message: "Demasiados intentos. Pedí un código nuevo." })
            }
            return res.status(401).json({ message: "Código incorrecto" })
        }

        codigosPendientes.delete(clave)
        res.status(200).json({ message: "Email verificado correctamente" })
    } catch (error) {
        console.error("Error verificar-codigo:", error.message)
        res.status(500).json({ message: "Error al verificar código" })
    }
})

export default router