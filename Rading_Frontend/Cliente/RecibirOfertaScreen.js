import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const BLUE   = '#1a3a8f'
const YELLOW = '#f5c518'
const GRAY   = '#6b7280'
const BG     = '#f4f6fb'
const WHITE  = '#ffffff'

// --- DATA FALSA, reemplaza con tu fetch ---
const solicitud = {
  titulo: 'Reparacion de Heladera',
  servicio: 'Reparacion de Plomeria',
}

const ofertas = [
  { id: 1, nombre: 'Jonatan Naifeld', rating: 5.0, distancia: 5.7, costoExtraMin: 0,    costoExtraMax: 20000, precio: 100000 },
  { id: 2, nombre: 'Jonatan Naifeld', rating: 5.0, distancia: 5.7, costoExtraMin: 0,    costoExtraMax: 20000, precio: 110000 },
  { id: 3, nombre: 'Carlos Mendez',   rating: 4.8, distancia: 3.2, costoExtraMin: 0,    costoExtraMax: 15000, precio: 120000 },
  { id: 4, nombre: 'Sofia Romero',    rating: 4.2, distancia: 7.1, costoExtraMin: 5000, costoExtraMax: 25000, precio: 130000 },
]
// ------------------------------------------

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
          color={YELLOW}
        />
      ))}
    </View>
  )
}

function TarjetaOferta({ item, esMejor, onAceptar }) {
  return (
    <View style={[styles.ofertaCard, esMejor && styles.ofertaCardMejor]}>
      {esMejor && (
        <View style={styles.mejorBadgeWrap}>
          <View style={styles.mejorBadge}>
            <Text style={styles.mejorBadgeText}>Mejor oferta</Text>
          </View>
        </View>
      )}
      <View style={styles.ofertaRow}>
        <Iniciales nombre={item.nombre} size={50} />
        <View style={styles.ofertaInfo}>
          <Text style={styles.ofertaNombre}>{item.nombre}</Text>
          <View style={styles.ofertaMetaRow}>
            <Estrellas rating={item.rating} />
            <Text style={styles.ofertaMetaText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.dot}>Â·</Text>
            <Text style={styles.ofertaMetaText}>{item.distancia} km</Text>
          </View>
          <Text style={styles.costoExtra}>
            Extra posible: ${item.costoExtraMin.toLocaleString()} â€“ ${item.costoExtraMax.toLocaleString()}
          </Text>
        </View>
        <View style={styles.ofertaDerecha}>
          <Text style={styles.ofertaPrecio}>${(item.precio / 1000).toFixed(0)}.000</Text>
          <TouchableOpacity style={styles.aceptarBtn} onPress={() => onAceptar(item)} activeOpacity={0.8}>
            <Text style={styles.aceptarBtnText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function ModalOfertaAceptada({ oferta, onClose }) {
  if (!oferta) return null
  return (
    <Modal transparent animationType="slide" visible={!!oferta}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalCard}>

          <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalChip}>TRABAJO EN CURSO</Text>
              <Text style={styles.modalTitulo}>{solicitud.servicio}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={18} color={BLUE} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalWorkerRow}>
            <Iniciales nombre={oferta.nombre} size={72} bg="#1a3a8f" />
            <View style={styles.modalWorkerInfo}>
              <Text style={styles.modalNombre}>{oferta.nombre}</Text>
              <View style={styles.modalMetaRow}>
                <Estrellas rating={oferta.rating} size={14} />
                <Text style={styles.modalRating}>{oferta.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.modalDistancia}>{oferta.distancia} km de distancia</Text>
            </View>
          </View>

          <View style={styles.modalDivider} />

          <View style={styles.modalPrecioRow}>
            <View>
              <Text style={styles.modalPrecioLabel}>Precio acordado</Text>
              <Text style={styles.modalPrecio}>${oferta.precio.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.modalPrecioLabel}>Costo extra posible</Text>
              <Text style={styles.modalExtra}>
                ${oferta.costoExtraMin.toLocaleString()} â€“ ${oferta.costoExtraMax.toLocaleString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.chatBtn} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={20} color={WHITE} />
            <Text style={styles.chatBtnText}>Abrir chat</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  )
}

