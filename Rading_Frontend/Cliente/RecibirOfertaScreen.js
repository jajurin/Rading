// RecibirOfertasScreen.js
import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Modal, Platform,
  ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../ThemeContext'
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
  green:  '#22c55e',
  red:    '#e23744',
  subasta: '#B4740E',
  subastaBg: 'rgba(217,142,10,0.12)',
  subastaBorder: 'rgba(217,142,10,0.32)',
  fijo: '#6D28D9',
  fijoBg: 'rgba(109,40,217,0.10)',
  fijoBorder: 'rgba(109,40,217,0.28)',
}

const shadow = (elevation = 6) => ({
  shadowColor: '#0b1740',
  shadowOffset: { width: 0, height: elevation / 1.5 },
  shadowOpacity: 0.16,
  shadowRadius: elevation,
  elevation,
})

const TIPOS = [
  { key: 'subasta',  label: 'Subasta',   icon: 'hammer-outline',        color: COLORS.subasta },
  { key: 'fijo',      label: 'Fijos',     icon: 'pricetag-outline',      color: COLORS.fijo },
  { key: 'urgente',   label: 'Urgentes',  icon: 'alert-circle-outline',  color: COLORS.red },
]

const mapearOfertas = (data, idTrabajo, servicioNombreOverride = null) =>
  (Array.isArray(data) ? data : []).map(o => ({
    id: o.id,
    idTrabajo,
    idTrabajador: o.idTrabajador,
    nombre: `${o.nombre ?? ''} ${o.apellido ?? ''}`.trim(),
    rating: Number(o.estrellas ?? 0),
    distancia: o.distancia ?? null,
    costoExtraMin: Number(o.costoExtraMin ?? 0),
    costoExtraMax: Number(o.costoExtraMax ?? 0),
    precio: Number(o.precio ?? o.precioSolicitud ?? 0),
    servicioNombre: servicioNombreOverride,
    fijo: Boolean(o.fijo),
    emergencia: Boolean(o.emergencia),
    subastaTermina: o.subastaTermina ?? null,
  }))

