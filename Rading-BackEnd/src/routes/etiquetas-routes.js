import { Router } from 'express'
import { listarEtiquetas } from '../repositories/general/etiquetas-helper.js'

const router = Router()

router.get('/etiquetas', async (req, res) => {
    try {
        const tipo = String(req.query.tipo || '').toUpperCase()
        if (!['CLIENTE', 'TRABAJADOR'].includes(tipo)) {
            return res.status(400).json({ message: 'tipo inválido' })
        }
        res.json(await listarEtiquetas(tipo))
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

export default router