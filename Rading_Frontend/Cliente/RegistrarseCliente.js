import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Platform, Animated,
} from 'react-native';
import API_URL from '../configS';

const CATEGORIAS = [
  { id: 1, key: 'domesticos', label: 'Domésticos' },
  { id: 2, key: 'freelance',  label: 'Freelance'  },
  { id: 3, key: 'profesionales', label: 'Profesionales' },
];

function Checkbox({ label, checked, onToggle }) {
  return (
    <TouchableOpacity style={checkboxStyles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[checkboxStyles.box, checked && checkboxStyles.boxChecked]}>
        {checked && <Text style={checkboxStyles.checkmark}>✓</Text>}
      </View>
      <Text style={checkboxStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RegistrarseCliente({ route, navigation }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(CATEGORIAS[0]);
  const [mayorEdad, setMayorEdad] = useState(false);
  const [terminos, setTerminos]   = useState(false);

  const animacionMover = useRef(new Animated.Value(0)).current;

  const cambiarTab = (cat, index) => {
    setCategoriaSeleccionada(cat);
    Animated.spring(animacionMover, {
      toValue: index,
      useNativeDriver: false,
      bounciness: 0,
    }).start();
  };

  const finalizarRegistro = async () => {
    if (!mayorEdad || !terminos) {
      alert('Debés aceptar los términos y confirmar tu edad');
      return;
    }

    try {
      const email = route?.params?.email;
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

      alert('¡Registro de Cliente Completo!');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      alert('No se pudo conectar al servidor');
      console.error(e);
    }
  };

  const posicionIzquierda = animacionMover.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.3333%', '66.6666%'],
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.tagline}>Solo un paso más...</Text>
        <Text style={styles.subtitle}>Seleccioná tu categoría de interés</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Preferencias</Text>
        </View>

        {/* Selector de categoría */}
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

        <View style={styles.seleccionadaContainer}>
          <Text style={styles.seleccionadaTexto}>
            Categoría seleccionada: <Text style={styles.seleccionadaNombre}>{categoriaSeleccionada.label}</Text>
          </Text>
        </View>

        <View style={styles.divider} />
        <Checkbox label="Confirmo que tengo 18+ años" checked={mayorEdad} onToggle={() => setMayorEdad(!mayorEdad)} />
        <Checkbox label="Acepto términos y condiciones" checked={terminos} onToggle={() => setTerminos(!terminos)} />

        <TouchableOpacity style={styles.boton} activeOpacity={0.85} onPress={finalizarRegistro}>
          <Text style={styles.botonTexto}>Finalizar Registro</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </ScrollView>
  );
}

const checkboxStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#1565D8', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  boxChecked: { backgroundColor: '#1565D8' },
  checkmark: { color: 'white', fontSize: 11, fontWeight: '700' },
  text: { color: '#4A5568', fontSize: 13, flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  header: { backgroundColor: '#1565D8', paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 35, paddingHorizontal: 28 },
  tagline: { color: 'white', fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  card: { backgroundColor: '#b4b7bc63', marginHorizontal: 16, marginTop: 20, marginBottom: 40, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1565D8', marginRight: 8 },
  sectionTitle: { color: '#1565D8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 18 },
  macroTabs: { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12, height: 40, marginBottom: 14, overflow: 'hidden' },
  tabsRelativeWrapper: { flexDirection: 'row', width: '100%', height: '100%', position: 'relative' },
  burbujaActiva: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#1565D8', borderRadius: 12 },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  tabButtonText: { fontSize: 11, fontWeight: '700', color: '#4A5568' },
  tabButtonTextActive: { color: 'white' },
  seleccionadaContainer: { backgroundColor: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 14, marginBottom: 8 },
  seleccionadaTexto: { color: '#4A5568', fontSize: 13 },
  seleccionadaNombre: { color: '#1565D8', fontWeight: '700' },
  boton: { backgroundColor: '#1565D8', height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  botonTexto: { color: 'white', fontWeight: '700', fontSize: 16 },
});