export default function RecibirOfertasScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { idTrabajo: idTrabajoInicial, servicioNombre, tituloSolicitud, usuario } = route?.params || {}
  const idCliente = usuario?.idCliente

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [solicitudes, setSolicitudes] = useState([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)

  const [seleccionada, setSeleccionada] = useState(idTrabajoInicial ?? null)

  const [tipo, setTipo] = useState('subasta')

  const [ofertas, setOfertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ofertaAceptada, setOfertaAceptada] = useState(null)
  const [aceptando, setAceptando] = useState(false)

  const fetchSolicitudes = useCallback(async () => {
    if (!idCliente) {
      setLoadingSolicitudes(false)
      return
    }
    try {
      setLoadingSolicitudes(true)
      const res = await fetch(`${API_URL}/cliente/ofertas/pendientes/${idCliente}`)
      if (!res.ok) throw new Error(`Error ${res.status} al obtener solicitudes`)
      const data = await res.json()
      const lista = Array.isArray(data) ? data : []
      setSolicitudes(lista)

      setSeleccionada(prev => {
        if (prev == null) return null
        const sigueActiva = lista.some(s => s.idTrabajo === prev)
        return sigueActiva ? prev : null
      })
    } catch (e) {
      console.error('Error al cargar solicitudes activas:', e)
      setSolicitudes([])
    } finally {
      setLoadingSolicitudes(false)
    }
  }, [idCliente])

  const fetchOfertas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (seleccionada != null) {
        const res = await fetch(`${API_URL}/cliente/ofertas/${seleccionada}`)
        if (!res.ok) throw new Error(`Error ${res.status} al obtener ofertas`)
        const data = await res.json()
        const s = solicitudes.find(s => s.idTrabajo === seleccionada)
        setOfertas(mapearOfertas(data, seleccionada, s?.servicio_nombre))
        return
      }

      if (solicitudes.length === 0) {
        setOfertas([])
        return
      }

      const resultados = await Promise.all(
        solicitudes.map(async (s) => {
          const res = await fetch(`${API_URL}/cliente/ofertas/${s.idTrabajo}`)
          if (!res.ok) return []
          const data = await res.json()
          return mapearOfertas(data, s.idTrabajo, s.servicio_nombre)
        })
      )
      setOfertas(resultados.flat())

    } catch (e) {
      console.error('Error al cargar ofertas:', e)
      setError('No se pudieron cargar las ofertas')
      setOfertas([])
    } finally {
      setLoading(false)
    }
  }, [seleccionada, solicitudes])

  useFocusEffect(
    useCallback(() => {
      fetchSolicitudes()
    }, [fetchSolicitudes])
  )

  useFocusEffect(
    useCallback(() => {
      if (!loadingSolicitudes) fetchOfertas()
    }, [fetchOfertas, loadingSolicitudes])
  )

  const handleAceptar = (item) => {
    if (Platform.OS === 'web') {
      const confirmado = window.confirm(
        `Vas a contratar a ${item.nombre} por $${Number(item.precio).toLocaleString()}. Esta acción no se puede deshacer.`
      )
      if (confirmado) confirmarAceptar(item)
      return
    }

    Alert.alert(
      '¿Aceptar esta oferta?',
      `Vas a contratar a ${item.nombre} por $${Number(item.precio).toLocaleString()}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', onPress: () => confirmarAceptar(item) },
      ]
    )
  }

  const confirmarAceptar = async (item) => {
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
      fetchSolicitudes()
    } finally {
      setAceptando(false)
    }
  }

  const mejoresPorTrabajo = useMemo(() => {
    const mapa = new Map()
    ofertas.forEach(o => {
      if (o.fijo) return
      const actual = mapa.get(o.idTrabajo)
      if (!actual || o.precio < actual.precio) mapa.set(o.idTrabajo, o)
    })
    return mapa
  }, [ofertas])

  const conteosPorTipo = useMemo(() => ({
    subasta: ofertas.filter(o => !o.fijo).length,
    fijo: ofertas.filter(o => o.fijo).length,
    urgente: ofertas.filter(o => o.emergencia).length,
  }), [ofertas])

  const ofertasFiltradas = useMemo(() => {
    if (tipo === 'urgente') return ofertas.filter(o => o.emergencia)
    if (tipo === 'fijo') return ofertas.filter(o => o.fijo)
    return ofertas.filter(o => !o.fijo)
  }, [ofertas, tipo])

  const tituloHeader = useMemo(() => {
    if (seleccionada == null) return 'Todas tus solicitudes'
    const s = solicitudes.find(s => s.idTrabajo === seleccionada)
    return s?.servicio_nombre || tituloSolicitud || servicioNombre || 'Tu solicitud'
  }, [seleccionada, solicitudes, tituloSolicitud, servicioNombre])

  const mensajeVacio = useMemo(() => {
    if (tipo === 'urgente') return 'No tenés ofertas urgentes pendientes'
    if (tipo === 'fijo') return 'Todavía nadie se postuló a tus trabajos de precio fijo'
    return 'Todavía no recibiste ofertas en subastas'
  }, [tipo])

  const colorSeccion = tipo === 'urgente' ? COLORS.red : tipo === 'fijo' ? COLORS.fijo : COLORS.subasta

  // Componentes movidos dentro del componente principal
  const Iniciales = ({ nombre, size = 48, bg = '#b0b8c8' }) => {
    const ini = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.28 }]}>{ini}</Text>
      </View>
    )
  }

  const Estrellas = ({ rating, size = 12 }) => (
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

  const SolicitudesChips = ({ solicitudes, seleccionada, onSeleccionar }) => {
    if (solicitudes.length <= 1) return null

    const totalOfertas = solicitudes.reduce((acc, s) => acc + Number(s.cantidadOfertas ?? 0), 0)

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        <TouchableOpacity
          style={[styles.chip, seleccionada === null && styles.chipActive]}
          onPress={() => onSeleccionar(null)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="apps"
            size={13}
            color={seleccionada === null ? COLORS.white : COLORS.gray}
          />
          <Text style={[styles.chipText, seleccionada === null && styles.chipTextActive]}>
            General
          </Text>
          <Text style={[styles.chipCount, seleccionada === null && styles.chipCountActive]}>
            {totalOfertas}
          </Text>
        </TouchableOpacity>

        {solicitudes.map(s => {
          const activo = seleccionada === s.idTrabajo
          return (
            <TouchableOpacity
              key={s.idTrabajo}
              style={[styles.chip, activo && styles.chipActive]}
              onPress={() => onSeleccionar(s.idTrabajo)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.chipText, activo && styles.chipTextActive]}
                numberOfLines={1}
              >
                {s.servicio_nombre ?? 'Servicio'}
              </Text>
              <Text style={[styles.chipCount, activo && styles.chipCountActive]}>
                {s.cantidadOfertas}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    )
  }

  const TipoSelector = ({ tipo, onSeleccionar, conteos }) => (
    <View style={styles.tipoRow}>
      {TIPOS.map(t => {
        const activo = tipo === t.key
        const conteo = conteos[t.key] ?? 0
        return (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tipoBtn,
              activo && { backgroundColor: t.color },
              !activo && { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
            ]}
            onPress={() => onSeleccionar(t.key)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={t.icon}
              size={15}
              color={activo ? COLORS.white : t.color}
            />
            <Text style={[
              styles.tipoBtnText,
              activo && styles.tipoBtnTextActivo,
              !activo && { color: t.color },
            ]}>
              {t.label}
            </Text>
            {conteo > 0 && (
              <View style={[styles.tipoBadge, activo && styles.tipoBadgeActivo]}>
                <Text style={[styles.tipoBadgeText, activo && styles.tipoBadgeTextActivo, !activo && { color: t.color }]}>
                  {conteo}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const ModalOfertaAceptada = ({ oferta, servicioNombre, onClose, navigation, usuario, idCliente }) => {
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

            <TouchableOpacity
              style={styles.chatBtn}
              activeOpacity={0.85}
              onPress={() => {
                onClose()
                navigation.navigate('ChatCliente', {
                  usuario,
                  idCliente,
                  idTrabajador: oferta.idTrabajador,
                  contacto: { idTrabajador: oferta.idTrabajador, nombre: oferta.nombre },
                })
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.white} />
              <Text style={styles.chatBtnText}>Abrir chat</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.statusBarBg : COLORS.white} />

      <Header usuario={usuario} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>
            {seleccionada == null ? 'Solicitud activa' : 'Solicitud activa · filtrada'}
          </Text>
          <Text style={styles.headerTitulo}>{tituloHeader}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      {!loadingSolicitudes && (
        <SolicitudesChips
          solicitudes={solicitudes}
          seleccionada={seleccionada}
          onSeleccionar={setSeleccionada}
        />
      )}

      {!loading && !error && (
        <TipoSelector tipo={tipo} onSeleccionar={setTipo} conteos={conteosPorTipo} />
      )}

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
      ) : ofertasFiltradas.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons
            name={tipo === 'urgente' ? 'alert-circle-outline' : 'mail-open-outline'}
            size={48}
            color={COLORS.grayLight}
          />
          <Text style={styles.emptyText}>{mensajeVacio}</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          <View style={styles.seccionRow}>
            <Text style={[styles.seccionLabel, { color: colorSeccion }]}>
              {tipo === 'urgente' ? 'Ofertas urgentes' : tipo === 'fijo' ? 'Postulaciones a precio fijo' : 'Ofertas en subasta'}
            </Text>
            <View style={[styles.contadorPill, { backgroundColor: colorSeccion }]}>
              <Text style={styles.contadorText}>{ofertasFiltradas.length}</Text>
            </View>
          </View>

          {ofertasFiltradas.map(item => (
            <View key={`${item.idTrabajo}-${item.id}`}>
              {seleccionada == null && item.servicioNombre && (
                <View style={styles.servicioTag}>
                  <Ionicons name="construct-outline" size={11} color={COLORS.blue} />
                  <Text style={styles.servicioTagText}>{item.servicioNombre}</Text>
                </View>
              )}
              <OfertaCard
                item={item}
                esMejor={mejoresPorTrabajo.get(item.idTrabajo)?.id === item.id}
                onAceptar={() => handleAceptar(item)}
              />
            </View>
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
        servicioNombre={ofertaAceptada?.servicioNombre || tituloSolicitud || servicioNombre}
        navigation={navigation}
        usuario={usuario}
        idCliente={idCliente}
        onClose={() => {
          setOfertaAceptada(null)
          fetchSolicitudes()
        }}
      />

      <BottomNavBar usuario={usuario} />
    </SafeAreaView>
  )
}

const createStyles = (colors, isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDark ? colors.background : COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: isDark ? colors.surface : COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? colors.border : COLORS.border,
  },
  headerSub:    { fontSize: 11, color: isDark ? colors.textTertiary : COLORS.grayLight, marginBottom: 1 },
  headerTitulo: { fontSize: 16, fontWeight: '600', color: COLORS.blue },
  headerBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: isDark ? colors.surfaceVariant : COLORS.bg, alignItems: 'center', justifyContent: 'center' },

  chipsScroll: {
    flexGrow: 0,
    height: 54,
    backgroundColor: isDark ? colors.surface : COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? colors.border : COLORS.border,
  },
  chipsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    height: 54,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 14, backgroundColor: isDark ? colors.surfaceVariant : COLORS.bg,
    marginRight: 8,
    height: 34,
  },
  chipActive: { backgroundColor: COLORS.blue },
  chipText: { fontSize: 12.5, fontWeight: '600', color: isDark ? colors.text : COLORS.ink, maxWidth: 110 },
  chipTextActive: { color: COLORS.white },
  chipCount: { fontSize: 11, fontWeight: '700', color: isDark ? colors.textTertiary : COLORS.grayLight },
  chipCountActive: { color: 'rgba(255,255,255,0.75)' },

  // ── Selector de tipo ──
  tipoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: isDark ? colors.surface : COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? colors.border : COLORS.border,
  },
  tipoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: isDark ? colors.surfaceVariant : COLORS.bg,
  },
  tipoBtnText: { fontSize: 12.5, fontWeight: '700', color: isDark ? colors.textSecondary : COLORS.gray },
  tipoBtnTextActivo: { color: COLORS.white },
  tipoBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tipoBadgeActivo: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tipoBadgeText: { fontSize: 10, fontWeight: '700', color: isDark ? colors.text : COLORS.ink },
  tipoBadgeTextActivo: { color: COLORS.white },

  servicioTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 6, marginLeft: 2,
  },
  servicioTagText: { fontSize: 11, fontWeight: '700', color: COLORS.blue },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  loadingText: { color: COLORS.blue, fontSize: 14 },
  errorText: { color: '#E53E3E', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 4, backgroundColor: COLORS.blue, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { color: isDark ? colors.textTertiary : COLORS.grayLight, fontSize: 15, textAlign: 'center' },

  overlayLoading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },

  seccionRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  seccionLabel: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  contadorPill: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  contadorText: { fontSize: 11, fontWeight: '700', color: COLORS.white },

  avisoCard:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: isDark ? colors.surfaceVariant : '#e9ecf0', borderRadius: 14, padding: 14, marginTop: 4 },
  avisoTexto: { flex: 1, fontSize: 12, color: isDark ? colors.textSecondary : COLORS.gray, lineHeight: 18 },

  avatar:     { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    backgroundColor: isDark ? colors.card : COLORS.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    ...shadow(10),
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? colors.border : COLORS.border, alignSelf: 'center', marginBottom: 20 },

  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalChip:    { fontSize: 10, fontWeight: '700', color: COLORS.blue, letterSpacing: 0.8, marginBottom: 4 },
  modalTitulo:  { fontSize: 17, fontWeight: '600', color: isDark ? colors.text : COLORS.ink },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? colors.surfaceVariant : COLORS.bg, alignItems: 'center', justifyContent: 'center' },

  modalWorkerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  modalWorkerInfo: { flex: 1 },
  modalNombre: { fontSize: 18, fontWeight: '600', color: isDark ? colors.text : COLORS.ink, marginBottom: 4 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  modalRating: { fontSize: 13, color: isDark ? colors.textSecondary : COLORS.gray },
  modalDistancia: { fontSize: 12, color: isDark ? colors.textSecondary : COLORS.gray },

  modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: isDark ? colors.border : COLORS.border, marginBottom: 18 },

  modalPrecioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalPrecioLabel: { fontSize: 11, color: isDark ? colors.textTertiary : COLORS.grayLight, marginBottom: 4 },
  modalPrecio: { fontSize: 26, fontWeight: '700', color: isDark ? colors.text : COLORS.ink },
  modalExtra: { fontSize: 14, fontWeight: '600', color: isDark ? colors.textSecondary : COLORS.gray },

  modalAvisoCard: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: isDark ? colors.surfaceVariant : COLORS.bg, borderRadius: 14, padding: 13, marginBottom: 20 },
  modalAvisoTexto: { flex: 1, fontSize: 11.5, color: isDark ? colors.textSecondary : COLORS.gray, lineHeight: 17 },

  chatBtn: {
    backgroundColor: COLORS.blue, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...shadow(6),
  },
  chatBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
})
