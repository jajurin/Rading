import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TODO: ajustá el path a tu archivo de config real (mismo que usás en
// OfertasCercanasTrabajador.js)
import API_URL from '../configS';

const { width: SCREEN_W } = Dimensions.get('window');

// -------------------------------------------------------------------------
// Paleta (misma línea que OfertasCercanasTrabajador para mantener identidad)
// -------------------------------------------------------------------------
const COLORS = {
  bg: '#F3F6FB',
  card: '#FFFFFF',
  border: '#E7ECF5',
  text: '#0F1B2D',
  textMuted: '#66748C',
  textFaint: '#94A1B5',
  blue: '#0d47a8',
  blueLight: '#1565D8',
  chipBg: 'rgba(21,101,216,0.08)',
  chipText: '#1565D8',
  emergency: '#E23744',
  emergencyBg: 'rgba(226,55,68,0.08)',
  gold: '#E8A33D',
  success: '#1E9E6B',
  successBg: 'rgba(30,158,107,0.08)',
  shadow: '#0d47a8',
  imagePlaceholder: '#DCE4F0',
};

// -------------------------------------------------------------------------
// Iconos lineales (mismo estilo que la pantalla de listado)
// -------------------------------------------------------------------------
const Icons = {
  Back: ({ color = COLORS.text, size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Star: ({ color = COLORS.gold, size = 14, filled = true }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 2.5L15.09 9.03L22.2 9.99L17.1 14.77L18.35 21.75L12 18.4L5.65 21.75L6.9 14.77L1.8 9.99L8.91 9.03L12 2.5Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  Clock: ({ color = COLORS.textMuted, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7V12L15.5 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Cash: ({ color = COLORS.textMuted, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7.5C3 6.67157 3.67157 6 4.5 6H19.5C20.3284 6 21 6.67157 21 7.5V16.5C21 17.3284 20.3284 18 19.5 18H4.5C3.67157 18 3 17.3284 3 16.5V7.5Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Circle cx="12" cy="12" r="2.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  ),
  Pin: ({ color = COLORS.textMuted, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 19 14.4353 19 9.6C19 5.67451 15.866 2.5 12 2.5C8.13401 2.5 5 5.67451 5 9.6C5 14.4353 12 21 12 21Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="9.6" r="2.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  ),
  Alert: ({ color = '#FFFFFF', size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L22 20H2L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="12" y1="10" x2="12" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="0.9" fill={color} />
    </Svg>
  ),
  Image: ({ color = COLORS.textFaint, size = 28 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2.4" stroke={color} strokeWidth="1.6" />
      <Circle cx="8.5" cy="9.5" r="1.6" stroke={color} strokeWidth="1.6" />
      <Path d="M3.8 16.5L8.5 12L12 15L15.5 11.5L20.5 16.5" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  ),
  Map: ({ color = COLORS.blue, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5L3.5 7V19L9 17M9 5L15 7M9 5V17M15 7L20.5 5V17L15 19M15 7V19M9 17L15 19"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  Check: ({ color = '#FFFFFF', size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L10 17.5L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Radar: ({ color = COLORS.textFaint, size = 40 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.4" opacity="0.3" />
      <Circle cx="12" cy="12" r="5.6" stroke={color} strokeWidth="1.4" opacity="0.5" />
      <Circle cx="12" cy="12" r="1.7" fill={color} />
    </Svg>
  ),
};

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
function formatHora(horaStr) {
  if (!horaStr) return '--:--';
  return horaStr.slice(0, 5);
}

function formatDistancia(valor) {
  if (valor === null || valor === undefined) return null;
  const km = Number(valor);
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatPrecio(item) {
  if (item.fijo && item.precio) return { label: 'Precio fijo', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  if (item.precioEstimadoIA) return { label: 'Estimado por IA', valor: `$${Number(item.precioEstimadoIA).toLocaleString('es-AR')}` };
  if (item.precio) return { label: 'Precio', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  return { label: 'Precio', valor: 'A convenir' };
}

function formatFecha(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function iniciales(nombre = '', apellido = '') {
  const a = nombre?.charAt(0) || '';
  const b = apellido?.charAt(0) || '';
  return (a + b).toUpperCase() || '?';
}

// -------------------------------------------------------------------------
// Carrusel de imágenes
// -------------------------------------------------------------------------
function ImageCarousel({ imagenes = [] }) {
  const [pagina, setPagina] = useState(0);

  if (!imagenes || imagenes.length === 0) {
    return (
      <View style={styles.heroPlaceholder}>
        <Icons.Image />
        <Text style={styles.heroPlaceholderText}>El cliente no adjuntó fotos</Text>
      </View>
    );
  }

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setPagina(idx);
  };

  return (
    <View>
      <FlatList
        data={imagenes}
        keyExtractor={(item) => String(item.id ?? item.url)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <Image source={{ uri: item.url }} style={styles.heroImage} resizeMode="cover" />
        )}
      />
      {/* degradé inferior para que el badge de página se lea bien */}
      <Svg width={SCREEN_W} height={70} style={styles.heroGradient}>
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.38" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height="70" fill="url(#fade)" />
      </Svg>
      {imagenes.length > 1 && (
        <View style={styles.dotsRow}>
          {imagenes.map((_, i) => (
            <View key={i} style={[styles.dot, i === pagina && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------------------
// Bloques reutilizables
// -------------------------------------------------------------------------
function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function InfoTile({ icon, label, value }) {
  return (
    <View style={styles.infoTile}>
      {icon}
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// -------------------------------------------------------------------------
// Pantalla principal
// -------------------------------------------------------------------------
export default function DetalleOfertaTrabajador() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [oferta, setOferta] = useState(null);

  const ofertaId = route.params?.ofertaId;
  const trabajadorId = route.params?.trabajadorId;

  const cargarDetalle = useCallback(async () => {
  setError(null);
  setLoading(true);
  try {
    if (!ofertaId) throw new Error('No se especificó la solicitud a mostrar.');

    const url = trabajadorId
      ? `${API_URL}/trabajador/detalleOferta/${ofertaId}?trabajadorId=${trabajadorId}`
      : `${API_URL}/trabajador/detalleOferta/${ofertaId}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body?.message || 'No pudimos cargar el detalle de la solicitud.');
    }
    const data = await resp.json();
    setOferta(data);
  } catch (e) {
    setError(e?.message || 'No pudimos cargar el detalle de la solicitud.');
  } finally {
    setLoading(false);
  }
}, [ofertaId, trabajadorId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const abrirEnMaps = () => {
    if (!oferta?.lat || !oferta?.lng) return;
    const label = encodeURIComponent(oferta.direccion || 'Ubicación del pedido');
    const url = `https://www.google.com/maps/search/?api=1&query=${oferta.lat},${oferta.lng}&query_place_id=${label}`;
    Linking.openURL(url);
  };

  const handleEnviarOferta = () => {
    // TODO: navegar al formulario de oferta cuando exista
    // navigation.navigate('EnviarOferta', { ofertaId });
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centerState, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  if (error || !oferta) {
    return (
      <View style={[styles.screen, styles.centerState, { paddingTop: insets.top }]}>
        <Icons.Radar />
        <Text style={styles.emptyTitle}>No pudimos cargar la solicitud</Text>
        <Text style={styles.emptySubtitle}>{error || 'Ocurrió un problema inesperado.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={cargarDetalle} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const precio = formatPrecio(oferta);
  const distanciaLabel = formatDistancia(oferta.distancia);
  const fechaLabel = formatFecha(oferta.fecha_iniciado);
  const nombreCliente = `${oferta.nombre ?? ''} ${oferta.apellido ?? ''}`.trim() || 'Cliente';
  const categoriaLabel = oferta.categoria_nombre || oferta.servicio_nombre || 'Servicio';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Hero: carrusel de fotos */}
        <View>
          <ImageCarousel imagenes={oferta.imagenes} />

          <TouchableOpacity
            style={[styles.floatingBack, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Icons.Back />
          </TouchableOpacity>

          {oferta.emergencia && (
            <View style={styles.floatingEmergency}>
              <Icons.Alert size={12} />
              <Text style={styles.floatingEmergencyText}>EMERGENCIA</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Chip de categoría + título */}
          <View style={styles.chip}>
            <Text style={styles.chipText}>{categoriaLabel}</Text>
          </View>
          <Text style={styles.titulo}>{oferta.servicio_nombre || 'Solicitud de servicio'}</Text>
          {fechaLabel && <Text style={styles.fechaTexto}>Publicado el {fechaLabel}</Text>}

          {/* Card del cliente */}
          <View style={styles.clienteCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciales(oferta.nombre, oferta.apellido)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.clienteNombre}>{nombreCliente}</Text>
              <View style={styles.ratingRow}>
                <Icons.Star />
                <Text style={styles.ratingTexto}>
                  {oferta.estrellas ? Number(oferta.estrellas).toFixed(1) : 'Sin calificaciones aún'}
                </Text>
              </View>
            </View>
          </View>

          {/* Info grid */}
          <SectionTitle>Detalles del pedido</SectionTitle>
          <View style={styles.infoGrid}>
            <InfoTile icon={<Icons.Clock />} label="Horario" value={formatHora(oferta.horario_requerido)} />
            <InfoTile icon={<Icons.Cash />} label={precio.label} value={precio.valor} />
            <InfoTile icon={<Icons.Pin />} label="Distancia" value={distanciaLabel || 'A confirmar'} />
          </View>

          {/* Descripción */}
          {!!oferta.descripcion && (
            <>
              <SectionTitle>Descripción</SectionTitle>
              <View style={styles.descripcionCard}>
                <Text style={styles.descripcionTexto}>{oferta.descripcion}</Text>
              </View>
            </>
          )}

          {/* Ubicación */}
          <SectionTitle>Ubicación del pedido</SectionTitle>
          <View style={styles.ubicacionCard}>
            <View style={styles.ubicacionIconWrap}>
              <Icons.Pin color={COLORS.blueLight} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ubicacionDireccion} numberOfLines={2}>
                {oferta.direccion || 'El cliente no especificó una dirección de texto'}
              </Text>
              {distanciaLabel && (
                <Text style={styles.ubicacionDistancia}>A {distanciaLabel} de tu posición actual</Text>
              )}
            </View>
          </View>
          {oferta.lat && oferta.lng && (
            <TouchableOpacity style={styles.mapaBtn} onPress={abrirEnMaps} activeOpacity={0.85}>
              <Icons.Map />
              <Text style={styles.mapaBtnText}>Ver ubicación en el mapa</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* CTA fijo abajo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>{precio.label}</Text>
          <Text style={styles.footerPrecio}>{precio.valor}</Text>
        </View>
        <TouchableOpacity style={styles.enviarBtn} onPress={handleEnviarOferta} activeOpacity={0.9}>
          <Icons.Check />
          <Text style={styles.enviarBtnText}>Enviar oferta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------------------------------------------------------------
// Estilos
// -------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 6 },

  // Hero / carrusel
  heroImage: { width: SCREEN_W, height: 260, backgroundColor: COLORS.imagePlaceholder },
  heroPlaceholder: {
    width: SCREEN_W,
    height: 200,
    backgroundColor: COLORS.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroPlaceholderText: { color: COLORS.textFaint, fontSize: 13, fontWeight: '600' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0 },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    width: SCREEN_W,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 16 },

  floatingBack: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingEmergency: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  floatingEmergencyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },

  body: { paddingHorizontal: 20, paddingTop: 18 },

  chip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: { fontSize: 11.5, fontWeight: '700', color: COLORS.chipText },
  titulo: { fontSize: 21, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  fechaTexto: { fontSize: 12.5, color: COLORS.textFaint, marginTop: 3, fontWeight: '500' },

  clienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  clienteNombre: { fontSize: 15.5, fontWeight: '700', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  ratingTexto: { fontSize: 12.5, color: COLORS.textMuted, fontWeight: '600' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 26,
    marginBottom: 10,
  },

  infoGrid: { flexDirection: 'row', gap: 10 },
  infoTile: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  infoTileLabel: { fontSize: 10.5, color: COLORS.textFaint, fontWeight: '700' },
  infoTileValue: { fontSize: 13.5, color: COLORS.text, fontWeight: '800' },

  descripcionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  descripcionTexto: { fontSize: 13.5, color: COLORS.textMuted, lineHeight: 20 },

  ubicacionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
  },
  ubicacionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ubicacionDireccion: { fontSize: 13.5, color: COLORS.text, fontWeight: '600', lineHeight: 19 },
  ubicacionDistancia: { fontSize: 12, color: COLORS.textFaint, marginTop: 4, fontWeight: '600' },

  mapaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: COLORS.blueLight,
  },
  mapaBtnText: { color: COLORS.blueLight, fontWeight: '700', fontSize: 13.5 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
  },
  footerLabel: { fontSize: 11, color: COLORS.textFaint, fontWeight: '700' },
  footerPrecio: { fontSize: 18, color: COLORS.text, fontWeight: '800', marginTop: 1 },
  enviarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
  },
  enviarBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 },

  emptyTitle: { fontSize: 15.5, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  retryBtn: { marginTop: 14, backgroundColor: COLORS.blue, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});