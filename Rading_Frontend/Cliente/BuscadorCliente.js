import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';

import { useTheme } from '../ThemeContext';
import BuscadorTrabajadorWidget from './Buscadortrabajadorwidget';
import BottomNavBar from './NavegadorCliente';

// ─── Main Screen ──────────────────────────────────────────────────────────────
// Esta pantalla ahora es EXCLUSIVAMENTE un contenedor.
// Toda la lógica de búsqueda + filtros + listado de resultados vive en
// BuscadorTrabajadorWidget.js (search box + botón de filtro + tarjetas).
// El bloque de "trabajo activo / oferta recibida" se movió a
// TrabajoActivoWidget.js y ya no se renderiza acá.

export default function BuscadorTrabajador({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { usuario } = route.params;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar Trabajadores</Text>
        <Text style={styles.headerSub}>Encontrá el profesional que necesitás</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BuscadorTrabajadorWidget usuario={usuario} navigation={navigation} />
      </ScrollView>

      <BottomNavBar usuario={usuario} pantallaActiva="busqueda" />

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const WHITE = '#ffffff';
const BLUE  = '#1565D8';

const createStyles = (colors, isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDark ? colors.background : '#F4F6FB' },

  header: { backgroundColor: BLUE, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: WHITE, fontSize: 24, fontWeight: '800', marginBottom: 2 },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  scrollContent: { paddingTop: 12, paddingBottom: 140 },
});
