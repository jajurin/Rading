import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import TrabajoActivoCliente from './TrabajoActivoCliente';
import OfertaRecibidaOverlayCliente from './OfertaRecibidaOverlayCliente';
import API_URL from '../configS';

// Cada cuánto se vuelve a preguntar por ofertas nuevas mientras el widget
// está en pantalla (el overlay puede estar cerrado todo este tiempo).
const INTERVALO_POLLING_MS = 25000;

/**
 * TrabajoActivoWidget
 * ────────────────────────────────────────────────────────────────
 * Componente reutilizable que agrupa la tarjeta de "trabajo activo"
 * (TrabajoActivoCliente) junto con el overlay de oferta recibida
 * (OfertaRecibidaOverlayCliente), manejando internamente el estado
 * de visibilidad del overlay y la navegación al chat.
 *
 * 👇 Además, consulta por su cuenta (con polling) cuántas ofertas
 * pendientes tiene el cliente, para poder mostrar la alertita (badge)
 * en la tarjeta AUNQUE el overlay esté cerrado. Antes, el cliente solo
 * se enteraba de que había ofertas nuevas si abría el overlay a mano.
 *
 * Se posiciona de forma FIJA (absolute) sobre la pantalla, así que
 * no se mueve ni desaparece al hacer scroll. Por eso debe renderizarse
 * FUERA de cualquier ScrollView, como hermano directo (por ejemplo,
 * justo antes del BottomNavBar en HomeCliente).
 *
 * Props:
 *  - idCliente: number | string   → id del cliente logueado
 *  - navigation: objeto de navegación (para ir al Chat)
 *  - style: estilo opcional adicional para el contenedor de la tarjeta
 */
export default function TrabajoActivoWidget({ idCliente, usuario, navigation, style }) {
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
      // Si falla, no rompemos el badge: lo dejamos como estaba en vez de
      // resetearlo a 0, para no "esconder" una alerta real por un error
      // de red pasajero.
    }
  }, [idCliente]);

  // Primer chequeo al montar + polling mientras el widget esté vivo.
  useEffect(() => {
    fetchTotalOfertas();

    intervaloRef.current = setInterval(fetchTotalOfertas, INTERVALO_POLLING_MS);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [fetchTotalOfertas]);

  // Al abrir la tarjeta (que dispara el overlay), volvemos a chequear ya
  // mismo por si el badge estaba desactualizado.
  const handleAbrirOverlay = useCallback(() => {
    setShowOferta(true);
    fetchTotalOfertas();
  }, [fetchTotalOfertas]);

  // Al cerrar el overlay, el cliente pudo haber visto/aceptado ofertas:
  // refrescamos el conteo para que el badge quede al día.
  const handleCerrarOverlay = useCallback(() => {
    setShowOferta(false);
    fetchTotalOfertas();
  }, [fetchTotalOfertas]);

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

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 150, // ajustá este valor según la altura de tu BottomNavBar
    zIndex: 20,
    elevation: 20, // necesario en Android para que quede por encima del resto
  },
});