export default function RecibirOfertasScreen({ navigation }) {
  const [ofertaAceptada, setOfertaAceptada] = useState(null)
  const mejorOferta = ofertas.reduce((a, b) => a.precio < b.precio ? a : b)

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Solicitud activa</Text>
          <Text style={styles.headerTitulo}>{solicitud.titulo}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={20} color={GRAY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        <Text style={styles.seccionLabel}>Ofertas recibidas</Text>

        {ofertas.map(item => (
          <TarjetaOferta
            key={item.id}
            item={item}
            esMejor={item.id === mejorOferta.id}
            onAceptar={setOfertaAceptada}
          />
        ))}

        <View style={styles.avisoCard}>
          <Ionicons name="lock-closed-outline" size={16} color={GRAY} style={{ marginTop: 1 }} />
          <Text style={styles.avisoTexto}>
            El pago queda retenido en la app hasta que confirmes que el trabajo fue completado
          </Text>
        </View>

      </ScrollView>

      <ModalOfertaAceptada
        oferta={ofertaAceptada}
        onClose={() => setOfertaAceptada(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: BG },

  // Header
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  headerSub:          { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
  headerTitulo:       { fontSize: 15, fontWeight: '500', color: BLUE },
  headerBtn:          { width: 34, height: 34, borderRadius: 17, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  body:               { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
  seccionLabel:       { fontSize: 12, fontWeight: '500', color: BLUE, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },

  // Tarjeta oferta
  ofertaCard:         { backgroundColor: BLUE, borderRadius: 18, padding: 14, marginBottom: 10 },
  ofertaCardMejor:    { borderWidth: 2, borderColor: YELLOW },
  mejorBadgeWrap:     { alignItems: 'flex-end', marginBottom: 8 },
  mejorBadge:         { backgroundColor: YELLOW, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  mejorBadgeText:     { fontSize: 11, fontWeight: '500', color: '#1a1a2e' },

  ofertaRow:          { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:             { alignItems: 'center', justifyContent: 'center' },
  avatarText:         { color: WHITE, fontWeight: '500' },
  ofertaInfo:         { flex: 1 },
  ofertaNombre:       { fontSize: 14, fontWeight: '500', color: WHITE, marginBottom: 4 },
  ofertaMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  ofertaMetaText:     { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  dot:                { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  costoExtra:         { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  ofertaDerecha:      { alignItems: 'flex-end', gap: 10 },
  ofertaPrecio:       { fontSize: 20, fontWeight: '500', color: WHITE },
  aceptarBtn:         { backgroundColor: WHITE, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 7 },
  aceptarBtnText:     { fontSize: 13, fontWeight: '500', color: BLUE },

  // Aviso
  avisoCard:          { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#e9ecf0', borderRadius: 14, padding: 14, marginTop: 4 },
  avisoTexto:         { flex: 1, fontSize: 12, color: GRAY, lineHeight: 18 },

  // Modal
  modalOverlay:       { flex: 1, justifyContent: 'flex-end' },
  modalDismiss:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard:          { backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 20 },

  modalHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalChip:          { fontSize: 10, fontWeight: '500', color: BLUE, letterSpacing: 0.8, marginBottom: 4 },
  modalTitulo:        { fontSize: 17, fontWeight: '500', color: '#1a1a2e', maxWidth: 260 },
  modalCloseBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  modalWorkerRow:     { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  modalWorkerInfo:    { flex: 1 },
  modalNombre:        { fontSize: 18, fontWeight: '500', color: '#1a1a2e', marginBottom: 4 },
  modalMetaRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  modalRating:        { fontSize: 13, color: GRAY },
  modalDistancia:     { fontSize: 12, color: GRAY },

  modalDivider:       { height: 0.5, backgroundColor: '#e5e7eb', marginBottom: 18 },

  modalPrecioRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalPrecioLabel:   { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  modalPrecio:        { fontSize: 26, fontWeight: '500', color: '#1a1a2e' },
  modalExtra:         { fontSize: 14, fontWeight: '500', color: GRAY },

  chatBtn:            { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatBtnText:        { color: WHITE, fontSize: 15, fontWeight: '500' },
})
