import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../configS';

const BLUE      = '#1565D8';
const BLUE_DARK = '#0D47A8';
const BLUE_SOFT = '#EAF1FD';
const INK       = '#1A202C';
const MUTED     = '#8A94A6';

const CATEGORIAS = [
  { id: 1, key: 'domesticos',    label: 'Domésticos',    icon: 'home-outline',        descripcion: 'Limpieza, jardinería, mudanzas y más' },
  { id: 2, key: 'freelance',     label: 'Freelance',      icon: 'laptop-outline',      descripcion: 'Diseño, programación, contenido digital' },
  { id: 3, key: 'profesionales', label: 'Profesionales',  icon: 'briefcase-outline',   descripcion: 'Abogados, contadores, consultores' },
];

function Checkbox({ label, checked, onToggle }) {
  return (
    <TouchableOpacity style={checkboxStyles.row} onPress={onToggle} activeOpacity={0.75}>
      <View style={[checkboxStyles.box, checked && checkboxStyles.boxChecked]}>
        {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <Text style={checkboxStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RegistrarseCliente({ route, navigation }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(CATEGORIAS[0]);
  const [mayorEdad, setMayorEdad] = useState(false);
  const [terminos, setTerminos]   = useState(false);
  const [enviando, setEnviando]   = useState(false);

  const animacionMover = useRef(new Animated.Value(0)).current;

  const cambiarTab = (cat, index) => {
    setCategoriaSeleccionada(cat);
    Animated.spring(animacionMover, {
      toValue: index,
      useNativeDriver: false,
      bounciness: 0,
    }).start();
  };

  const listo = mayorEdad && terminos;

  const finalizarRegistro = async () => {
  if (!mayorEdad || !terminos) {
    alert('Debés aceptar los términos y confirmar tu edad');
    return;
  }

  setEnviando(true);
  try {
    const { email } = route?.params || {};
    const response = await fetch(`${API_URL}/cliente/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        categoriaId: categoriaSeleccionada.id,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Error al registrar');
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeCliente', params: { usuario: data.usuario } }],
    });
  } catch (e) {
    alert('No se pudo conectar al servidor');
    console.error(e);
  } finally {
    setEnviando(false);
  }
};

  const posicionIzquierda = animacionMover.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.3333%', '66.6666%'],
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>

      <LinearGradient colors={[BLUE_DARK, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="checkmark-done" size={22} color="#fff" />
        </View>
        <Text style={styles.tagline}>Solo un paso más</Text>
        <Text style={styles.subtitle}>Contanos qué tipo de servicios buscás</Text>
      </LinearGradient>

      <View style={styles.card}>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="pricetags" size={15} color={BLUE_DARK} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Preferencias</Text>
            <Text style={styles.sectionSubtitle}>Podés cambiarlo cuando quieras</Text>
          </View>
        </View>

        {/* Selector de categoría (tabs) */}
        <View style={styles.macroTabs}>
          <View style={styles.tabsRelativeWrapper}>
            <Animated.View style={[styles.burbujaActiva, { width: '33.3333%', left: posicionIzquierda }]} />
            {CATEGORIAS.map((cat, index) => (
              <TouchableOpacity
                key={cat.key}
                style={styles.tabButton}
                onPress={() => cambiarTab(cat, index)}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={categoriaSeleccionada.key === cat.key ? '#fff' : MUTED}
                  style={{ marginBottom: 3 }}
                />
                <Text style={[
                  styles.tabButtonText,
                  categoriaSeleccionada.key === cat.key && styles.tabButtonTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tarjeta con detalle de la categoría elegida */}
        <View style={styles.seleccionadaContainer}>
          <View style={styles.seleccionadaIconWrap}>
            <Ionicons name={categoriaSeleccionada.icon} size={20} color={BLUE_DARK} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.seleccionadaNombre}>{categoriaSeleccionada.label}</Text>
            <Text style={styles.seleccionadaTexto}>{categoriaSeleccionada.descripcion}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.checksWrap}>
          <Checkbox label="Confirmo que tengo 18 años o más" checked={mayorEdad} onToggle={() => setMayorEdad(!mayorEdad)} />
          <Checkbox label="Acepto los términos y condiciones" checked={terminos} onToggle={() => setTerminos(!terminos)} />
        </View>

        <TouchableOpacity activeOpacity={0.88} onPress={finalizarRegistro} disabled={enviando}>
          <LinearGradient
            colors={listo ? [BLUE, BLUE_DARK] : ['#C7D2E3', '#B9C6DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.boton, enviando && { opacity: 0.75 }]}
          >
            <Text style={styles.botonTexto}>{enviando ? 'Finalizando...' : 'Finalizar registro'}</Text>
            {!enviando && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </ScrollView>
  );
}

const checkboxStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  box: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 2, borderColor: '#C7D2E3',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
    backgroundColor: '#fff',
  },
  boxChecked: { backgroundColor: BLUE, borderColor: BLUE },
  text: { color: '#4A5568', fontSize: 13, flex: 1, lineHeight: 18 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5FA' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 60,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  tagline: { color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: '500' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -34,
    borderRadius: 26,
    padding: 24,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 10 },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: BLUE_SOFT,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { color: INK, fontSize: 14.5, fontWeight: '800' },
  sectionSubtitle: { color: MUTED, fontSize: 11.5, marginTop: 1 },

  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 20 },

  // Tabs
  macroTabs: {
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    height: 62,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.08)',
  },
  tabsRelativeWrapper: { flexDirection: 'row', width: '100%', height: '100%', position: 'relative' },
  burbujaActiva: {
    position: 'absolute', top: 4, bottom: 4,
    backgroundColor: BLUE, borderRadius: 13,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  tabButtonText: { fontSize: 10.5, fontWeight: '700', color: MUTED },
  tabButtonTextActive: { color: 'white' },

  // Categoría seleccionada
  seleccionadaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BLUE_SOFT,
    padding: 14,
    borderRadius: 16,
  },
  seleccionadaIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  seleccionadaNombre: { color: INK, fontWeight: '800', fontSize: 14.5, marginBottom: 2 },
  seleccionadaTexto: { color: '#5B6478', fontSize: 11.5, lineHeight: 15 },

  checksWrap: { marginBottom: 6 },

  // Botón
  boton: {
    height: 54, borderRadius: 16, marginTop: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  botonTexto: { color: 'white', fontWeight: '800', fontSize: 15.5 },
});