import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import { limiteCostoso } from "../utils/limitadores.js"

const router = Router()

const carpetaUploads = path.join(process.cwd(), "uploads")
if (!fs.existsSync(carpetaUploads)) fs.mkdirSync(carpetaUploads, { recursive: true })

// Solo imágenes. La extensión se deriva del tipo MIME, nunca del nombre que manda el cliente.
const EXT_POR_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpetaUploads),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${EXT_POR_MIME[file.mimetype]}`)
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (EXT_POR_MIME[file.mimetype]) return cb(null, true)
        cb(new Error("TIPO_NO_PERMITIDO"))
    }
})

// POST /upload  (form-data, campo "archivo")
// TODO: cuando exista el middleware JWT, agregarlo antes de limiteCostoso.
router.post("/", limiteCostoso, (req, res) => {
    upload.single("archivo")(req, res, (err) => {
        if (err) {
            if (err.message === "TIPO_NO_PERMITIDO") return res.status(415).json({ message: "Solo se permiten imágenes JPG, PNG o WEBP" })
            if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "La imagen supera los 5 MB" })
            console.error("Error upload:", err.message)
            return res.status(400).json({ message: "No se pudo subir el archivo" })
        }
        if (!req.file) return res.status(400).json({ message: "No se recibió ningún archivo" })
        const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        res.status(200).json({ url })
    })
})

export default router