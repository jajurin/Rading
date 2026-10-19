import pkg from 'pg'
import config from './dbconfig.js'

const { Pool } = pkg

export const pool = new Pool(config)
pool.on('error', (err) => console.error('[DB] error en conexión inactiva del pool:', err.message))

/**
 * Reemplazo directo de `new Client(config)` que usa el Pool por debajo.
 * Mantiene la misma API (connect / query / end), así que en cada repositorio
 * alcanza con cambiar el import:
 *
 *   import pkg from 'pg'                       // borrar
 *   const { Client } = pkg                     // borrar
 *   import { Client } from '../../configs/db.js'   // agregar (ajustar la ruta relativa)
 *
 * `new Client(config)` sigue funcionando: el argumento se ignora.
 */
export class Client {
    #conn = null
    #fallo = null

    async connect() {
        this.#conn = await pool.connect()
    }

    async query(...args) {
        try {
            return await this.#conn.query(...args)
        } catch (err) {
            this.#fallo = err
            throw err
        }
    }

    async end() {
        if (!this.#conn) return
        // Si hubo error en una transacción, se descarta la conexión en vez de reciclarla.
        this.#conn.release(this.#fallo ?? undefined)
        this.#conn = null
    }
}