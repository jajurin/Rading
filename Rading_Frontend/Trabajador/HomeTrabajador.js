import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../Header';
import BottomNavBarTrabajador from './Navegadortrabajador';
import TrabajoActivoTrabajador from './TrabajoActivoTrabajador';
import TrabajoActivoOverlayTrabajador from './TrabajoActivoOverlayTrabajador';
import Search from './Search';
import API_URL from '../configS';

// ── Paleta ─────────────────────────────────────────────────────────────────
// Misma identidad que el lado cliente: índigo de marca, navy para
// superficies oscuras, ámbar como único acento (rating / urgente).
const NAVY         = '#0F1B4C';
const NAVY_SOFT    = '#161F52';
const INDIGO       = '#2A3FD6';
const INDIGO_SOFT  = '#5C6DF2';
const AMBER        = '#F5A623';
const GREEN        = '#22C55E';
const RED          = '#EF4444';
const BG           = '#F4F6FC';
const CARD         = '#FFFFFF';
const TEXT_DARK    = '#12172E';
const TEXT_MUTED   = '#828AA0';
const BORDER       = 'rgba(15,27,76,0.07)';

// Altura "base" del BottomNavBar (ver NavegadorCliente.jsx):
// bar = 52 (tabsRow) + 6+6 (paddingVertical) = 64
// wrapper suma además Math.max(insets.bottom, 10) de paddingBottom.
// La calculamos acá también para poder anclar el widget justo arriba,
// sin superponerse, sea cual sea el dispositivo/inset.
const NAVBAR_BASE_HEIGHT = 30;
const WIDGET_GAP = 10; // separación entre el widget y el nav bar

const AVATAR_CLIENTE = (nombre = '', apellido = '') =>
  `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=2A3FD6&color=fff&size=150`;

// Franja horaria: mismo gesto que HomeCliente — el saludo y el degradé
// cambian según el momento del día.
const obtenerFranjaHoraria = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { saludo: 'Buenos días', icon: 'sunny', gradient: [INDIGO_SOFT, INDIGO] };
  if (h >= 12 && h < 19) return { saludo: 'Buenas tardes', icon: 'partly-sunny', gradient: [INDIGO, '#1E2E9E'] };
  return { saludo: 'Buenas noches', icon: 'moon', gradient: [NAVY, '#25306E'] };
};

const iniciales = (nombre = '') =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '👤';

// ── Sub-componentes ──────────────────────────────────────────────────────

const EstadoVacio = ({ icon, texto }) => (
  <View style={styles.emptyBox}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name={icon} size={20} color={INDIGO} />
    </View>
    <Text style={styles.emptyText}>{texto}</Text>
  </View>
);

const SolicitudCard = ({ item, onAceptar, onVer }) => (
  <TouchableOpacity style={styles.solicitudCard} activeOpacity={0.88} onPress={() => onVer?.(item)}>
    <Image source={{ uri: AVATAR_CLIENTE(item.nombre, item.apellido) }} style={styles.solicitudAvatar} />

    <View style={styles.solicitudBody}>
      <View style={styles.solicitudTopRow}>
        <Text style={styles.solicitudNombre} numberOfLines={1}>
          {item.nombre} {item.apellido}
        </Text>
        {item.emergencia && (
          <View style={styles.badgeUrgente}>
            <Ionicons name="flash" size={10} color="#fff" />
            <Text style={styles.badgeUrgenteText}>Urgente</Text>
          </View>
        )}
      </View>

      <Text style={styles.solicitudServicio} numberOfLines={1}>
        {item.especialidad ?? item.servicio_nombre ?? 'Servicio'}
      </Text>

      <View style={styles.solicitudMetaRow}>
        {item.distancia != null && (
          <View style={styles.metaChip}>
            <Ionicons name="location" size={10} color={INDIGO} />
            <Text style={styles.metaChipText}>{item.distancia} km</Text>
          </View>
        )}
        {item.horario_requerido && (
          <View style={styles.metaChip}>
            <Ionicons name="time" size={10} color={INDIGO} />
            <Text style={styles.metaChipText}>{item.horario_requerido}</Text>
          </View>
        )}
        {item.fijo && item.precio != null ? (
          <View style={styles.metaChipPrecio}>
            <Text style={styles.metaChipPrecioText}>${Number(item.precio).toLocaleString('es-AR')}</Text>
          </View>
        ) : (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>Subasta</Text>
          </View>
        )}
      </View>
    </View>

    <TouchableOpacity style={styles.aceptarBtn} activeOpacity={0.85} onPress={() => onAceptar?.(item)}>
      <Ionicons name="checkmark" size={20} color="#fff" />
    </TouchableOpacity>
  </TouchableOpacity>
);

