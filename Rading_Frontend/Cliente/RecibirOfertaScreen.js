// RecibirOfertasScreen.js
import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Modal, Platform,
  ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import OfertaCard from './OfertaCard'
import API_URL from '../configS'
import Header from '../Header'
import BottomNavBar from './NavegadorCliente'

const COLORS = {
  blue:   '#1a3a8f',
  yellow: '#f5c518',
  gray:   '#6b7280',
  grayLight: '#9ca3af',
  border: '#e5e7eb',
  bg:     '#f4f6fb',
  white:  '#ffffff',
  ink:    '#1a1a2e',
}

const shadow = (elevation = 6) => ({
  shadowColor: '#0b1740',
  shadowOffset: { width: 0, height: elevation / 1.5 },
  shadowOpacity: 0.16,
  shadowRadius: elevation,
  elevation,
})

function Iniciales({ nombre, size = 48, bg = '#b0b8c8' }) {
  const ini = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.28 }]}>{ini}</Text>
    </View>
  )
}

function Estrellas({ rating, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={COLORS.yellow}
        />
      ))}
    </View>
  )
}

function ModalOfertaAceptada({ oferta, servicioNombre, onClose }) {
  if (!oferta) return null
  return (
    <Modal transparent animationType="slide" visible={!!oferta} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalCard}>

          <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalChip}>TRABAJO EN CURSO</Text>
              <Text style={styles.modalTitulo}>{servicioNombre || 'Servicio'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={COLORS.blue} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalWorkerRow}>
            <Iniciales nombre={oferta.nombre} size={72} bg={COLORS.blue} />
            <View style={styles.modalWorkerInfo}>
              <Text style={styles.modalNombre}>{oferta.nombre}</Text>
              <View style={styles.modalMetaRow}>
                <Estrellas rating={oferta.rating} size={14} />
                <Text style={styles.modalRating}>{Number(oferta.rating ?? 0).toFixed(1)}</Text>
              </View>
              {oferta.distancia != null && (
                <Text style={styles.modalDistancia}>{oferta.distancia} km de distancia</Text>
              )}
            </View>
          </View>

          <View style={styles.modalDivider} />

          <View style={styles.modalPrecioRow}>
            <View>
              <Text style={styles.modalPrecioLabel}>Precio acordado</Text>
              <Text style={styles.modalPrecio}>${Number(oferta.precio).toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.modalPrecioLabel}>Costo extra posible</Text>
              <Text style={styles.modalExtra}>
                ${Number(oferta.costoExtraMin ?? 0).toLocaleString()} – ${Number(oferta.costoExtraMax ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.modalAvisoCard}>
            <Ionicons name="lock-closed-outline" size={15} color={COLORS.gray} style={{ marginTop: 1 }} />
            <Text style={styles.modalAvisoTexto}>
              El pago queda retenido en la app hasta que confirmes que el trabajo fue completado
            </Text>
          </View>

          <TouchableOpacity style={styles.chatBtn} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.white} />
            <Text style={styles.chatBtnText}>Abrir chat</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  )
}

