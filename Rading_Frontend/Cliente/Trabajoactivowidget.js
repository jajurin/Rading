import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import TrabajoActivoCliente from './TrabajoActivoCliente';
import OfertaRecibidaOverlayCliente from './OfertaRecibidaOverlayCliente';
import API_URL from '../configS';
import { useTheme } from '../ThemeContext';

// Cada cuánto se vuelve a preguntar por ofertas nuevas mientras el widget
// está en pantalla (el overlay puede estar cerrado todo este tiempo).
const INTERVALO_POLLING_MS = 25000;

/**
 * TrabajoActivoWidget
 * ────────────────────────────────────────────────────────────────
 * Agrupa la tarjeta de "trabajo activo" (TrabajoActivoCliente) junto con
 * el overlay de oferta recibida (OfertaRecibidaOverlayCliente), manejando
 * internamente la visibilidad del overlay y la navegación al chat.
 *
 * Consulta con polling cuántas ofertas pendientes tiene el cliente, para
 * mostrar el badge en la tarjeta aunque el overlay esté cerrado.
 *
 * El mapa de seguimiento ya NO se muestra acá: vive dentro del detalle de
 * cada trabajo en el overlay, así hay uno por trabajo en camino.
 *
 * Se posiciona de forma FIJA (absolute), por eso debe renderizarse FUERA
 * de cualquier ScrollView (por ejemplo, justo antes del BottomNavBar).
 *
 * Props:
 *  - idCliente: number | string
 *  - usuario: objeto del usuario logueado
 *  - navigation: objeto de navegación
 *  - style: estilo opcional para el contenedor de la tarjeta
 */
export default function TrabajoActivoWidget({ idCliente, usuario, navigation, style }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [showOferta, setShowOferta] = useState(false);
  const [totalOfertas, setTotalOfertas] = useState(0);
  const intervaloRef = useRef(null);

  const fetchTotalOfertas = useCallback(async () => {
    if (!idCliente) return;
    try {
      const res = await fetch(`${API_URL}/cliente/ofertas/pendientes/${idCliente}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      const total = lista.reduce((acc, o) => acc + Number(o.cantidadOfertas || 0), 0);
      setTotalOfertas(total);
    } catch (e) {
      console.error('Error al consultar ofertas pendientes (widget):', e);
      // Si falla, dejamos el badge como estaba para no esconder una alerta
      // real por un error de red pasajero.
    }
  }, [idCliente]);

  const refrescar = useCallback(() => {
    fetchTotalOfertas();
  }, [fetchTotalOfertas]);

  // Primer chequeo al montar + polling mientras el widget esté vivo.
  useEffect(() => {
    refrescar();

    intervaloRef.current = setInterval(refrescar, INTERVALO_POLLING_MS);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [refrescar]);

  const handleAbrirOverlay = useCallback(() => {
    setShowOferta(true);
    refrescar();
  }, [refrescar]);

  const handleCerrarOverlay = useCallback(() => {
    setShowOferta(false);
    refrescar();
  }, [refrescar]);

  return (
    <>
      <View style={[styles.floatingWrapper, style]}>
        <TrabajoActivoCliente onPress={handleAbrirOverlay} badgeCount={totalOfertas} />
      </View>

      <OfertaRecibidaOverlayCliente
        visible={showOferta}
        onClose={handleCerrarOverlay}
        idCliente={idCliente}
        usuario={usuario}
        onChat={(trabajo) => {
          handleCerrarOverlay();
          navigation.navigate('Chat', { trabajo });
        }}
        navigation={navigation}
      />
    </>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 150, // ajustá según la altura de tu BottomNavBar
    zIndex: 20,
    elevation: 20,
  },
});