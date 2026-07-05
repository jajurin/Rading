import React, { useEffect, useState } from 'react'
import API_URL from '../configS'

import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import BottomNavBar from './NavegadorCliente'
import Header from '../Header'
import FotoPerfilCliente from './FotoPerfilCliente'
import EditarDescripcionPerfilCliente from './EditarDescripcionPerfilCliente'
import TarjetaPerfilCliente from './TarjetaPerfilCliente'

function direccionCorta(direccionCompleta) {
  if (!direccionCompleta) return 'Sin dirección'
  const partes = direccionCompleta.split(',').map(p => p.trim())
  if (partes.length >= 2) return `${partes[1]} ${partes[0]}`
  return partes[0]
}

function EstrellasRating({ valor = 0, size = 16, showNumber = true }) {
  const estrellas = Math.max(0, Math.min(5, Number(valor) || 0))
  const llenas = Math.floor(estrellas)
  const decimal = estrellas - llenas
  const media = decimal >= 0.25 && decimal < 0.75
  const extraLlena = decimal >= 0.75
  const totalLlenas = llenas + (extraLlena ? 1 : 0)
  const vacias = 5 - totalLlenas - (media ? 1 : 0)

  return (
    <View style={styles.ratingRow}>
      <View style={styles.starsRow}>
        {Array.from({ length: totalLlenas }).map((_, i) => (
          <Ionicons key={`f${i}`} name="star" size={size} color="#F5A623" />
        ))}
        {media && <Ionicons name="star-half" size={size} color="#F5A623" />}
        {Array.from({ length: vacias }).map((_, i) => (
          <Ionicons key={`e${i}`} name="star-outline" size={size} color="#F5A623" />
        ))}
      </View>
      {showNumber && (
        <Text style={styles.ratingNumero}>{estrellas.toFixed(1)}</Text>
      )}
    </View>
  )
}

function InfoBadge({ mensaje }) {
  return (
    <TouchableOpacity
      style={styles.infoBadge}
      onPress={() => Alert.alert('¿Por qué tengo este puntaje?', mensaje)}
      activeOpacity={0.6}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text style={styles.infoBadgeText}>?</Text>
    </TouchableOpacity>
  )
}

const BASE_URL   = API_URL
const BLUE       = '#1565D8'
const BLUE_DARK  = '#0d4bb8'
const STATUS_BAR = '#0D4FD7'
const GRAY       = '#6b7280'
const BG         = '#F2F4F8'

