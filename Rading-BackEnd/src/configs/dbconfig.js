import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

/**
 * TLS: con DB_SSL_CA apuntando al certificado CA de Supabase (Dashboard ->
 * Database -> SSL Configuration -> "Download certificate") se valida el servidor.
 * Sin esa variable se mantiene el comportamiento anterior, pero avisando.
 */
const construirSSL = () => {
    const rutaCA = process.env.DB_SSL_CA
    if (rutaCA) {
        return { rejectUnauthorized: true, ca: fs.readFileSync(path.resolve(rutaCA), 'utf8') }
    }
    console.warn('[DB] DB_SSL_CA no definido: la conexión a la base NO valida el certificado. Configurala antes de producción.')
    return { rejectUnauthorized: false }
}

const DBConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: construirSSL(),
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
}

export default DBConfig