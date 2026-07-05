import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import FotoPerfilCliente from './FotoPerfilCliente'

const BLUE = '#1565D8'

/**
 * Card de un trabajador contratado.
 * - Tocar la card entera navega al perfil del trabajador ("PerfilTrabajador").
 * - El botón de chat navega a la pantalla de chat con ese trabajador ("Chat").
 *
 * OJO: cambiá los nombres "PerfilTrabajador" y "Chat" por los que tengas
 * definidos vos en el Stack.Navigator de App.js si se llaman distinto.
 */
export default function TarjetaTrabajador({ item }) {
  const navigation = useNavigation()
  const nombreCompleto = `${item.nombre} ${item.apellido}`
  const rating = item.estrellas ?? '-'
  const rubro = item.servicio_nombre ?? 'Sin servicio'

  const irAlPerfil = () => {
    navigation.navigate('PerfilTrabajador', { trabajadorId: item.id })
  }

  const irAlChat = () => {
    navigation.navigate('Chat', { trabajadorId: item.id, nombre: nombreCompleto })
  }

  return (
    <TouchableOpacity style={styles.card} onPress={irAlPerfil} activeOpacity={0.85}>
      <FotoPerfilCliente nombre={nombreCompleto} foto={item.foto} size={44} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardNombre} numberOfLines={1}>{nombreCompleto}</Text>
        <Text style={styles.cardSub}>{rubro} · {rating} ⭐</Text>
      </View>
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={irAlChat}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingHorizontal: 12, backgroundColor: BLUE, borderRadius: 16, marginBottom: 12 },
  cardInfo: { flex: 1 },
  cardNombre: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  chatBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
})