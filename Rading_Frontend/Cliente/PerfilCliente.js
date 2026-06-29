import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import BottomNavBar from './NavegadorCliente'

const BASE_URL  = 'http://localhost:3000'
const BLUE      = '#1565D8'
const LIGHTBLUE = '#7A9AE8'
const GRAY      = '#6b7280'
const FIELD_BG  = '#E4E2E2'
const BG        = '#e4e2e2'

// â”€â”€â”€ Helpers (FUERA del componente principal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Iniciales({ nombre, size = 46 }) {
  const ini = nombre
    ? nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>{ini}</Text>
    </View>
  )
}

function TarjetaTrabajador({ item }) {
  const nombreCompleto = `${item.nombre} ${item.apellido}`
  const rating         = item.estrellas ?? '-'
  const rubro          = item.servicio_nombre ?? 'Sin servicio'
  return (
    <View style={styles.card}>
      <Iniciales nombre={nombreCompleto} size={44} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardNombre} numberOfLines={1}>{nombreCompleto}</Text>
        <Text style={styles.cardSub}>{rubro} Â· {rating} â­</Text>
      </View>
      <TouchableOpacity style={styles.chatBtn}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

// â”€â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Cargando perfilâ€¦</Text>
      </SafeAreaView>
    )
  }

  // â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (error) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Ionicons name="cloud-offline-outline" size={48} color="#fff" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDatos}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`
  const ubicacion      = cliente.direccion ?? 'Sin direcciÃ³n'

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>{ubicacion}</Text>
          <TouchableOpacity style={styles.headerLoc}>
            <Text style={styles.headerTipo}>Casa</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.globeBtn}>
          <Ionicons name="globe-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Tarjeta perfil */}
        <View style={styles.perfilCard}>
          <View style={styles.perfilRow}>
            <View>
              <Iniciales nombre={nombreCompleto} size={78} />
              <TouchableOpacity style={styles.editAvatar}>
                <Ionicons name="pencil" size={10} color="#000" />
              </TouchableOpacity>
              <Text style={styles.ubicacionTexto}>{ubicacion}</Text>
            </View>

            <View style={styles.perfilInfo}>
              <Text style={styles.nombre}>{nombreCompleto}</Text>

              <View style={styles.fieldBox}>
                <View style={styles.fieldTextWrapper}>
                  <Text style={styles.fieldLabel}>Email:</Text>
                  <Text style={styles.fieldValue}>{cliente.email ?? '-'}</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBox}>
                <View style={styles.fieldTextWrapper}>
                  <Text style={styles.fieldLabel}>TelÃ©fono:</Text>
                  <Text style={styles.fieldValue}>{cliente.telefono ?? '-'}</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBox}>
                <View style={styles.fieldTextWrapper}>
                  <Text style={styles.fieldLabel}>CalificaciÃ³n:</Text>
                  <Text style={styles.fieldValue}>{cliente.estrellas ?? '-'} â­</Text>
                </View>
              </View>
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
            <Ionicons name="briefcase-outline" size={32} color={GRAY} />
            <Text style={styles.emptyText}>No tenÃ©s trabajos activos</Text>
          </View>
        ) : (
          trabajos.map((item, idx) => (
            <TarjetaTrabajador key={item.id ?? idx} item={item} />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <BottomNavBar />
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
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerCenter:     { alignItems: 'center' },
  headerSub:        { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  headerLoc:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTipo:       { fontSize: 16, fontWeight: '700', color: '#fff' },
  globeBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  body:             { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 16 },
  perfilCard:       { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  perfilRow:        { flexDirection: 'row' },
  avatar:           { backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: LIGHTBLUE },
  avatarText:       { color: '#fff', fontWeight: '700' },
  editAvatar:       { position: 'absolute', bottom: 24, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  ubicacionTexto:   { fontSize: 11, color: LIGHTBLUE, textAlign: 'center', marginTop: 8, width: 90 },
  perfilInfo:       { flex: 1, marginLeft: 14 },
  nombre:           { fontSize: 24, fontWeight: '800', color: BLUE, marginBottom: 10 },
  fieldBox:         { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: FIELD_BG, borderRadius: 12, padding: 10, marginBottom: 10 },
  fieldTextWrapper: { flex: 1, marginRight: 8 },
  fieldLabel:       { fontSize: 12, fontWeight: '700', color: BLUE, marginBottom: 2 },
  fieldValue:       { fontSize: 12, color: '#333333' },
  editButton:       { paddingTop: 2 },
  seccionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seccionTitulo:    { fontSize: 18, fontWeight: '700', color: BLUE },
  verTodos:         { fontSize: 13, color: BLUE, fontWeight: '600' },
  card:             { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingHorizontal: 12, backgroundColor: BLUE, borderRadius: 16, marginBottom: 12 },
  cardInfo:         { flex: 1 },
  cardNombre:       { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  cardSub:          { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  chatBtn:          { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emptyBox:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  emptyText:        { color: GRAY, fontSize: 14 },
})
