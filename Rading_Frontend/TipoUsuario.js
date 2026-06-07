import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function TipoUsuario({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.titulo}>¿Qué tipo de{'\n'}usuario es?</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Cliente */}
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.85} 
          onPress={() => navigation.navigate('RegistrarseCliente')}
        >
          <Image source={require('./assets/seleccionarCliente.png')} style={styles.imagen} />
          <View style={styles.etiqueta}>
            <Text style={styles.etiquetaTexto}>Cliente</Text>
          </View>
        </TouchableOpacity>

        {/* Trabajador */}
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.85} 
        onPress={() => navigation.navigate('RegistrarseTrabajador')}
        >
          <Image source={require('./assets/seleccionarTrabajador.png')} style={styles.imagen} />
          <View style={styles.etiqueta}>
            <Text style={styles.etiquetaTexto}>Trabajador</Text>
          </View>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ====== ESTRUCTURA GENERAL ======
  container: { 
    flex: 1, 
    backgroundColor: '#F0F0F0', 
  },
  cardsContainer: { 
    paddingHorizontal: 24, 
    paddingTop: 30, 
    gap: 20, 
  },

  // ====== HEADER PRINCIPAL ======
  header: {
    backgroundColor: '#1565D8',
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 60,
    paddingHorizontal: 28,
  },
  titulo: { 
    color: 'white', 
    fontSize: 34, 
    fontWeight: '800', 
    lineHeight: 42, 
  },

  // ====== TARJETAS DE SELECCIÓN (CARDS) ======
  card: { 
    backgroundColor: '#D6E4FF', 
    borderRadius: 20, 
    overflow: 'hidden', 
    alignItems: 'center', 
    paddingTop: 30,
    justifyContent: 'flex-end', 
    height: 260, 
  },
  imagen: { 
    width: 200,     
    height: 200,    
    resizeMode: 'contain', 
    marginBottom: -5, 
  },
  etiqueta: { 
    backgroundColor: '#1565D8', 
    width: '100%', 
    paddingVertical: 14, 
    alignItems: 'center', 
  },
  etiquetaTexto: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 16, 
    letterSpacing: 0.5, 
  },
});