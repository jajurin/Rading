import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"

const router = Router()

const carpetaUploads = path.join(process.cwd(), "uploads")
if (!fs.existsSync(carpetaUploads)) fs.mkdirSync(carpetaUploads)

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpetaUploads),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg"
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    }
})

const upload = multer({ storage })

// POST /upload  (form-data, campo "archivo")
router.post("/", upload.single("archivo"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No se recibió ningún archivo" })
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    res.status(200).json({ url })
})

export default router