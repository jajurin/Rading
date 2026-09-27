import API_URL from './configS'

/**
 * Sube una imagen local (uri de expo-image-picker) al backend y devuelve
 * la URL pública persistente (ej: http://tuServidor/uploads/xxxx.jpg).
 * Tirar error si algo falla, para que el que llama muestre el Alert.
 */
export async function subirFoto(uri) {
  const respuestaBlob = await fetch(uri)
  const blob = await respuestaBlob.blob()

  const formData = new FormData()
  formData.append('archivo', blob, `foto-${Date.now()}.jpg`)

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const dataErr = await res.json().catch(() => ({}))
    throw new Error(dataErr.message || `Error ${res.status} al subir la foto`)
  }

  const data = await res.json()
  return data.url
}