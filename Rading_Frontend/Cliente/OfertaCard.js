// OfertaCard.jsx
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const COLORS = {
  blue:   '#1a3a8f',
  yellow: '#f5c518',
  gray:   '#6b7280',
  bg:     '#f4f6fb',
  white:  '#ffffff',
  ink:    '#1a1a2e',
  red:    '#e23744',
}

const shadow = (elevation = 6) => ({
  shadowColor: '#0b1740',
  shadowOffset: { width: 0, height: elevation / 1.5 },
  shadowOpacity: 0.16,
  shadowRadius: elevation,
  elevation,
})

function Iniciales({ nombre, size = 48, bg = '#b0b8c8', ring }) {
  const ini = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center' },
        ring && { borderWidth: 2.5, borderColor: ring, borderRadius: size / 2 + 3, padding: 2 },
      ]}
    >
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.28 }]}>{ini}</Text>
      </View>
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

// ─── Contador regresivo para subastas ─────────────────────────────────────
function useCountdown(targetDate) {
  const [msRestantes, setMsRestantes] = useState(() =>
    targetDate ? new Date(targetDate).getTime() - Date.now() : null
  )

  useEffect(() => {
    if (!targetDate) return
    const tick = () => setMsRestantes(new Date(targetDate).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return msRestantes
}

function formatearRestante(ms) {
  if (ms <= 0) return 'Cerrando…'
  const totalSeg = Math.floor(ms / 1000)
  const h = Math.floor(totalSeg / 3600)
  const m = Math.floor((totalSeg % 3600) / 60)
  const s = totalSeg % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function CountdownBadge({ expiraEn }) {
  const msRestantes = useCountdown(expiraEn)
  if (msRestantes == null) return null

  const cerrada = msRestantes <= 0
  const urgente = !cerrada && msRestantes <= 15 * 60 * 1000

  return (
    <View style={[styles.countdownBadge, (urgente || cerrada) && styles.countdownBadgeUrgente]}>
      <Ionicons name="time-outline" size={12} color={COLORS.white} />
      <Text style={styles.countdownText}>
        {cerrada ? 'Cerrando…' : formatearRestante(msRestantes)}
      </Text>
    </View>
  )
}

export default function OfertaCard({ item, esMejor, onAceptar }) {
  const esSubasta = !item.fijo
  const mostrarMejor = esSubasta && esMejor

  return (
    <View style={[styles.card, mostrarMejor && styles.cardMejor]}>
      <View style={styles.topGlow} pointerEvents="none" />

      {/* Fila de tags: tipo + urgencia a la izq, contador + mejor oferta a la der */}
      <View style={styles.badgesRow}>
        <View style={styles.tagsLeft}>
          <View style={[styles.tipoTag, esSubasta ? styles.tipoTagSubasta : styles.tipoTagFijo]}>
            <Ionicons
              name={esSubasta ? 'hammer-outline' : 'pricetag-outline'}
              size={11}
              color={esSubasta ? COLORS.white : COLORS.ink}
            />
            <Text style={[styles.tipoTagText, !esSubasta && styles.tipoTagTextFijo]}>
              {esSubasta ? 'Subasta' : 'Precio fijo'}
            </Text>
          </View>

          {item.emergencia && (
            <View style={styles.emergenciaTag}>
              <Ionicons name="alert-circle" size={11} color={COLORS.white} />
              <Text style={styles.emergenciaTagText}>Urgente</Text>
            </View>
          )}
        </View>

        <View style={styles.tagsRight}>
          {esSubasta && item.subastaTermina && (
            <CountdownBadge expiraEn={item.subastaTermina} />
          )}
          {mostrarMejor && (
            <View style={styles.mejorBadge}>
              <Ionicons name="trophy" size={12} color={COLORS.ink} />
              <Text style={styles.mejorBadgeText}>Mejor oferta</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.row}>
        <Iniciales
          nombre={item.nombre}
          size={52}
          bg={mostrarMejor ? COLORS.yellow : 'rgba(255,255,255,0.18)'}
          ring={mostrarMejor ? COLORS.white : 'rgba(255,255,255,0.35)'}
        />

        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <View style={styles.metaRow}>
            <Estrellas rating={item.rating} />
            <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.dot}>·</Text>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.65)" />
            <Text style={styles.metaText}>{item.distancia} km</Text>
          </View>
          <Text style={styles.costoExtra} numberOfLines={1}>
            Extra posible: ${item.costoExtraMin.toLocaleString()} – ${item.costoExtraMax.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.precio}>${item.precio.toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.aceptarBtn}
          onPress={() => onAceptar(item)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.aceptarBtnText}>Aceptar</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.blue} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blue,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadow(8),
  },
  cardMejor: {
    borderWidth: 2,
    borderColor: COLORS.yellow,
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagsLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, flexWrap: 'wrap' },
  tagsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  tipoTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
  },
  tipoTagSubasta: { backgroundColor: 'rgba(255,255,255,0.16)' },
  tipoTagFijo:    { backgroundColor: COLORS.yellow },
  tipoTagText:     { fontSize: 10.5, fontWeight: '700', color: COLORS.white },
  tipoTagTextFijo: { color: COLORS.ink },

  emergenciaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.red, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  emergenciaTagText: { fontSize: 10.5, fontWeight: '700', color: COLORS.white },

  mejorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.yellow, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
  mejorBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.ink },

  countdownBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  countdownBadgeUrgente: { backgroundColor: COLORS.red },
  countdownText: { fontSize: 10.5, fontWeight: '700', color: COLORS.white },

  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  info:        { flex: 1 },
  nombre:      { fontSize: 15, fontWeight: '600', color: COLORS.white, marginBottom: 5 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  metaText:    { fontSize: 11.5, color: 'rgba(255,255,255,0.78)' },
  dot:         { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  costoExtra:  { fontSize: 11.5, color: 'rgba(255,255,255,0.55)' },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  precio:      { fontSize: 21, fontWeight: '700', color: COLORS.white, letterSpacing: 0.2 },
  aceptarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  aceptarBtnText: { fontSize: 13.5, fontWeight: '700', color: COLORS.blue },

  avatar:      { alignItems: 'center', justifyContent: 'center' },
  avatarText:  { color: COLORS.white, fontWeight: '600' },
})