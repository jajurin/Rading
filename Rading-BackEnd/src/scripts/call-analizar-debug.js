(async () => {
  try {
    const res = await fetch('http://127.0.0.1:3000/solicitud/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcionOriginal: 'Reparar una filtracion en el baño, agua baja y huele mal' })
    })
    const json = await res.json().catch(() => null)
    console.log('Status:', res.status)
    console.log('Response:', JSON.stringify(json, null, 2))
  } catch (err) {
    console.error('Request error:', err)
  }
})();
