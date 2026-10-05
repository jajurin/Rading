import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import TrabajoActivoCliente from './TrabajoActivoCliente';
import OfertaRecibidaOverlayCliente from './OfertaRecibidaOverlayCliente';
import SeguimientoMini from '../SeguimientoMini';
import API_URL from '../configS';
import { useTheme } from '../ThemeContext';

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
 * Además, consulta por su cuenta (con polling) cuántas ofertas
 * pendientes tiene el cliente, para poder mostrar la alertita (badge)
 * en la tarjeta AUNQUE el overlay esté cerrado.
 *
 * Si el cliente tiene un trabajo aceptado cuyo trabajador todavía
 * va en camino (no confirmó llegada), muestra arriba de la tarjeta un mini
 * mapa con la posición del trabajador, la ruta y el ETA. Al tocarlo se abre
 * la pantalla completa (SeguimientoTrabajo). Desaparece solo cuando se
 * confirma la llegada.
 *
 * Se posiciona de forma FIJA (absolute) sobre la pantalla, así que
 * no se mueve ni desaparece al hacer scroll. Por eso debe renderizarse
 * FUERA de cualquier ScrollView, como hermano directo (por ejemplo,
 * justo antes del BottomNavBar en HomeCliente).
 *
 * Props:
 *  - idCliente: number | string   → id del cliente logueado
 *  - navigation: objeto de navegación (para ir al Chat y al seguimiento)
 *  - style: estilo opcional adicional para el contenedor de la tarjeta
 */
export default function TrabajoActivoWidget({ idCliente, usuario, navigation, style }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [showOferta, setShowOferta] = useState(false);
  const [totalOfertas, setTotalOfertas] = useState(0);
  const [trabajoSeguir, setTrabajoSeguir] = useState(null);
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

  // Trabajo aceptado con el trabajador en camino (EN PROCESO, sin llegada
  // confirmada) y con destino cargado. Acepta latitud/longitud o lat/lng.
  // Si hay varios, se sigue el primero.
  const fetchTrabajoSeguir = useCallback(async () => {
    if (!idCliente) return;
    try {
      const res = await fetch(`${API_URL}/cliente/trabajosActivos/${idCliente}`);
      if (!res.ok) return;
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      const t = lista.find(
        (x) =>
          !x.trabajo_iniciado_en &&
          (x.latitud ?? x.lat) != null &&
          (x.longitud ?? x.lng) != null
      );
      // Si es el mismo trabajo, se conserva el objeto para no reiniciar el mapa
      setTrabajoSeguir((prev) => (t && prev?.id === t.id ? prev : t ?? null));
    } catch (e) {
      console.error('Error al consultar trabajo en camino (widget):', e);
    }
  }, [idCliente]);

  const refrescar = useCallback(() => {
    fetchTotalOfertas();
    fetchTrabajoSeguir();
  }, [fetchTotalOfertas, fetchTrabajoSeguir]);

  // Primer chequeo al montar + polling mientras el widget esté vivo.
  useEffect(() => {
    refrescar();

    intervaloRef.current = setInterval(refrescar, INTERVALO_POLLING_MS);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [refrescar]);

  // Al abrir la tarjeta (que dispara el overlay), volvemos a chequear ya
  // mismo por si el badge estaba desactualizado.
  const handleAbrirOverlay = useCallback(() => {
    setShowOferta(true);
    refrescar();
  }, [refrescar]);

  // Al cerrar el overlay, el cliente pudo haber visto/aceptado ofertas:
  // refrescamos para que el badge y el mini mapa queden al día.
  const handleCerrarOverlay = useCallback(() => {
    setShowOferta(false);
    refrescar();
  }, [refrescar]);

  return (
    <>
      <View style={[styles.floatingWrapper, style]}>
        {trabajoSeguir && !showOferta && (
          <SeguimientoMini
            trabajo={trabajoSeguir}
            rol="cliente"
            idUsuarioRol={idCliente}
            navigation={navigation}
            activo={!showOferta}
          />
        )}
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
    bottom: 150, // ajustá este valor según la altura de tu BottomNavBar
    zIndex: 20,
    elevation: 20, // necesario en Android para que quede por encima del resto
  },
});