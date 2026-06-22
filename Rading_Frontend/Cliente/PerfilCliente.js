import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import BottomNavBar from './NavegadorCliente'

const BLUE = '#1a3a8f'
const GRAY  = '#6b7280'
const BG    = '#f4f6fb'

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
      <Iniciales nombre={item.nombre} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardNombre}>{item.nombre}</Text>
        <Text style={styles.cardSub}>{item.rubro} &middot; {item.rating} estrella</Text>
        <Text style={styles.cardJobs}>{item.trabajosRealizados} {item.trabajosRealizados === 1 ? 'trabajo contratado' : 'trabajos contratados'}</Text>
      </View>
      <TouchableOpacity style={styles.chatBtn}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={BLUE} />
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

        {/* Perfil del cliente */}
        <View style={styles.perfilRow}>
          <View>
            <Iniciales nombre={cliente.nombre} size={70} />
            <TouchableOpacity style={styles.editAvatar}>
              <Ionicons name="pencil" size={10} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.perfilInfo}>
            <Text style={styles.nombre}>{cliente.nombre}</Text>
            <Text style={styles.preferencias}>{cliente.preferencias}</Text>
          </View>
        </View>

        {/* Descripcion */}
        <View style={styles.descCard}>
          <View style={styles.descHeader}>
            <Text style={styles.descLabel}>Descripcion del cliente</Text>
            <TouchableOpacity>
              <Ionicons name="pencil-outline" size={14} color={GRAY} />
            </TouchableOpacity>
          </View>
          <Text style={styles.descTexto}>{cliente.descripcion}</Text>
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
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  headerLoc:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTipo:    { fontSize: 14, fontWeight: '500', color: '#fff' },
  globeBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  body:          { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24 },

  perfilRow:     { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar:        { backgroundColor: '#b0b8c8', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontWeight: '500' },
  editAvatar:    { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  perfilInfo:    { flex: 1 },
  nombre:        { fontSize: 18, fontWeight: '500', color: '#1a1a2e', marginBottom: 2 },
  preferencias:  { fontSize: 12, color: GRAY, lineHeight: 17 },

  descCard:      { backgroundColor: BG, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: '#e5e7eb' },
  descHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  descLabel:     { fontSize: 12, fontWeight: '500', color: GRAY },
  descTexto:     { fontSize: 13, color: '#374151', lineHeight: 19 },

  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  seccionTitulo: { fontSize: 15, fontWeight: '500', color: '#1a1a2e' },
  verTodos:      { fontSize: 13, color: BLUE, fontWeight: '500' },

  card:          { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, borderWidth: 0.5, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardInfo:      { flex: 1 },
  cardNombre:    { fontSize: 14, fontWeight: '500', color: '#1a1a2e', marginBottom: 2 },
  cardSub:       { fontSize: 12, color: GRAY },
  cardJobs:      { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  chatBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center' },
})
