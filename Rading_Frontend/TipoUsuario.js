import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BLUE      = '#1565D8';
const BLUE_DARK = '#0D47A8';
const INK       = '#1A202C';
const MUTED     = '#8A94A6';

export default function TipoUsuario({ route, navigation }) {
  const { idUsuario, email } = route.params;
  const [seleccion, setSeleccion] = useState(null); // 'cliente' | 'trabajador' (solo feedback visual)

  const irA = (tipo, screen) => {
    setSeleccion(tipo);
    navigation.navigate(screen, { idUsuario, email });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={[BLUE_DARK, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="people" size={22} color="#fff" />
        </View>
        <Text style={styles.titulo}>¿Qué tipo de{'\n'}usuario sos?</Text>
        <Text style={styles.subtitulo}>Elegí cómo vas a usar Rading. Podés cambiarlo más adelante.</Text>
      </LinearGradient>

      <View style={styles.cardsContainer}>
        {/* Cliente */}
        <TouchableOpacity
          style={[styles.card, seleccion === 'cliente' && styles.cardActiva]}
          activeOpacity={0.9}
          onPress={() => irA('cliente', 'RegistrarseCliente')}
        >
          <View style={styles.cardBadge}>
            <Ionicons name="search" size={12} color={BLUE_DARK} />
            <Text style={styles.cardBadgeTexto}>Busco un servicio</Text>
          </View>

          <Image source={require('./assets/seleccionarCliente.png')} style={styles.imagen} />

          <View style={styles.etiqueta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etiquetaTitulo}>Soy Cliente</Text>
              <Text style={styles.etiquetaSubtitulo}>Contratá profesionales de confianza</Text>
            </View>
            <View style={styles.etiquetaFlecha}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Trabajador */}
        <TouchableOpacity
          style={[styles.card, seleccion === 'trabajador' && styles.cardActiva]}
          activeOpacity={0.9}
          onPress={() => irA('trabajador', 'RegistrarseTrabajador')}
        >
          <View style={styles.cardBadge}>
            <Ionicons name="hammer" size={12} color={BLUE_DARK} />
            <Text style={styles.cardBadgeTexto}>Ofrezco un servicio</Text>
          </View>

          <Image source={require('./assets/seleccionarTrabajador.png')} style={styles.imagen} />

          <View style={styles.etiqueta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etiquetaTitulo}>Soy Trabajador</Text>
              <Text style={styles.etiquetaSubtitulo}>Conseguí nuevos clientes cerca tuyo</Text>
            </View>
            <View style={styles.etiquetaFlecha}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
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
    backgroundColor: '#F3F5FA',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginTop: -30,
    gap: 18,
  },

  // ====== HEADER PRINCIPAL ======
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 65,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    lineHeight: 18,
  },

  // ====== TARJETAS DE SELECCIÓN (CARDS) ======
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 6,
  },
  cardActiva: {
    borderColor: BLUE,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 20,
    backgroundColor: '#EAF1FD',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  cardBadgeTexto: {
    color: BLUE_DARK,
    fontSize: 11,
    fontWeight: '700',
  },
  imagen: {
    width: 190,
    height: 190,
    resizeMode: 'contain',
    marginTop: 4,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  etiquetaTitulo: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16.5,
  },
  etiquetaSubtitulo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11.5,
    marginTop: 2,
  },
  etiquetaFlecha: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
});