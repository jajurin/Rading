import pkg from 'pg'
import config from '../configs/dbconfig.js'
const { Client } = pkg

async function testConnection() {
  const client = new Client(config)
  try {
    await client.connect()
    const res = await client.query('SELECT NOW()')
    console.log('Conectado correctamente. Hora DB:', res.rows[0])
    await client.end()
  } catch (err) {
    console.error('Error conectando a la DB:', err.message)
    process.exitCode = 1
  }
}

testConnection()