export default function RecibirOfertasScreen({ route, navigation }) {
  // 👇 esperamos idTrabajo (id de la fila Cliente-Trabajador "abierta") y
  // opcionalmente servicioNombre para el título del header/modal.
  const { idTrabajo, servicioNombre, tituloSolicitud, usuario } = route?.params || {}

  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ofertaAceptada, setOfertaAceptada] = useState(null)
  const [aceptando, setAceptando] = useState(false)

  const fetchOfertas = useCallback(async () => {
    console.log('🔵 idTrabajo recibido en la screen:', idTrabajo)
    if (!idTrabajo) {
      setLoading(false)
      setError('No se encontró el trabajo')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_URL}/cliente/ofertas/${idTrabajo}`)
      if (!res.ok) throw new Error(`Error ${res.status} al obtener ofertas`)
      const data = await res.json()

      const mapeadas = (Array.isArray(data) ? data : []).map(o => ({
        id: o.id,
        idTrabajador: o.idTrabajador,
        nombre: `${o.nombre ?? ''} ${o.apellido ?? ''}`.trim(),
        rating: Number(o.estrellas ?? 0),
        distancia: o.distancia ?? null,
        costoExtraMin: Number(o.costoExtraMin ?? 0),
        costoExtraMax: Number(o.costoExtraMax ?? 0),
        precio: Number(o.precio ?? o.precioSolicitud ?? 0),
      }))

      setOfertas(mapeadas)
    } catch (e) {
      console.error('Error al cargar ofertas:', e)
      setError('No se pudieron cargar las ofertas')
      setOfertas([])
    } finally {
      setLoading(false)
    }
  }, [idTrabajo])

  useFocusEffect(
    useCallback(() => {
      fetchOfertas()
    }, [fetchOfertas])
  )

  const handleAceptar = async (item) => {
    try {
      setAceptando(true)
      const res = await fetch(`${API_URL}/cliente/ofertas/${item.id}/aceptar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message ?? `Error ${res.status} al aceptar la oferta`)
      }

      setOfertaAceptada(item)
    } catch (err) {
      console.error('Error al aceptar oferta:', err)
      Alert.alert('Error', err.message ?? 'No se pudo aceptar la oferta. Intentá de nuevo.')
    } finally {
      setAceptando(false)
    }
  }

  const mejorOferta = ofertas.length > 0
    ? ofertas.reduce((a, b) => (a.precio < b.precio ? a : b))
    : null

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <Header usuario={usuario} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Solicitud activa</Text>
          <Text style={styles.headerTitulo}>{tituloSolicitud || servicioNombre || 'Tu solicitud'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>Cargando ofertas...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOfertas}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : ofertas.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="mail-open-outline" size={48} color={COLORS.grayLight} />
          <Text style={styles.emptyText}>Todavía no recibiste ofertas</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          <View style={styles.seccionRow}>
            <Text style={styles.seccionLabel}>Ofertas recibidas</Text>
            <View style={styles.contadorPill}>
              <Text style={styles.contadorText}>{ofertas.length}</Text>
            </View>
          </View>

          {ofertas.map(item => (
            <OfertaCard
              key={item.id}
              item={item}
              esMejor={mejorOferta?.id === item.id}
              onAceptar={() => handleAceptar(item)}
            />
          ))}

          <View style={styles.avisoCard}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.gray} style={{ marginTop: 1 }} />
            <Text style={styles.avisoTexto}>
              El pago queda retenido en la app hasta que confirmes que el trabajo fue completado
            </Text>
          </View>

        </ScrollView>
      )}

      {aceptando && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}

      <ModalOfertaAceptada
        oferta={ofertaAceptada}
        servicioNombre={tituloSolicitud || servicioNombre}
        onClose={() => {
          setOfertaAceptada(null)
          navigation?.goBack()
        }}
      />

      <BottomNavBar usuario={usuario} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  headerSub:    { fontSize: 11, color: COLORS.grayLight, marginBottom: 1 },
  headerTitulo: { fontSize: 16, fontWeight: '600', color: COLORS.blue },
  headerBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  loadingText: { color: COLORS.blue, fontSize: 14 },
  errorText: { color: '#E53E3E', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 4, backgroundColor: COLORS.blue, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { color: COLORS.grayLight, fontSize: 15, textAlign: 'center' },

  overlayLoading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },

  seccionRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  seccionLabel: { fontSize: 12.5, fontWeight: '700', color: COLORS.blue, textTransform: 'uppercase', letterSpacing: 0.6 },
  contadorPill: { backgroundColor: COLORS.blue, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  contadorText: { fontSize: 11, fontWeight: '700', color: COLORS.white },

  avisoCard:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#e9ecf0', borderRadius: 14, padding: 14, marginTop: 4 },
  avisoTexto: { flex: 1, fontSize: 12, color: COLORS.gray, lineHeight: 18 },

  avatar:     { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    ...shadow(10),
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },

  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalChip:    { fontSize: 10, fontWeight: '700', color: COLORS.blue, letterSpacing: 0.8, marginBottom: 4 },
  modalTitulo:  { fontSize: 17, fontWeight: '600', color: COLORS.ink },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },

  modalWorkerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  modalWorkerInfo: { flex: 1 },
  modalNombre: { fontSize: 18, fontWeight: '600', color: COLORS.ink, marginBottom: 4 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  modalRating: { fontSize: 13, color: COLORS.gray },
  modalDistancia: { fontSize: 12, color: COLORS.gray },

  modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginBottom: 18 },

  modalPrecioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalPrecioLabel: { fontSize: 11, color: COLORS.grayLight, marginBottom: 4 },
  modalPrecio: { fontSize: 26, fontWeight: '700', color: COLORS.ink },
  modalExtra: { fontSize: 14, fontWeight: '600', color: COLORS.gray },

  modalAvisoCard: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: COLORS.bg, borderRadius: 14, padding: 13, marginBottom: 20 },
  modalAvisoTexto: { flex: 1, fontSize: 11.5, color: COLORS.gray, lineHeight: 17 },

  chatBtn: {
    backgroundColor: COLORS.blue, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...shadow(6),
  },
  chatBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
})  