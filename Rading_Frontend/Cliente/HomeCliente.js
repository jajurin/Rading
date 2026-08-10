import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../Header';
import BottomNavBar from './NavegadorCliente';
import TrabajoActivoWidget from './Trabajoactivowidget';
import BuscadorTrabajadorWidget from './Buscadortrabajadorwidget';
import API_BASE_URL from '../configS';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Paleta ────────────────────────────────────────────────────────────────
// Un azul índigo más rico que el celeste plano original, con un acento ámbar
// reservado para valoraciones y momentos de foco (CTA, insignias).
const NAVY        = '#0F1B4C';
const INDIGO      = '#2A3FD6';
const INDIGO_SOFT = '#5C6DF2';
const AMBER       = '#F5A623';
const BG          = '#F4F6FC';
const CARD        = '#FFFFFF';
const TEXT_DARK   = '#12172E';
const TEXT_MUTED  = '#828AA0';
const BORDER      = 'rgba(15,27,76,0.07)';

const CARD_WIDTH = 96;
const CARD_GAP = 12;
const SCROLL_STEP = (CARD_WIDTH + CARD_GAP) * 2;

// ── Utilidades ───────────────────────────────────────────────────────────
const normalizar = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const ICONOS_SERVICIO = [
  { keywords: ['plomer', 'gasista', 'destap', 'cano', 'sanitari'], icon: 'water' },
  { keywords: ['electric', 'electrici'], icon: 'flash' },
  { keywords: ['limpi'], icon: 'sparkles' },
  { keywords: ['pintu', 'pintor'], icon: 'color-palette' },
  { keywords: ['jardin', 'paisaj', 'cesped'], icon: 'leaf' },
  { keywords: ['carpint', 'muebl'], icon: 'hammer' },
  { keywords: ['cerraj', 'llave'], icon: 'key' },
  { keywords: ['mudanza', 'flete', 'transport'], icon: 'car' },
  { keywords: ['aire acondicionado', 'climat', 'refrigera'], icon: 'snow' },
  { keywords: ['albañil', 'albanil', 'construc', 'reform'], icon: 'construct' },
  { keywords: ['niñer', 'ninera', 'cuidado infantil'], icon: 'happy' },
  { keywords: ['mascota', 'perro', 'gato', 'veterin'], icon: 'paw' },
  { keywords: ['tecnico', 'reparacion', 'computa', 'celular'], icon: 'build' },
  { keywords: ['seguridad', 'alarma', 'camara'], icon: 'shield-checkmark' },
  { keywords: ['pileta', 'piscina'], icon: 'water-outline' },
  { keywords: ['vidri', 'ventana'], icon: 'square' },
];

const obtenerIconoServicio = (nombre) => {
  const n = normalizar(nombre);
  const match = ICONOS_SERVICIO.find((entry) =>
    entry.keywords.some((k) => n.includes(k))
  );
  return match ? match.icon : 'construct';
};

// Franja horaria: cambia el saludo, el ícono y el degradé del banner según
// el momento del día. Es el único gesto "grande" de la pantalla — el resto
// se mantiene sobrio a propósito.
const obtenerFranjaHoraria = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) {
    return {
      saludo: 'Buenos días',
      icon: 'sunny',
      gradient: [INDIGO_SOFT, INDIGO],
    };
  }
  if (h >= 12 && h < 19) {
    return {
      saludo: 'Buenas tardes',
      icon: 'partly-sunny',
      gradient: [INDIGO, '#1E2E9E'],
    };
  }
  return {
    saludo: 'Buenas noches',
    icon: 'moon',
    gradient: [NAVY, '#25306E'],
  };
};

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '👤';

