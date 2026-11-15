import { Client } from '../../configs/db.js'
import config from '../../configs/dbconfig.js'

/**
 * Guarda las etiquetas de un grupo de etiquetas (el que apunta la reseña).
 * Se llama DENTRO de la transacción de la reseña. Valida que existan y que
 * sean del tipo correcto.
 * tipoEsperado: 'CLIENTE' (trabajador califica cliente) o 'TRABAJADOR'
 * (cliente califica trabajador).
 */
export const guardarEtiquetas = async (client, idReseña, ids, tipoEsperado) => {
    const limpios = [...new Set(
        (Array.isArray(ids) ? ids : []).map(Number).filter(Number.isInteger)
    )]
    if (limpios.length === 0) return []

    const validas = await client.query(
        `SELECT id FROM "etiqueta"
         WHERE id = ANY($1::bigint[]) AND tipo = $2::tipo_etiqueta`,
        [limpios, tipoEsperado]
    )
    if (validas.rowCount !== limpios.length) {
        throw new Error('Alguna etiqueta no es válida')
    }

    await client.query(
        `INSERT INTO "reseña_etiqueta" (idreseña, idetiqueta)
         SELECT $1::bigint, UNNEST($2::bigint[])
         ON CONFLICT DO NOTHING`,
        [idReseña, limpios]
    )
    return limpios
}

export const listarEtiquetas = async (tipo) => {
    const client = new Client(config)
    try {
        await client.connect()
        const r = await client.query(
            `SELECT id, nombre, tipo, positiva
             FROM "etiqueta"
             WHERE tipo = $1::tipo_etiqueta
             ORDER BY positiva DESC, id ASC`,
            [tipo]
        )
        return r.rows
    } finally {
        await client.end()
    }
}