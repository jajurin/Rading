// Uso (desde Rading-BackEnd):   node src/scripts/migrar-contrasenas.js
// Hashea con bcrypt todas las contraseñas que sigan en texto plano. Es idempotente:
// las que ya son hash se saltean, así que se puede correr más de una vez.
import { pool } from '../configs/db.js'
import { hashear, esHash } from '../utils/password.js'

const main = async () => {
    const { rows } = await pool.query(`SELECT id, contrasena FROM "Usuario"`)
    const pendientes = rows.filter(r => r.contrasena && !esHash(r.contrasena))
    console.log(`Usuarios: ${rows.length} | a migrar: ${pendientes.length}`)

    let migrados = 0
    for (const { id, contrasena } of pendientes) {
        // WHERE contrasena = viejo: si el usuario cambió su clave mientras corría, no se pisa.
        const r = await pool.query(
            `UPDATE "Usuario" SET contrasena = $1 WHERE id = $2 AND contrasena = $3`,
            [await hashear(contrasena), id, contrasena]
        )
        migrados += r.rowCount
    }
    console.log(`Migrados: ${migrados}`)
    await pool.end()
}

main().catch(async (err) => {
    console.error('Fallo la migración:', err.message)
    await pool.end().catch(() => {})
    process.exit(1)
})