export default function PerfilClienteScreen({ navigation, route }) {
  const { usuario } = route.params
  const ID_CLIENTE  = usuario.idCliente

  const [cliente,  setCliente]  = useState(null)
  const [trabajos, setTrabajos] = useState([])

  // 👇 loadings separados: cada sección carga (y muestra) de forma independiente
  const [loadingCliente,  setLoadingCliente]  = useState(true)
  const [loadingTrabajos, setLoadingTrabajos] = useState(true)

  const [errorCliente,  setErrorCliente]  = useState(null)
  const [errorTrabajos, setErrorTrabajos] = useState(null)

  useEffect(() => {
    fetchCliente()
    fetchTrabajos()
  }, [])

  const fetchCliente = async () => {
    setLoadingCliente(true)
    setErrorCliente(null)
    try {
      const resClientes = await fetch(`${BASE_URL}/cliente/todos`)
      if (!resClientes.ok) throw new Error(`Error ${resClientes.status} al obtener clientes`)
      const clientes = await resClientes.json()
      const clienteEncontrado = clientes.find(c => c.id === ID_CLIENTE)
      if (!clienteEncontrado) throw new Error('Cliente no encontrado en la base de datos')
      setCliente(clienteEncontrado)
    } catch (err) {
      console.error('fetchCliente error:', err)
      setErrorCliente(err.message)
    } finally {
      setLoadingCliente(false)
    }
  }

  const fetchTrabajos = async () => {
    setLoadingTrabajos(true)
    setErrorTrabajos(null)
    try {
      const resTrabajos = await fetch(`${BASE_URL}/cliente/trabajosActivos/${ID_CLIENTE}`)
      if (!resTrabajos.ok) throw new Error(`Error ${resTrabajos.status} al obtener trabajos activos`)
      setTrabajos(await resTrabajos.json())
    } catch (err) {
      console.error('fetchTrabajos error:', err)
      setErrorTrabajos(err.message)
    } finally {
      setLoadingTrabajos(false)
    }
  }

  const actualizarCampo = async (campo, valor) => {
    setCliente(prev => ({ ...prev, [campo]: valor }))
    try {
      const res = await fetch(`${BASE_URL}/cliente/actualizar/${ID_CLIENTE}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: valor }),
      })
      if (!res.ok) throw new Error(`Error ${res.status} al guardar ${campo}`)
    } catch (err) {
      console.error('actualizarCampo error:', err)
      setErrorCliente(`No se pudo guardar el cambio (${campo}). Reintentá más tarde.`)
    }
  }

  const editarFoto = () => {
    console.log('TODO: abrir selector de imagen para cambiar la foto')
  }

  const nombreCompleto = cliente ? `${cliente.nombre} ${cliente.apellido}` : ''
  const ubicacion = cliente ? direccionCorta(cliente.direccion) : ''
  const trabajosActivosCount = trabajos.length

  return (
    
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={STATUS_BAR} />

      <Header
        direccion={ubicacion}
        tipoDireccion="Casa"
        usuario={usuario}
        onSettings={() => {}}
        onCambiarDireccion={() => {}}
        onLogo={() => {}}
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Sección PERFIL ─────────────────────────────────────────── */}
        <View style={styles.perfilCard}>
          {loadingCliente ? (
            <View style={styles.inlineLoadingBox}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={styles.inlineLoadingText}>Cargando perfil…</Text>
            </View>
          ) : errorCliente && !cliente ? (
            <View style={styles.errorInlineBox}>
              <Ionicons name="alert-circle-outline" size={30} color="#B9C2D0" />
              <Text style={styles.emptyText}>{errorCliente}</Text>
              <TouchableOpacity style={styles.retryBtnInline} onPress={fetchCliente} activeOpacity={0.85}>
                <Text style={styles.retryTextInline}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {errorCliente && (
                <View style={styles.avisoBox}>
                  <Ionicons name="warning-outline" size={16} color="#B00020" />
                  <Text style={styles.avisoTexto}>{errorCliente}</Text>
                </View>
              )}

              <View style={styles.perfilRow}>
                <View style={styles.perfilFotoCol}>
                  <FotoPerfilCliente
                    nombre={nombreCompleto}
                    foto={cliente.foto}
                    size={82}
                    editable
                    onEditarFoto={editarFoto}
                  />
                  <View style={styles.ubicacionPill}>
                    <Ionicons name="location-outline" size={12} color={BLUE} style={{ marginTop: 1 }} />
                    <Text style={styles.ubicacionTexto} numberOfLines={2} ellipsizeMode="tail">
                      {ubicacion}
                    </Text>
                  </View>
                </View>

                <View style={styles.perfilInfo}>
                  <Text style={styles.nombre} numberOfLines={1}>{nombreCompleto}</Text>

                  <View style={styles.ratingWithInfo}>
                    <EstrellasRating valor={cliente.estrellas} size={15} />
                    <InfoBadge mensaje="Este puntaje se calcula con las reseñas que te dejaron los trabajadores luego de cada servicio contratado." />
                  </View>

                  <View style={styles.divisor} />

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
            </>
          )}
        </View>

        {/* ── Sección TRABAJOS ───────────────────────────────────────── */}
        <View style={styles.seccionHeader}>
          <View style={styles.seccionTituloRow}>
            <Text style={styles.seccionTitulo}>Trabajadores contratados</Text>
            {!loadingTrabajos && trabajosActivosCount > 0 && (
              <View style={styles.contadorBadge}>
                <Text style={styles.contadorTexto}>{trabajosActivosCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.verTodos}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loadingTrabajos ? (
          <View style={styles.inlineLoadingBox}>
            <ActivityIndicator size="small" color={BLUE} />
            <Text style={styles.inlineLoadingText}>Cargando trabajos…</Text>
          </View>
        ) : errorTrabajos ? (
          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle-outline" size={36} color="#B9C2D0" />
            <Text style={styles.emptyText}>{errorTrabajos}</Text>
            <TouchableOpacity style={styles.retryBtnInline} onPress={fetchTrabajos} activeOpacity={0.85}>
              <Text style={styles.retryTextInline}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : trabajos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={36} color="#B9C2D0" />
            <Text style={styles.emptyText}>No tenés trabajos activos</Text>
          </View>
        ) : (
          trabajos.map((item, idx) => (
            <TarjetaPerfilCliente
              key={item.id ?? idx}
              item={item}
              onPressChat={(trabajo) => navigation?.navigate('Chat', { trabajo })}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar usuario={usuario} pantallaActiva="perfil" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: STATUS_BAR },

  body:             { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 16 },

  inlineLoadingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 20, justifyContent: 'center',
  },
  inlineLoadingText: { color: GRAY, fontSize: 13 },

  errorInlineBox:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },

  retryBtnInline:   { marginTop: 10, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 20 },
  retryTextInline:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  avisoBox:         {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDECEC', borderRadius: 12, padding: 12, marginBottom: 14,
  },
  avisoTexto:       { color: '#B00020', fontSize: 12, flex: 1 },

  perfilCard:       {
    backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 26,
    shadowColor: '#0d4bb8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 3,
  },
  perfilRow:        { flexDirection: 'row' },
  perfilFotoCol:    { alignItems: 'center' },

  ubicacionPill: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 4,
    backgroundColor: 'rgba(21,101,216,0.08)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 6, marginTop: 10,
    maxWidth: 110, alignSelf: 'center',
  },
  ubicacionTexto:   { fontSize: 10.5, color: BLUE_DARK, fontWeight: '600', flexShrink: 1, lineHeight: 13 },

  perfilInfo:       { flex: 1, marginLeft: 16 },
  nombre:           { fontSize: 22, fontWeight: '800', color: '#1A2233', marginBottom: 6 },

  ratingWithInfo:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoBadge: {
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: 'rgba(21,101,216,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoBadgeText:    { color: BLUE, fontSize: 10.5, fontWeight: '800' },

  ratingRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starsRow:         { flexDirection: 'row', gap: 1 },
  ratingNumero:     { fontSize: 13, fontWeight: '700', color: '#8A94A6' },

  divisor:          { height: 1, backgroundColor: '#EEF1F6', marginVertical: 12 },

  seccionHeader:    {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  seccionTituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seccionTitulo:    { fontSize: 17, fontWeight: '800', color: '#1A2233' },
  contadorBadge:    {
    backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1,
    minWidth: 20, alignItems: 'center',
  },
  contadorTexto:    { color: '#fff', fontSize: 11, fontWeight: '800' },
  verTodos:         { fontSize: 13, color: BLUE, fontWeight: '700' },

  emptyBox:         {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 10,
    backgroundColor: '#fff', borderRadius: 18,
  },
  emptyText:        { color: GRAY, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
})