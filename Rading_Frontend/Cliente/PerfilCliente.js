import React, { useEffect, useState } from 'react'
import API_URL from '../configS'

import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import BottomNavBar from './NavegadorCliente'
import Header from '../Header'
import FotoPerfilCliente from './FotoPerfilCliente'
import EditarDescripcionPerfilCliente from './EditarDescripcionPerfilCliente'
import TarjetaPerfilCliente from './TarjetaPerfilCliente'

// 👇 poné false cuando conectes el back real
const USE_MOCK_DATA = true

function direccionCorta(direccionCompleta) {
  if (!direccionCompleta) return 'Sin dirección'
  const partes = direccionCompleta.split(',').map(p => p.trim())
  if (partes.length >= 2) return `${partes[1]} ${partes[0]}`
  return partes[0]
}

function formatoMoneda(valor = 0) {
  return Number(valor).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function mesAnioCorto(fechaISO) {
  if (!fechaISO) return null
  try {
    const f = new Date(fechaISO)
    return f.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  } catch {
    return null
  }
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

// ── Billetera Rading ──────────────────────────────────────────────────
function BilleteraCard({ saldo, onAgregarSaldo, onVerMovimientos, onMetodosPago }) {
  return (
    <LinearGradient
      colors={[BLUE, BLUE_DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.walletCard}
    >
      <View style={styles.walletGlow} />

      <View style={styles.walletTopRow}>
        <View style={styles.walletTagRow}>
          <Ionicons name="wallet-outline" size={14} color="#fff" />
          <Text style={styles.walletTag}>Billetera Rading</Text>
        </View>
        <TouchableOpacity onPress={onVerMovimientos} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.walletSaldoLabel}>Saldo disponible</Text>
      <Text style={styles.walletSaldo}>{formatoMoneda(saldo)}</Text>

      <View style={styles.walletBtnRow}>
        <TouchableOpacity style={styles.walletBtnPrimary} onPress={onAgregarSaldo} activeOpacity={0.88}>
          <Ionicons name="add" size={16} color={BLUE_DARK} />
          <Text style={styles.walletBtnPrimaryText}>Agregar dinero</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.walletBtnSecondary} onPress={onMetodosPago} activeOpacity={0.85}>
          <Ionicons name="card-outline" size={15} color="#fff" />
          <Text style={styles.walletBtnSecondaryText}>Métodos de pago</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

// ── Fila de estadísticas rápidas ─────────────────────────────────────
function EstadisticasRow({ trabajosContratados, favoritos, miembroDesde }) {
  const items = [
    { icon: 'briefcase-outline', valor: trabajosContratados, label: 'Contratados' },
    { icon: 'heart-outline', valor: favoritos, label: 'Favoritos' },
    { icon: 'ribbon-outline', valor: miembroDesde || '—', label: 'Miembro desde', small: !!miembroDesde },
  ]
  return (
    <View style={styles.statsRow}>
      {items.map((it, idx) => (
        <React.Fragment key={it.label}>
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Ionicons name={it.icon} size={16} color={BLUE} />
            </View>
            <Text style={[styles.statValor, it.small && { fontSize: 12.5 }]} numberOfLines={1}>
              {it.valor}
            </Text>
            <Text style={styles.statLabel}>{it.label}</Text>
          </View>
          {idx < items.length - 1 && <View style={styles.statDivider} />}
        </React.Fragment>
      ))}
    </View>
  )
}

// ── Accesos rápidos ────────────────────────────────────────────────────
function AccesosRapidos({ onDirecciones, onFavoritos, onHistorial, onAyuda }) {
  const accesos = [
    { icon: 'location-outline', label: 'Direcciones', onPress: onDirecciones },
    { icon: 'heart-outline', label: 'Favoritos', onPress: onFavoritos },
    { icon: 'document-text-outline', label: 'Historial', onPress: onHistorial },
    { icon: 'help-buoy-outline', label: 'Ayuda', onPress: onAyuda },
  ]
  return (
    <View style={styles.accesosGrid}>
      {accesos.map((a) => (
        <TouchableOpacity key={a.label} style={styles.accesoItem} onPress={a.onPress} activeOpacity={0.8}>
          <View style={styles.accesoIconWrap}>
            <Ionicons name={a.icon} size={19} color={BLUE} />
          </View>
          <Text style={styles.accesoLabel} numberOfLines={1}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ── Banner de referidos ────────────────────────────────────────────────
function ReferidosBanner({ onPress }) {
  return (
    <TouchableOpacity style={styles.referidosCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.referidosIconWrap}>
        <Ionicons name="gift-outline" size={22} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.referidosTitulo}>Invitá y ganá saldo</Text>
        <Text style={styles.referidosSub}>Sumá crédito en tu billetera por cada amigo que se una a Rading</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={BLUE} />
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
  // 👇 fallback para que no crashee si route.params viene undefined
  const usuario = route?.params?.usuario ?? {
    idCliente: 1,
    nombre: 'Usuario',
    apellido: 'Demo',
  }
  const ID_CLIENTE = usuario.idCliente

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
    if (USE_MOCK_DATA) {
      setCliente({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        direccion: 'Av. Corrientes 1234, CABA',
        estrellas: 4.5,
        saldo: 15000,
        favoritosCount: 3,
        creadoEn: '2024-03-15',
        preferencias: 'Prefiero horarios de mañana y que avisen con anticipación.',
        descripcion: 'Cliente frecuente, siempre puntual con los pagos.',
        foto: null,
      })
      setLoadingCliente(false)
      return
    }
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
    if (USE_MOCK_DATA) {
      setTrabajos([
        {
          id: 1,
          idTrabajador: 10,
          nombre: 'Carlos',
          apellido: 'Gómez',
          servicio_nombre: 'Plomería',
          foto: null,
        },
        {
          id: 2,
          idTrabajador: 11,
          nombre: 'Laura',
          apellido: 'Fernández',
          servicio_nombre: 'Electricidad',
          foto: null,
        },
      ])
      setLoadingTrabajos(false)
      return
    }
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
    if (USE_MOCK_DATA) return
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

  // TODO: reemplazar por los endpoints reales cuando estén disponibles
  // (billetera, favoritos, historial completo, direcciones guardadas)
  const irABilletera        = () => navigation?.navigate?.('BilleteraCliente', { usuario })
  const irAAgregarSaldo     = () => navigation?.navigate?.('AgregarSaldo', { usuario })
  const irAMetodosPago      = () => navigation?.navigate?.('MetodosPagoCliente', { usuario })
  const irADirecciones      = () => navigation?.navigate?.('DireccionesCliente', { usuario })
  const irAFavoritos        = () => navigation?.navigate?.('TrabajadoresFavoritos', { usuario })
  const irAHistorial        = () => navigation?.navigate?.('HistorialTrabajosCliente', { usuario })
  const irAAyuda            = () => navigation?.navigate?.('AyudaCliente', { usuario })
  const irAReferidos        = () => navigation?.navigate?.('ReferidosCliente', { usuario })

  const nombreCompleto = cliente ? `${cliente.nombre} ${cliente.apellido}` : ''
  const ubicacion = cliente ? direccionCorta(cliente.direccion) : ''
  const trabajosActivosCount = trabajos.length
  const saldoBilletera = cliente?.saldo ?? 0
  const favoritosCount = cliente?.favoritosCount ?? 0
  const miembroDesde = cliente ? mesAnioCorto(cliente.creadoEn ?? cliente.fechaRegistro) : null

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
                  <View style={styles.nombreRow}>
                    <Text style={styles.nombre} numberOfLines={1}>{nombreCompleto}</Text>
                    <View style={styles.verificadoBadge}>
                      <Ionicons name="checkmark-circle" size={15} color={BLUE} />
                    </View>
                  </View>

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

              <EstadisticasRow
                trabajosContratados={trabajosActivosCount}
                favoritos={favoritosCount}
                miembroDesde={miembroDesde}
              />
            </>
          )}
        </View>

        {/* ── Sección BILLETERA ──────────────────────────────────────── */}
        <BilleteraCard
          saldo={saldoBilletera}
          onAgregarSaldo={irAAgregarSaldo}
          onVerMovimientos={irABilletera}
          onMetodosPago={irAMetodosPago}
        />

        {/* ── Sección ACCESOS RÁPIDOS ────────────────────────────────── */}
        <AccesosRapidos
          onDirecciones={irADirecciones}
          onFavoritos={irAFavoritos}
          onHistorial={irAHistorial}
          onAyuda={irAAyuda}
        />

        {/* ── Banner REFERIDOS ───────────────────────────────────────── */}
        <ReferidosBanner onPress={irAReferidos} />

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
          <TouchableOpacity activeOpacity={0.7} onPress={irAHistorial}>
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
              onPressChat={(trabajo) =>
  navigation?.navigate('ChatCliente', {
    usuario,
    contacto: {
      idTrabajador: trabajo.idTrabajador,
      nombre: `${trabajo.nombre} ${trabajo.apellido}`.trim(),
      servicio: trabajo.servicio_nombre,
      foto: trabajo.foto,
      online: false,
    },
    // 👇 sin chatId: se crea recién cuando mande el primer mensaje
  })
}
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
    backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 16,
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
  nombreRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  nombre:           { fontSize: 22, fontWeight: '800', color: '#1A2233', flexShrink: 1 },
  verificadoBadge:  { marginTop: 1 },

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

  // ── Estadísticas ──────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EEF1F6',
  },
  statItem:         { flex: 1, alignItems: 'center' },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(21,101,216,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  statValor:        { fontSize: 15, fontWeight: '800', color: '#1A2233' },
  statLabel:        { fontSize: 10.5, color: GRAY, marginTop: 2, textAlign: 'center' },
  statDivider:      { width: 1, height: 40, backgroundColor: '#EEF1F6' },

  // ── Billetera ─────────────────────────────────────────────────────
  walletCard: {
    borderRadius: 22, padding: 20, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#0d4bb8', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28, shadowRadius: 18, elevation: 6,
  },
  walletGlow: {
    position: 'absolute', top: -50, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: '#fff', opacity: 0.08,
  },
  walletTopRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletTagRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletTag:        { color: '#fff', fontSize: 12, fontWeight: '700', opacity: 0.9 },
  walletSaldoLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 16 },
  walletSaldo:      { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  walletBtnRow:     { flexDirection: 'row', gap: 10, marginTop: 18 },
  walletBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 13, paddingVertical: 11, flex: 1,
  },
  walletBtnPrimaryText: { color: BLUE_DARK, fontWeight: '800', fontSize: 13 },
  walletBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 13, paddingVertical: 11, flex: 1,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  walletBtnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },

  // ── Accesos rápidos ───────────────────────────────────────────────
  accesosGrid: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 16, marginBottom: 16,
    shadowColor: '#0d4bb8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  accesoItem:       { flex: 1, alignItems: 'center', gap: 7 },
  accesoIconWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(21,101,216,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  accesoLabel:      { fontSize: 10.5, color: '#4A5568', fontWeight: '600' },

  // ── Referidos ─────────────────────────────────────────────────────
  referidosCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, padding: 16, marginBottom: 26,
    borderWidth: 1, borderColor: 'rgba(21,101,216,0.12)',
  },
  referidosIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  referidosTitulo:  { fontSize: 14, fontWeight: '800', color: '#1A2233' },
  referidosSub:     { fontSize: 11.5, color: GRAY, marginTop: 3, lineHeight: 15 },

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