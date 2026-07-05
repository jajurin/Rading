import React, { useEffect, useState } from 'react'
import API_URL from '../configS'

import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context' // 👈 cross-platform (iOS/Android), no la de 'react-native'
import BottomNavBar from './NavegadorCliente'
import Header from '../Header' // 👈 ajustá esta ruta si Header.js no está en la raíz
import FotoPerfilCliente from './FotoPerfilCliente'
import EditarDescripcionPerfilCliente from './EditarDescripcionPerfilCliente'
import TarjetaPerfilCliente from './TarjetaPerfilCliente'

// Las direcciones geocodificadas vienen completas (calle, barrio, comuna,
// ciudad, cod. postal, país...). Para mostrar arriba nos quedamos solo con
// "Calle Número" para que no rompa el diseño del header ni de la tarjeta.
function direccionCorta(direccionCompleta) {
  if (!direccionCompleta) return 'Sin dirección'
  const partes = direccionCompleta.split(',').map(p => p.trim())
  // Formato típico de geocoding: "2625, Avenida Nazca, Villa del Parque, ..."
  if (partes.length >= 2) return `${partes[1]} ${partes[0]}`
  return partes[0]
}

const BASE_URL = API_URL
const BLUE     = '#1565D8'
const GRAY     = '#6b7280'
const BG       = '#e4e2e2'

export default function PerfilClienteScreen({ navigation, route }) {
  const { usuario } = route.params          // viene del Login
  const ID_CLIENTE  = usuario.idCliente     // id real del cliente logueado

  const [cliente,  setCliente]  = useState(null)
  const [trabajos, setTrabajos] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => { fetchDatos() }, [])

  const fetchDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1) Perfil del cliente
      const resClientes = await fetch(`${BASE_URL}/cliente/todos`)
      if (!resClientes.ok) throw new Error(`Error ${resClientes.status} al obtener clientes`)
      const clientes = await resClientes.json()
      const clienteEncontrado = clientes.find(c => c.id === ID_CLIENTE)
      if (!clienteEncontrado) throw new Error('Cliente no encontrado en la base de datos')
      setCliente(clienteEncontrado)

      // 2) Trabajos activos (trabajadores contratados)
      const resTrabajos = await fetch(`${BASE_URL}/cliente/trabajosActivos/${ID_CLIENTE}`)
      if (!resTrabajos.ok) throw new Error(`Error ${resTrabajos.status} al obtener trabajos activos`)
      setTrabajos(await resTrabajos.json())

    } catch (err) {
      console.error('fetchDatos error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Guarda un campo editable (preferencias / descripción) local y en el back.
  // OJO: la ruta '/cliente/actualizar/:id' es un supuesto, cambiala por la
  // que tengas en tu backend, y "preferencias"/"descripcion" por los nombres
  // reales de columna si son distintos.
  const actualizarCampo = async (campo, valor) => {
    setCliente(prev => ({ ...prev, [campo]: valor })) // actualiza al toque en pantalla

    try {
      const res = await fetch(`${BASE_URL}/cliente/actualizar/${ID_CLIENTE}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: valor }),
      })
      if (!res.ok) throw new Error(`Error ${res.status} al guardar ${campo}`)
    } catch (err) {
      console.error('actualizarCampo error:', err)
      // Si falla el guardado en el back, lo avisamos pero dejamos el valor
      // en pantalla para no perder lo que el usuario escribió.
      setError(`No se pudo guardar el cambio (${campo}). Reintentá más tarde.`)
    }
  }

  // Stub para cambiar la foto de perfil. Vos enganchás acá tu image picker
  // (expo-image-picker, etc). Cuando tengas la uri, hacé:
  // setCliente(prev => ({ ...prev, foto: uriNueva }))
  const editarFoto = () => {
    console.log('TODO: abrir selector de imagen para cambiar la foto')
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Cargando perfil…</Text>
      </SafeAreaView>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (error && !cliente) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDatos}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────
  const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`
  const ubicacion = direccionCorta(cliente.direccion)

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      <Header
        direccion={ubicacion}
        tipoDireccion="Casa"
        usuario={usuario}
        onSettings={() => {}}
        onCambiarDireccion={() => {}}
        onLogo={() => {}}
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Aviso no bloqueante si falló guardar algún campo */}
        {error && cliente && (
          <View style={styles.avisoBox}>
            <Text style={styles.avisoTexto}>{error}</Text>
          </View>
        )}

        {/* Tarjeta perfil */}
        <View style={styles.perfilCard}>
          <View style={styles.perfilRow}>
            <View>
              <FotoPerfilCliente
                nombre={nombreCompleto}
                foto={cliente.foto}
                size={78}
                editable
                onEditarFoto={editarFoto}
              />
              <Text style={styles.ubicacionTexto} numberOfLines={2} ellipsizeMode="tail">{ubicacion}</Text>
            </View>

            <View style={styles.perfilInfo}>
              <Text style={styles.nombre}>{nombreCompleto}</Text>

              <EditarDescripcionPerfilCliente
                etiqueta="Preferencias personales de servicio:"
                valor={cliente.preferencias}
                onGuardar={(v) => actualizarCampo('preferencias', v)}
              />

              <EditarDescripcionPerfilCliente
                etiqueta="Descripción del usuario:"
                valor={cliente.descripcion}
                onGuardar={(v) => actualizarCampo('descripcion', v)}
              />
            </View>
          </View>
        </View>

        {/* Trabajadores contratados */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Trabajadores contratados</Text>
          <TouchableOpacity>
            <Text style={styles.verTodos}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {trabajos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No tenés trabajos activos</Text>
          </View>
        ) : (
          trabajos.map((item, idx) => (
            <TarjetaPerfilCliente key={item.id ?? idx} item={item} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar usuario={usuario} pantallaActiva="perfil" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: BLUE },
  center:           { alignItems: 'center', justifyContent: 'center' },
  loadingText:      { color: '#fff', marginTop: 12, fontSize: 15 },
  errorText:        { color: '#fff', marginTop: 12, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:         { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28 },
  retryText:        { color: BLUE, fontWeight: '700', fontSize: 15 },
  body:             { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 16 },
  avisoBox:         { backgroundColor: '#FDECEC', borderRadius: 10, padding: 10, marginBottom: 12 },
  avisoTexto:       { color: '#B00020', fontSize: 12 },
  perfilCard:       { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  perfilRow:        { flexDirection: 'row' },
  ubicacionTexto:   { fontSize: 11, color: '#7A9AE8', textAlign: 'center', marginTop: 8, width: 90 },
  perfilInfo:       { flex: 1, marginLeft: 14 },
  nombre:           { fontSize: 24, fontWeight: '800', color: BLUE, marginBottom: 10 },
  seccionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seccionTitulo:    { fontSize: 18, fontWeight: '700', color: BLUE },
  verTodos:         { fontSize: 13, color: BLUE, fontWeight: '600' },
  emptyBox:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  emptyText:        { color: GRAY, fontSize: 14 },
})