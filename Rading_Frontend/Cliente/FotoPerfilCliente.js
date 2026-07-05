import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const BLUE = '#1565D8'
const LIGHTBLUE = '#7A9AE8'

/**
 * Avatar reutilizable.
 * - Si recibe `foto` (uri), muestra la imagen ahí (el espacio ya queda
 *   armado con el tamaño y el borde correctos, vos solo pasás la uri).
 * - Si no hay foto, muestra las iniciales del nombre como placeholder.
 * - Si `editable` es true, aparece la lapicerita para cambiar la foto
 *   (dispara onEditarFoto, ahí después enganchás tu image picker).
 */
export default function Iniciales({ nombre, foto, size = 46, editable = false, onEditarFoto }) {
  const ini = nombre
    ? nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>{ini}</Text>
        )}
      </View>

      {editable && (
        <TouchableOpacity
          style={styles.editAvatar}
          onPress={onEditarFoto}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="pencil" size={10} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LIGHTBLUE,
    overflow: 'hidden',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  editAvatar: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
})