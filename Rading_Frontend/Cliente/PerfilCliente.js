import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import BottomNavBar from './NavegadorCliente'

const BLUE      = '#1565D8'
const LIGHTBLUE = '#7A9AE8'
const GRAY      = '#6b7280'
const FIELD_BG  = '#E4E2E2'
const BG        = '#e4e2e2'

// --- DATA FALSA, reemplaza con tu fetch ---
const cliente = {
  nombre: 'Juan Perez',
  preferencias: 'Servicio rapido y de calidad, puntualidad garantizada',
  descripcion: 'Busco profesionales confiables para el hogar. Valoro la puntualidad y el buen trato.',
  ubicacion: 'Av. Nazca 2625',
  tipoUbicacion: 'Casa',
}

// Trabajadores que el cliente contrato
const trabajadoresContratados = [
  { id: 1, nombre: 'Carlos Mendez',   rubro: 'Electricista', rating: 4.8, trabajosRealizados: 3 },
  { id: 2, nombre: 'Sofia Romero',    rubro: 'Plomera',      rating: 4.6, trabajosRealizados: 1 },
  { id: 3, nombre: 'Diego Fernandez', rubro: 'Pintor',       rating: 4.9, trabajosRealizados: 2 },
  { id: 4, nombre: 'Laura Gimenez',   rubro: 'Carpintera',   rating: 4.7, trabajosRealizados: 1 },
  { id: 5, nombre: 'Martin Alvarez',  rubro: 'Gasista',      rating: 4.5, trabajosRealizados: 4 },
]
// ------------------------------------------

function Iniciales({ nombre, size = 46 }) {
  const ini = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>{ini}</Text>
    </View>
  )
}

function TarjetaTrabajador({ item }) {
  return (
    <View style={styles.card}>
      <Iniciales nombre={item.nombre} size={44} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardNombre} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.cardSub}>{item.rubro} &middot; {item.rating} estrella</Text>
      </View>
      <TouchableOpacity style={styles.chatBtn}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

export default function PerfilClienteScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>{cliente.ubicacion}</Text>
          <TouchableOpacity style={styles.headerLoc}>
            <Text style={styles.headerTipo}>{cliente.tipoUbicacion}</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.globeBtn}>
          <Ionicons name="globe-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Tarjeta blanca: perfil + descripcion juntos, como en la imagen */}
        <View style={styles.perfilCard}>
          <View style={styles.perfilRow}>
            <View>
              <Iniciales nombre={cliente.nombre} size={78} />
              <TouchableOpacity style={styles.editAvatar}>
                <Ionicons name="pencil" size={10} color="#000" />
              </TouchableOpacity>
              <Text style={styles.ubicacionTexto}>{cliente.ubicacion}</Text>
            </View>

            <View style={styles.perfilInfo}>
              <Text style={styles.nombre}>{cliente.nombre}</Text>

              <View style={styles.fieldBox}>
                <View style={styles.fieldTextWrapper}>
                  <Text style={styles.fieldLabel}>preferencias personales de servicio:</Text>
                  <Text style={styles.fieldValue}>{cliente.preferencias}</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBox}>
                <View style={styles.fieldTextWrapper}>
                  <Text style={styles.fieldLabel}>Descripcion del usuario:</Text>
                  <Text style={styles.fieldValue}>{cliente.descripcion}</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Trabajadores contratados por este cliente */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Trabajadores contratados</Text>
          <TouchableOpacity>
            <Text style={styles.verTodos}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {trabajadoresContratados.map(item => (
          <TarjetaTrabajador key={item.id} item={item} />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
        <BottomNavBar/>
    </SafeAreaView>

  )


}


const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: BLUE },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerCenter:  { alignItems: 'center' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  headerLoc:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTipo:    { fontSize: 16, fontWeight: '700', color: '#fff' },
  globeBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  body:          { flex: 1, backgroundColor: BG, paddingHorizontal: 16, paddingTop: 16 },

  // --- Tarjeta blanca de perfil (como en la imagen) ---
  perfilCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  perfilRow:     { flexDirection: 'row' },

  avatar:        { backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: LIGHTBLUE },
  avatarText:    { color: '#fff', fontWeight: '700' },
  editAvatar:    { position: 'absolute', bottom: 24, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  ubicacionTexto:{ fontSize: 11, color: LIGHTBLUE, textAlign: 'center', marginTop: 8, width: 90 },

  perfilInfo:    { flex: 1, marginLeft: 14 },
  nombre:        { fontSize: 24, fontWeight: '800', color: BLUE, marginBottom: 10 },

  fieldBox:      { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: FIELD_BG, borderRadius: 12, padding: 10, marginBottom: 10 },
  fieldTextWrapper: { flex: 1, marginRight: 8 },
  fieldLabel:    { fontSize: 12, fontWeight: '700', color: BLUE, marginBottom: 2 },
  fieldValue:    { fontSize: 12, color: '#333333' },
  editButton:    { paddingTop: 2 },

  // --- Seccion trabajadores contratados ---
  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seccionTitulo: { fontSize: 18, fontWeight: '700', color: BLUE },
  verTodos:      { fontSize: 13, color: BLUE, fontWeight: '600' },

  // --- Pastillas azules (estilo "Usuarios contratados" de la imagen) ---
  card:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingHorizontal: 12, backgroundColor: BLUE, borderRadius: 16, marginBottom: 12 },
  cardInfo:      { flex: 1 },
  cardNombre:    { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  cardSub:       { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  chatBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
})