export default function HomeCliente({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const buscadorRef = useRef(null);
  const serviciosScrollRef = useRef(null);

  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);

  const [recientes, setRecientes] = useState([]);
  const [cargandoRecientes, setCargandoRecientes] = useState(true);

  const [serviciosScrollX, setServiciosScrollX] = useState(0);
  const [serviciosContentWidth, setServiciosContentWidth] = useState(0);
  const [serviciosContainerWidth, setServiciosContainerWidth] = useState(0);
const [tieneChatsSinLeer, setTieneChatsSinLeer] = useState(false);

const chequearChatsSinLeer = useCallback(async () => {
  if (!usuario?.idCliente || !usuario?.id) return;
  try {
    const resp = await fetch(
      `${API_BASE_URL}/chat/cliente/${usuario.idCliente}?idUsuario=${usuario.id}`
    );
    if (!resp.ok) throw new Error('Respuesta no OK al chequear chats sin leer');
    const chats = await resp.json();
    setTieneChatsSinLeer(chats.some((c) => Number(c.no_leidos) > 0));
  } catch (err) {
    console.error('Error al chequear chats sin leer:', err);
  }
}, [usuario?.idCliente, usuario?.id]);
  const franja = useMemo(() => obtenerFranjaHoraria(), []);

  const cargarServicios = useCallback(async () => {
    if (!usuario?.idCliente) {
      setCargandoServicios(false);
      return;
    }
    try {
      setCargandoServicios(true);
      const resp = await fetch(`${API_BASE_URL}/cliente/servicios-preferidos/${usuario.idCliente}`);
      if (!resp.ok) throw new Error('Respuesta no OK al pedir servicios preferidos');
      const data = await resp.json();
      setServicios(data);
    } catch (err) {
      console.error('Error al cargar servicios preferidos:', err);
      setServicios([]);
    } finally {
      setCargandoServicios(false);
    }
  }, [usuario?.idCliente]);

  const cargarRecientes = useCallback(async () => {
    if (!usuario?.idCliente) {
      setCargandoRecientes(false);
      return;
    }
    try {
      setCargandoRecientes(true);
      const resp = await fetch(`${API_BASE_URL}/cliente/recientes/${usuario.idCliente}`);
      if (!resp.ok) throw new Error('Respuesta no OK al pedir recientes');
      const data = await resp.json();
      setRecientes(data);
    } catch (err) {
      console.error('Error al cargar recientes:', err);
      setRecientes([]);
    } finally {
      setCargandoRecientes(false);
    }
  }, [usuario?.idCliente]);

  useEffect(() => {
  cargarServicios();
  cargarRecientes();
  chequearChatsSinLeer();
}, [cargarServicios, cargarRecientes, chequearChatsSinLeer]);

  const buscarServicio = (nombreServicio) => {
    buscadorRef.current?.buscarPorEspecialidad(nombreServicio);
  };

  const scrollServicios = (direccion) => {
    const nuevoX = direccion === 'right'
      ? serviciosScrollX + SCROLL_STEP
      : serviciosScrollX - SCROLL_STEP;
    serviciosScrollRef.current?.scrollTo({ x: Math.max(0, nuevoX), animated: true });
  };

  const hayOverflowServicios = serviciosContentWidth > serviciosContainerWidth;
  const puedeIrIzquierda = hayOverflowServicios && serviciosScrollX > 4;
  const puedeIrDerecha = hayOverflowServicios &&
    serviciosScrollX < (serviciosContentWidth - serviciosContainerWidth - 4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <Header usuario={usuario} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Saludo + avatar ─────────────────────────────────────────── */}
        <View style={styles.saludoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saludoEyebrow}>{franja.saludo.toUpperCase()}</Text>
            <Text style={styles.saludoTexto} numberOfLines={1}>
              {usuario?.nombre ?? 'Bienvenido'}
            </Text>
            <Text style={styles.saludoSub}>¿Qué necesitás resolver hoy?</Text>
          </View>

          <View style={styles.avatarChip}>
            {usuario?.foto ? (
              <Image source={{ uri: usuario.foto }} style={styles.avatarChipImg} />
            ) : (
              <Text style={styles.avatarChipText}>{iniciales(usuario?.nombre)}</Text>
            )}
          </View>
        </View>

        {/* ── Banner hero con degradé según franja horaria ────────────── */}
        <LinearGradient
          colors={franja.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerGlowTop} />
          <View style={styles.bannerGlowBottom} />

          <View style={styles.bannerTopRow}>
            <View style={styles.bannerTag}>
              <Ionicons name={franja.icon} size={12} color="#fff" />
              <Text style={styles.bannerTagText}>NOVEDADES</Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>
            Nuevas funciones y{'\n'}ofertas para vos
          </Text>
          <Text style={styles.bannerText}>
            Descubrí todo lo nuevo que preparamos
          </Text>
          <TouchableOpacity style={styles.bannerButton} activeOpacity={0.85}>
            <Text style={styles.bannerButtonText}>Ver novedades</Text>
            <Ionicons name="arrow-forward" size={15} color={INDIGO} />
          </TouchableOpacity>
        </LinearGradient>

        <BuscadorTrabajadorWidget
          ref={buscadorRef}
          usuario={usuario}
          navigation={navigation}
        />

        {/* ── SERVICIOS de la categoría preferida ─────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Servicios para vos</Text>
            {servicios.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{servicios.length}</Text>
              </View>
            )}
          </View>
        </View>

        {cargandoServicios ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={INDIGO} />
          </View>
        ) : servicios.length === 0 ? (
          <EstadoVacio
            icon="albums-outline"
            texto="No hay servicios disponibles para tu categoría"
          />
        ) : (
          <View
            style={styles.carruselWrapper}
            onLayout={(e) => setServiciosContainerWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              ref={serviciosScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalContainer}
              scrollEventThrottle={16}
              onScroll={(e) => setServiciosScrollX(e.nativeEvent.contentOffset.x)}
              onContentSizeChange={(w) => setServiciosContentWidth(w)}
            >
              {servicios.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() => buscarServicio(s.nombre)}
                >
                  <View style={styles.categoryIconWrap}>
                    <Ionicons name={obtenerIconoServicio(s.nombre)} size={22} color="#fff" />
                  </View>
                  <Text style={styles.categoryText} numberOfLines={2}>
                    {s.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {puedeIrIzquierda && (
              <TouchableOpacity
                style={[styles.carruselArrow, styles.carruselArrowLeft]}
                onPress={() => scrollServicios('left')}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={18} color={NAVY} />
              </TouchableOpacity>
            )}

            {puedeIrDerecha && (
              <TouchableOpacity
                style={[styles.carruselArrow, styles.carruselArrowRight]}
                onPress={() => scrollServicios('right')}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={18} color={NAVY} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── RECIENTES ────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Recientes</Text>
            {recientes.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{recientes.length}</Text>
              </View>
            )}
          </View>
          {recientes.length > 0 && (
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.verMas}>Ver más</Text>
            </TouchableOpacity>
          )}
        </View>

        {cargandoRecientes ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={INDIGO} />
          </View>
        ) : recientes.length === 0 ? (
          <EstadoVacio
            icon="people-outline"
            texto="Todavía no contactaste a ningún trabajador"
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContainer}
          >
            {recientes.map((item) => (
              <TouchableOpacity
                key={item.idTrabajador}
                style={styles.recentCard}
                activeOpacity={0.85}
              >
                {item.foto ? (
                  <Image source={{ uri: item.foto }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {iniciales(item.nombre)}
                    </Text>
                  </View>
                )}
                <Text style={styles.recentName} numberOfLines={1}>
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {usuario?.idCliente != null && (
        <TrabajoActivoWidget
          idCliente={usuario.idCliente}
          usuario={usuario}
          navigation={navigation}
        />
      )}

      <BottomNavBar usuario={usuario} tieneChatsSinLeer={tieneChatsSinLeer} />
    </SafeAreaView>
  );
}

// Estado vacío reutilizable: siempre con ícono + mensaje accionable en vez
// de un simple texto gris perdido en la pantalla.
const EstadoVacio = ({ icon, texto }) => (
  <View style={styles.emptyBox}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name={icon} size={20} color={INDIGO} />
    </View>
    <Text style={styles.emptyText}>{texto}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 180 },

  loaderBox: { paddingVertical: 26, alignItems: 'center' },

  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(42,63,214,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { flex: 1, color: TEXT_MUTED, fontSize: 13, lineHeight: 18 },

  saludoRow: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  saludoEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: INDIGO,
    letterSpacing: 1,
    marginBottom: 3,
  },
  saludoTexto: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  saludoSub: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
  avatarChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarChipImg: { width: '100%', height: '100%' },
  avatarChipText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  banner: {
    margin: 16,
    marginTop: 14,
    borderRadius: 26,
    padding: 22,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  bannerGlowTop: {
    position: 'absolute', top: -40, right: -40, width: 150, height: 150,
    borderRadius: 75, backgroundColor: '#fff', opacity: 0.12,
  },
  bannerGlowBottom: {
    position: 'absolute', bottom: -55, left: -30, width: 130, height: 130,
    borderRadius: 65, backgroundColor: '#fff', opacity: 0.08,
  },
  bannerTopRow: { flexDirection: 'row' },
  bannerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, lineHeight: 28 },
  bannerText: { color: 'rgba(255,255,255,0.78)', marginTop: 6, fontSize: 13 },
  bannerButton: {
    marginTop: 16, backgroundColor: '#fff', alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bannerButtonText: { color: INDIGO, fontWeight: '800', fontSize: 13 },

  sectionHeader: {
    marginTop: 28, marginHorizontal: 16,
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

  horizontalContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 12 },

  categoryCard: {
    width: CARD_WIDTH,
    height: 112,
    backgroundColor: CARD,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: INDIGO,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryText: { color: '#2D3348', fontSize: 12, fontWeight: '700', textAlign: 'center' },

  recentCard: {
    width: 96, backgroundColor: CARD, borderRadius: 18, alignItems: 'center',
    paddingVertical: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  avatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: 'rgba(42,63,214,0.15)' },
  avatarPlaceholder: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: NAVY,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarPlaceholderText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  recentName: { color: '#3E4560', marginTop: 9, fontSize: 12, fontWeight: '700' },

  carruselWrapper: { position: 'relative', justifyContent: 'center' },
  carruselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  carruselArrowLeft: { left: 4 },
  carruselArrowRight: { right: 4 },
});