// ── Pantalla principal ───────────────────────────────────────────────────

export default function HomeTrabajador({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const idTrabajador = usuario?.idTrabajador;

  const franja = useMemo(() => obtenerFranjaHoraria(), []);
  const insets = useSafeAreaInsets();

  // Altura real del nav bar (base + su propio padding inferior de safe area),
  // usada para anclar el widget de trabajo activo justo por encima.
  const navBarHeight = NAVBAR_BASE_HEIGHT + Math.max(insets.bottom, 10);
  const widgetBottomOffset = navBarHeight + WIDGET_GAP;

  const [disponible, setDisponible] = useState(true);
  const [cambiandoDisponibilidad, setCambiandoDisponibilidad] = useState(false);

  const [resumen, setResumen] = useState({ ganancias_hoy: 0, trabajos_completados: 0, rating: 0 });
  const [cargandoResumen, setCargandoResumen] = useState(true);

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);

  const [showTrabajoActivo, setShowTrabajoActivo] = useState(false);

  const cargarResumen = useCallback(async () => {
    if (!idTrabajador) { setCargandoResumen(false); return; }
    try {
      setCargandoResumen(true);
      const resp = await fetch(`${API_URL}/trabajador/resumen/${idTrabajador}`);
      if (!resp.ok) throw new Error('Respuesta no OK al pedir resumen');
      const data = await resp.json();
      setResumen({
        ganancias_hoy: data.ganancias_hoy ?? 0,
        trabajos_completados: data.trabajos_completados ?? 0,
        rating: data.rating ?? 0,
      });
      if (typeof data.disponible === 'boolean') setDisponible(data.disponible);
    } catch (err) {
      console.error('Error al cargar resumen del trabajador:', err);
    } finally {
      setCargandoResumen(false);
    }
  }, [idTrabajador]);

  const cargarSolicitudes = useCallback(async () => {
    if (!idTrabajador) { setCargandoSolicitudes(false); return; }
    try {
      setCargandoSolicitudes(true);
      const resp = await fetch(`${API_URL}/trabajador/solicitudesNuevas/${idTrabajador}`);
      if (!resp.ok) throw new Error('Respuesta no OK al pedir solicitudes');
      const data = await resp.json();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar solicitudes nuevas:', err);
      setSolicitudes([]);
    } finally {
      setCargandoSolicitudes(false);
    }
  }, [idTrabajador]);

  useEffect(() => {
    cargarResumen();
    cargarSolicitudes();
  }, [cargarResumen, cargarSolicitudes]);

  const toggleDisponibilidad = async (valor) => {
    setDisponible(valor);
    setCambiandoDisponibilidad(true);
    try {
      await fetch(`${API_URL}/trabajador/disponibilidad/${idTrabajador}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: valor }),
      });
    } catch (err) {
      console.error('Error al actualizar disponibilidad:', err);
      setDisponible(!valor); // revertimos si falló
    } finally {
      setCambiandoDisponibilidad(false);
    }
  };

  const irABuscador = (texto = '') => {
    navigation?.navigate('BuscadorTrabajador', { usuario, textoInicial: texto });
  };

  const aceptarSolicitud = (item) => {
    // TODO: conectar con el endpoint real de aceptación de trabajo.
    console.log('Aceptar solicitud:', item.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          // Si hay widget de trabajo activo, dejamos aire extra abajo para
          // que el último contenido no quede tapado por widget + nav bar.
          idTrabajador != null && { paddingBottom: widgetBottomOffset + 90 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Saludo + avatar + disponibilidad ──────────────────────── */}
        <View style={styles.saludoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saludoEyebrow}>{franja.saludo.toUpperCase()}</Text>
            <Text style={styles.saludoTexto} numberOfLines={1}>
              {usuario?.nombre ?? 'Bienvenido'}
            </Text>
          </View>

          <View style={styles.avatarChip}>
            {usuario?.foto ? (
              <Image source={{ uri: usuario.foto }} style={styles.avatarChipImg} />
            ) : (
              <Text style={styles.avatarChipText}>{iniciales(usuario?.nombre)}</Text>
            )}
          </View>
        </View>

        <View style={styles.dispoRow}>
          <View style={styles.dispoLeft}>
            <View style={[styles.dispoDot, { backgroundColor: disponible ? GREEN : RED }]} />
            <Text style={styles.dispoText}>
              {disponible ? 'Estás disponible para recibir trabajos' : 'No estás recibiendo trabajos'}
            </Text>
          </View>
          {cambiandoDisponibilidad ? (
            <ActivityIndicator size="small" color={INDIGO} />
          ) : (
            <Switch
              value={disponible}
              onValueChange={toggleDisponibilidad}
              trackColor={{ false: '#DADFEE', true: INDIGO_SOFT }}
              thumbColor={disponible ? INDIGO : '#fff'}
            />
          )}
        </View>

        {/* ── Resumen del día (reemplaza al banner promocional) ───────── */}
        <LinearGradient
          colors={franja.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerGlowTop} />
          <View style={styles.bannerGlowBottom} />

          <View style={styles.bannerTag}>
            <Ionicons name="stats-chart" size={12} color="#fff" />
            <Text style={styles.bannerTagText}>TU DÍA</Text>
          </View>

          {cargandoResumen ? (
            <ActivityIndicator style={{ marginTop: 24 }} color="#fff" />
          ) : (
            <View style={styles.resumenGrid}>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenValor}>
                  ${Number(resumen.ganancias_hoy).toLocaleString('es-AR')}
                </Text>
                <Text style={styles.resumenLabel}>Ganado hoy</Text>
              </View>
              <View style={styles.resumenDivider} />
              <View style={styles.resumenItem}>
                <Text style={styles.resumenValor}>{resumen.trabajos_completados}</Text>
                <Text style={styles.resumenLabel}>Completados</Text>
              </View>
              <View style={styles.resumenDivider} />
              <View style={styles.resumenItem}>
                <View style={styles.resumenRatingRow}>
                  <Ionicons name="star" size={15} color={AMBER} />
                  <Text style={styles.resumenValor}>{Number(resumen.rating).toFixed(1)}</Text>
                </View>
                <Text style={styles.resumenLabel}>Tu rating</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.bannerButton}
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('VerTrabajosRealizados', { idTrabajador })}
          >
            <Text style={styles.bannerButtonText}>Ver historial completo</Text>
            <Ionicons name="arrow-forward" size={15} color={INDIGO} />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Búsqueda rápida ───────────────────────────────────────── */}
        <View style={styles.searchWrap}>
          <Search onSearch={irABuscador} />
        </View>

        {/* ── Solicitudes nuevas ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Solicitudes nuevas</Text>
            {solicitudes.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{solicitudes.length}</Text>
              </View>
            )}
          </View>
          {solicitudes.length > 0 && (
            <TouchableOpacity onPress={() => irABuscador('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.verMas}>Ver todas</Text>
            </TouchableOpacity>
          )}
        </View>

        {cargandoSolicitudes ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={INDIGO} />
          </View>
        ) : solicitudes.length === 0 ? (
          <EstadoVacio icon="mail-open-outline" texto="No tenés solicitudes nuevas por ahora" />
        ) : (
          <View style={styles.solicitudesList}>
            {solicitudes.slice(0, 3).map((item) => (
              <SolicitudCard
                key={item.id}
                item={item}
                onAceptar={aceptarSolicitud}
                onVer={() => irABuscador('')}
              />
            ))}
          </View>
        )}

        {/* ── Accesos rápidos ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        </View>

        <View style={styles.accesosGrid}>
          <TouchableOpacity
            style={styles.accesoCard}
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('VerTrabajosRealizados', { idTrabajador })}
          >
            <View style={styles.accesoIconWrap}>
              <Ionicons name="time-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.accesoText}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accesoCard} activeOpacity={0.85}>
            <View style={styles.accesoIconWrap}>
              <Ionicons name="wallet-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.accesoText}>Ganancias</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accesoCard} activeOpacity={0.85}>
            <View style={styles.accesoIconWrap}>
              <Ionicons name="person-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.accesoText}>Mi perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accesoCard} activeOpacity={0.85}>
            <View style={styles.accesoIconWrap}>
              <Ionicons name="megaphone-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.accesoText}>Patrocinios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/*
        FIX: el widget de "trabajo en curso" antes vivía en el flujo normal,
        justo antes del BottomNavBar. Como BottomNavBar usa position:absolute
        (ver NavegadorCliente.jsx), se pintaba por encima y tapaba el widget.
        Ahora el widget también es absolute y se ancla dinámicamente por
        encima del nav bar usando los mismos insets de safe area, así nunca
        se superponen sea cual sea el dispositivo.
      */}
      {idTrabajador != null && (
        <View
          style={[styles.trabajoActivoWrap, { bottom: widgetBottomOffset }]}
          pointerEvents="box-none"
        >
          <TrabajoActivoTrabajador
            onPress={() => setShowTrabajoActivo(true)}
            expanded={showTrabajoActivo}
          />
        </View>
      )}

      {showTrabajoActivo && (
        <TrabajoActivoOverlayTrabajador
          visible={showTrabajoActivo}
          onClose={() => setShowTrabajoActivo(false)}
          onChat={(trabajo) => console.log('chat con cliente:', trabajo)}
          idTrabajador={idTrabajador}
          navigation={navigation}
        />
      )}

<BottomNavBarTrabajador usuario={usuario} pantallaActiva="inicio" />    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 190 },

  // Contenedor flotante del widget "trabajo en curso". Se posiciona con
  // 'bottom' dinámico (widgetBottomOffset) desde el componente, calculado
  // para quedar siempre arriba del BottomNavBar.
  trabajoActivoWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 5,
  },

  loaderBox: { paddingVertical: 26, alignItems: 'center' },

  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 14, marginHorizontal: 16, backgroundColor: CARD, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: BORDER,
  },
  emptyIconWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(42,63,214,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { flex: 1, color: TEXT_MUTED, fontSize: 13, lineHeight: 18 },

  saludoRow: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  saludoEyebrow: { fontSize: 10.5, fontWeight: '800', color: INDIGO, letterSpacing: 1, marginBottom: 3 },
  saludoTexto: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  avatarChip: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  avatarChipImg: { width: '100%', height: '100%' },
  avatarChipText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  dispoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 14, backgroundColor: CARD, borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  dispoLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, marginRight: 10 },
  dispoDot: { width: 9, height: 9, borderRadius: 4.5 },
  dispoText: { color: TEXT_DARK, fontSize: 12.5, fontWeight: '600', flexShrink: 1 },

  banner: {
    margin: 16, marginTop: 14, borderRadius: 26, padding: 22, overflow: 'hidden',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  bannerGlowTop: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', opacity: 0.12 },
  bannerGlowBottom: { position: 'absolute', bottom: -55, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: '#fff', opacity: 0.08 },
  bannerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  resumenGrid: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenValor: { color: '#fff', fontSize: 18, fontWeight: '800' },
  resumenLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  resumenRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resumenDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },

  bannerButton: {
    marginTop: 18, backgroundColor: '#fff', alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bannerButtonText: { color: INDIGO, fontWeight: '800', fontSize: 13 },

  searchWrap: { marginTop: 2, marginBottom: 4 },

  sectionHeader: {
    marginTop: 26, marginHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: TEXT_DARK, fontWeight: '800', fontSize: 17 },
  countBadge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: 'rgba(42,63,214,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  countBadgeText: { color: INDIGO, fontSize: 11, fontWeight: '800' },
  verMas: { color: INDIGO, fontWeight: '700', fontSize: 13 },

  solicitudesList: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  solicitudCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 18,
    padding: 12, gap: 12, borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  solicitudAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(42,63,214,0.15)' },
  solicitudBody: { flex: 1, gap: 4 },
  solicitudTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  solicitudNombre: { color: TEXT_DARK, fontWeight: '800', fontSize: 14.5, flexShrink: 1 },
  solicitudServicio: { color: INDIGO, fontSize: 12, fontWeight: '700' },
  badgeUrgente: {
    flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: RED,
    borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeUrgenteText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
  solicitudMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(42,63,214,0.08)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3,
  },
  metaChipText: { color: INDIGO, fontSize: 10.5, fontWeight: '700' },
  metaChipPrecio: { backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  metaChipPrecioText: { color: '#95650B', fontSize: 10.5, fontWeight: '800' },
  aceptarBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
  },

  accesosGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, paddingTop: 14,
  },
  accesoCard: {
    width: '47%', backgroundColor: CARD, borderRadius: 18, alignItems: 'center',
    paddingVertical: 16, gap: 8, borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  accesoIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: INDIGO,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: INDIGO, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
  },
  accesoText: { color: TEXT_DARK, fontSize: 12.5, fontWeight: '700' },
});