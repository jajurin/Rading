import config from '../configs/dbconfig.js'
import ClienteServices from '../services/cliente-services.js'
import pkg from 'pg'
const { Client } = pkg

const c = new Client(config)
await c.connect()

const pend = await c.query(`
  SELECT o.id AS oferta_id, o."idTrabajador", o."idTrabajo", o.precio, ct."IdCliente"
  FROM "Oferta" o
  INNER JOIN "Cliente-Trabajador" ct ON ct.id = o."idTrabajo"
  WHERE o."ESTADO_OFERTA" = 'PENDIENTE' AND ct.estado = 'PENDIENTE' AND ct."IdTrabajador" IS NULL
  LIMIT 1
`)
if (!pend.rows.length) {
  console.log('No hay ofertas pendientes para probar')
  await c.end()
  process.exit(0)
}

const oferta = pend.rows[0]
console.log('Aceptando oferta', oferta.oferta_id, 'del trabajo', oferta.idTrabajo)

const svc = new ClienteServices()
const res = await svc.aceptarOferta(oferta.oferta_id)
console.log('aceptada idTrabajador =', res.idTrabajador, 'idUsuarioTrabajador =', res.idUsuarioTrabajador, 'idUsuarioCliente =', res.idUsuarioCliente)

if (res.idUsuarioTrabajador) {
  const notifWorker = await c.query(
    `SELECT id, tipo, titulo FROM "Notificacion" WHERE "idUsuario" = $1 AND tipo = 'OFERTA_ACEPTADA' AND data->>'idTrabajo' = $2 ORDER BY id DESC LIMIT 3`,
    [res.idUsuarioTrabajador, String(res.idTrabajo)]
  )
  console.log('Notifs trabajador OFERTA_ACEPTADA:', JSON.stringify(notifWorker.rows))

  const notifClient = await c.query(
    `SELECT id, tipo, titulo FROM "Notificacion" WHERE "idUsuario" = $1 AND tipo IN ('TRABAJO_ACEPTADO','OFERTA_ACEPTADA') AND data->>'idTrabajo' = $2 ORDER BY id DESC LIMIT 5`,
    [res.idUsuarioCliente, String(res.idTrabajo)]
  )
  console.log('Notifs cliente:', JSON.stringify(notifClient.rows))

  const ids = [...notifWorker.rows, ...notifClient.rows].map(r => r.id)
  if (ids.length) await c.query(`DELETE FROM "Notificacion" WHERE id = ANY($1)`, [ids])
}

// Deshacer la aceptación para no romper datos reales
await c.query('BEGIN')
await c.query(`UPDATE "Cliente-Trabajador" SET "IdTrabajador" = NULL, precio = NULL, estado = 'PENDIENTE', fecha_iniciado = NULL WHERE id = $1`, [res.idTrabajo])
await c.query(`UPDATE "Oferta" SET "ESTADO_OFERTA" = 'PENDIENTE' WHERE "idTrabajo" = $1`, [res.idTrabajo])
await c.query('COMMIT')
console.log('rollback OK')

await c.end()