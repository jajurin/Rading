import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TODO: ajustá el nombre/path exacto de tu archivo con la URL base del
// backend (el api.js / config.js que ya tenés). Debe exportar algo tipo:
//   export const API_URL = 'http://192.168.x.x:3000'
import API_URL from '../configS';
// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------
const RADIO_DEFAULT_KM = 20;

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
  emergencyStrip: '#E23744',
  shadow: '#0d1c3d',
  // Fijo = el cliente ya definió el precio, vos te postulás a ese monto
  fijo: '#6D28D9',
  fijoBg: 'rgba(109,40,217,0.09)',
  fijoBorder: 'rgba(109,40,217,0.28)',
  // Subasta = varios trabajadores compiten ofertando precio
  subasta: '#B4740E',
  subastaBg: 'rgba(217,142,10,0.12)',
  subastaBorder: 'rgba(217,142,10,0.32)',
};

// Fijo = el cliente ya puso el precio y vos te postulás a ese monto.
// Subasta = compiten varios trabajadores ofertando precio. Misma paleta
// que el resto de la app (violeta / dorado) para reconocer de un vistazo.
function modalidadInfo(fijo) {
  return fijo
    ? { shortLabel: 'FIJO', color: COLORS.fijo, bg: COLORS.fijoBg, border: COLORS.fijoBorder }
    : { shortLabel: 'SUBASTA', color: COLORS.subasta, bg: COLORS.subastaBg, border: COLORS.subastaBorder };
}

// -------------------------------------------------------------------------
// Iconos (mismo estilo lineal que el resto de la app)
// -------------------------------------------------------------------------
const Icons = {
  Sliders: ({ color = COLORS.blue, size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="5" y1="6" x2="19" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="5" y1="18" x2="19" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="9" cy="6" r="2" fill={COLORS.bg} stroke={color} strokeWidth="1.8" />
      <Circle cx="15" cy="12" r="2" fill={COLORS.bg} stroke={color} strokeWidth="1.8" />
      <Circle cx="10" cy="18" r="2" fill={COLORS.bg} stroke={color} strokeWidth="1.8" />
    </Svg>
  ),
  Clock: ({ color = COLORS.textMuted, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7V12L15.5 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Pin: ({ color = COLORS.textMuted, size = 15 }) => (
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
  Cash: ({ color = COLORS.textMuted, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7.5C3 6.67157 3.67157 6 4.5 6H19.5C20.3284 6 21 6.67157 21 7.5V16.5C21 17.3284 20.3284 18 19.5 18H4.5C3.67157 18 3 17.3284 3 16.5V7.5Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Circle cx="12" cy="12" r="2.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  ),
  Chevron: ({ color = '#FFFFFF', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6L15 12L9 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Alert: ({ color = '#FFFFFF', size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L22 20H2L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="12" y1="10" x2="12" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="0.9" fill={color} />
    </Svg>
  ),
  Radar: ({ color = COLORS.blue, size = 34 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.4" opacity="0.3" />
      <Circle cx="12" cy="12" r="5.6" stroke={color} strokeWidth="1.4" opacity="0.5" />
      <Circle cx="12" cy="12" r="1.7" fill={color} />
      <Path d="M12 12L17.2 6.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  Etiqueta: ({ color = COLORS.fijo, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.5 3H19a2 2 0 012 2v7.5a2 2 0 01-.586 1.414l-8 8a2 2 0 01-2.828 0l-7-7a2 2 0 010-2.828l8-8A2 2 0 0111.5 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Circle cx="15.5" cy="8.5" r="1.6" stroke={color} strokeWidth="1.6" />
    </Svg>
  ),
  Subasta: ({ color = COLORS.subasta, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L20.5 8V16L12 21L3.5 16V8L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M12 8L15.2 9.9V13.6L12 15.5L8.8 13.6V9.9L12 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
};

// -------------------------------------------------------------------------
// Badge de modalidad (Fijo / Subasta)
// -------------------------------------------------------------------------
function ModalidadBadge({ fijo }) {
  const info = modalidadInfo(fijo);
  const Icon = fijo ? Icons.Etiqueta : Icons.Subasta;
  return (
    <View style={[styles.modBadge, { backgroundColor: info.bg, borderColor: info.border }]}>
      <Icon color={info.color} size={11} />
      <Text style={[styles.modBadgeText, { color: info.color }]}>{info.shortLabel}</Text>
    </View>
  );
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
function formatHora(horaStr) {
  if (!horaStr) return '--:--';
  return horaStr.slice(0, 5);
}

// La columna ct.distancia ya viene calculada del backend. Asumimos que
// está guardada en km (es como la usan en distanciaMax en filtrarSolicitudes).
// Si en tu DB en realidad son metros, avisame y ajusto el formateo.
function formatDistancia(valor) {
  if (valor === null || valor === undefined) return '-- km';
  const km = Number(valor);
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatPrecio(item) {
  if (item.fijo && item.precio) return { label: 'Precio fijo', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  if (item.precioEstimadoIA) return { label: 'Estimado', valor: `$${Number(item.precioEstimadoIA).toLocaleString('es-AR')}` };
  if (item.precio) return { label: 'Precio base', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  return { label: 'Precio', valor: 'A convenir' };
}

function iniciales(nombre = '', apellido = '') {
  const a = nombre?.charAt(0) || '';
  const b = apellido?.charAt(0) || '';
  return (a + b).toUpperCase() || '?';
}

// -------------------------------------------------------------------------
// Card
// -------------------------------------------------------------------------
function OfertaCard({ item, onVerDetalles }) {
  const precio = formatPrecio(item);
  const nombreCliente = `${item.clienteNombre} ${item.clienteApellido}`.trim();
  const categoriaLabel = item.categoriaNombre || item.servicioNombre || 'Servicio';
  const modInfo = modalidadInfo(item.fijo);

  return (
    <View style={[styles.card, { borderLeftColor: modInfo.color }, item.emergencia && styles.cardEmergency]}>
      {item.emergencia && (
        <View style={styles.emergencyStrip}>
          <Icons.Alert color="#FFFFFF" size={13} />
          <Text style={styles.emergencyStripText}>EMERGENCIA</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales(item.clienteNombre, item.clienteApellido)}</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.clienteNombre} numberOfLines={1}>
              {nombreCliente || 'Cliente'}
            </Text>
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {categoriaLabel}
                </Text>
              </View>
              <ModalidadBadge fijo={item.fijo} />
            </View>
          </View>

          <View style={styles.distanciaBadge}>
            <Icons.Pin color={COLORS.blueLight} size={12} />
            <Text style={styles.distanciaBadgeText}>{formatDistancia(item.distancia)}</Text>
          </View>
        </View>

        {!!item.descripcion && (
          <Text style={styles.descripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icons.Clock />
            <View>
              <Text style={styles.infoLabel}>Horario</Text>
              <Text style={styles.infoValor}>{formatHora(item.horario_requerido)}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <Icons.Cash color={modInfo.color} />
            <View>
              <Text style={styles.infoLabel}>{precio.label}</Text>
              <Text style={styles.infoValor}>{precio.valor}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.detalleBtn, { backgroundColor: modInfo.color }]}
          activeOpacity={0.85}
          onPress={() => onVerDetalles(item)}
        >
          <Text style={styles.detalleBtnText}>{item.fijo ? 'Ver y postularme' : 'Ver y ofertar'}</Text>
          <Icons.Chevron />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------------------------------------------------------------
// Pantalla principal
// -------------------------------------------------------------------------
export default function OfertasCercanasTrabajador() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // TODO: adaptá esto al shape real de tu objeto `usuario` si hace falta.
  // Necesita el id de la fila en "Trabajador" (no el id de Usuario).
  const usuario = route.params?.usuario;
  const radioKm = route.params?.radioKm || RADIO_DEFAULT_KM;
  // El login devuelve { ...usuario, tipo, idCliente, idTrabajador }, así
  // que el id de la fila en "Trabajador" viene en usuario.idTrabajador.
  const trabajadorId = usuario?.idTrabajador;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [ofertas, setOfertas] = useState([]);
  const [filtroModalidad, setFiltroModalidad] = useState('TODAS'); // TODAS | FIJO | SUBASTA

  const cargarOfertas = useCallback(async () => {
    setError(null);
    try {
      if (!trabajadorId) {
        throw new Error('No se encontró el trabajador logueado.');
      }

      const url = `${API_URL}/trabajador/ofertasCercanas/${trabajadorId}?radioKm=${radioKm}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.message || 'No pudimos cargar las ofertas cercanas.');
      }

      const rows = await resp.json();

      const procesadas = (rows || []).map((row) => ({
        id: row.id,
        descripcion: row.descripcion,
        horario_requerido: row.horario_requerido,
        fijo: row.fijo,
        precio: row.precio,
        precioEstimadoIA: row.precioEstimadoIA,
        emergencia: row.emergencia,
        distancia: row.distancia,
        servicioNombre: row.servicio_nombre,
        categoriaNombre: row.categoria_nombre,
        clienteNombre: row.nombre || '',
        clienteApellido: row.apellido || '',
      }));

      // El backend ya ordena por emergencia y distancia, esto es solo
      // un resguardo por si en algún momento cambia el orden del SQL.
      procesadas.sort((a, b) => {
        if (a.emergencia !== b.emergencia) return a.emergencia ? -1 : 1;
        return (a.distancia ?? Infinity) - (b.distancia ?? Infinity);
      });

      setOfertas(procesadas);
    } catch (e) {
      setError(e?.message || 'No pudimos cargar las ofertas cercanas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trabajadorId, radioKm]);

  useEffect(() => {
    cargarOfertas();
  }, [cargarOfertas]);

  // Vuelve a pedir la lista cada vez que esta pantalla recupera el foco
  // (por ejemplo al volver con goBack() desde el detalle luego de ofertar),
  // así el trabajo recién ofertado deja de aparecer sin tener que
  // desmontar/remontar toda la pantalla.
  useFocusEffect(
    useCallback(() => {
      cargarOfertas();
    }, [cargarOfertas])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarOfertas();
  };

  const handleVerDetalles = (item) => {
  navigation.navigate('DetalleOfertaTrabajador', { ofertaId: item.id, trabajadorId });
};

  const ofertasFiltradas = useMemo(() => {
    if (filtroModalidad === 'FIJO') return ofertas.filter((o) => o.fijo);
    if (filtroModalidad === 'SUBASTA') return ofertas.filter((o) => !o.fijo);
    return ofertas;
  }, [ofertas, filtroModalidad]);

  const conteoFijo = useMemo(() => ofertas.filter((o) => o.fijo).length, [ofertas]);
  const conteoSubasta = useMemo(() => ofertas.filter((o) => !o.fijo).length, [ofertas]);

  const subtitulo = useMemo(() => {
    if (loading) return 'Buscando cerca tuyo…';
    if (error) return 'Ocurrió un problema';
    const cantidad = ofertasFiltradas.length;
    return `Dentro de ${radioKm} km · ${cantidad} disponible${cantidad === 1 ? '' : 's'}`;
  }, [loading, error, ofertasFiltradas.length, radioKm]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ofertas cercanas</Text>
          <Text style={styles.headerSubtitle}>{subtitulo}</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <Icons.Sliders />
        </TouchableOpacity>
      </View>

      {/* Selector rápido de modalidad — misma paleta violeta/dorado del resto de la app */}
      {!loading && !error && ofertas.length > 0 && (
        <View style={styles.modalidadRow}>
          <TouchableOpacity
            style={[styles.modalidadBtn, filtroModalidad === 'TODAS' && styles.modalidadBtnActivoNeutro]}
            onPress={() => setFiltroModalidad('TODAS')}
            activeOpacity={0.85}
          >
            <Text style={[styles.modalidadBtnText, filtroModalidad === 'TODAS' && styles.modalidadBtnTextActivo]}>
              Todas
            </Text>
            <View style={[styles.modalidadCount, filtroModalidad === 'TODAS' && styles.modalidadCountActivo]}>
              <Text style={[styles.modalidadCountText, filtroModalidad === 'TODAS' && styles.modalidadCountTextActivo]}>
                {ofertas.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalidadBtn, filtroModalidad === 'SUBASTA' && { backgroundColor: COLORS.subasta }]}
            onPress={() => setFiltroModalidad('SUBASTA')}
            activeOpacity={0.85}
          >
            <Icons.Subasta color={filtroModalidad === 'SUBASTA' ? '#FFFFFF' : COLORS.subasta} size={13} />
            <Text style={[styles.modalidadBtnText, filtroModalidad === 'SUBASTA' && styles.modalidadBtnTextActivo, filtroModalidad !== 'SUBASTA' && { color: COLORS.subasta }]}>
              Subasta
            </Text>
            <View style={[styles.modalidadCount, filtroModalidad === 'SUBASTA' && styles.modalidadCountActivo]}>
              <Text style={[styles.modalidadCountText, filtroModalidad === 'SUBASTA' && styles.modalidadCountTextActivo, filtroModalidad !== 'SUBASTA' && { color: COLORS.subasta }]}>
                {conteoSubasta}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalidadBtn, filtroModalidad === 'FIJO' && { backgroundColor: COLORS.fijo }]}
            onPress={() => setFiltroModalidad('FIJO')}
            activeOpacity={0.85}
          >
            <Icons.Etiqueta color={filtroModalidad === 'FIJO' ? '#FFFFFF' : COLORS.fijo} size={13} />
            <Text style={[styles.modalidadBtnText, filtroModalidad === 'FIJO' && styles.modalidadBtnTextActivo, filtroModalidad !== 'FIJO' && { color: COLORS.fijo }]}>
              Fijo
            </Text>
            <View style={[styles.modalidadCount, filtroModalidad === 'FIJO' && styles.modalidadCountActivo]}>
              <Text style={[styles.modalidadCountText, filtroModalidad === 'FIJO' && styles.modalidadCountTextActivo, filtroModalidad !== 'FIJO' && { color: COLORS.fijo }]}>
                {conteoFijo}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Icons.Radar color={COLORS.textFaint} size={44} />
          <Text style={styles.emptyTitle}>No pudimos cargar las ofertas</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarOfertas} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : ofertas.length === 0 ? (
        <View style={styles.centerState}>
          <Icons.Radar color={COLORS.textFaint} size={44} />
          <Text style={styles.emptyTitle}>Sin ofertas por ahora</Text>
          <Text style={styles.emptySubtitle}>
            No hay solicitudes dentro de {radioKm} km para tus servicios en este momento.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarOfertas} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      ) : ofertasFiltradas.length === 0 ? (
        <View style={styles.centerState}>
          <Icons.Radar color={COLORS.textFaint} size={44} />
          <Text style={styles.emptyTitle}>
            {filtroModalidad === 'FIJO' ? 'Sin trabajos a precio fijo' : 'Sin subastas por ahora'}
          </Text>
          <Text style={styles.emptySubtitle}>Probá con el otro filtro o revisá más tarde.</Text>
        </View>
      ) : (
        <FlatList
          data={ofertasFiltradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <OfertaCard item={item} onVerDetalles={handleVerDetalles} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
          }
        />
      )}
    </View>
  );
}

// -------------------------------------------------------------------------
// Estilos
// -------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- Selector de modalidad (Todas / Subasta / Fijo) ----
  modalidadRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  modalidadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalidadBtnActivoNeutro: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  modalidadBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalidadBtnTextActivo: {
    color: '#FFFFFF',
  },
  modalidadCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalidadCountActivo: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modalidadCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  modalidadCountTextActivo: {
    color: '#FFFFFF',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardEmergency: {
    borderColor: 'rgba(226,55,68,0.35)',
  },
  emergencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.emergencyStrip,
    paddingVertical: 7,
  },
  emergencyStripText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  clienteNombre: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.chipText,
  },

  // ---- Badge de modalidad (Fijo / Subasta) ----
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  modBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  distanciaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  distanciaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blueLight,
  },

  descripcion: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 10,
    lineHeight: 17,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoDivider: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  infoLabel: {
    fontSize: 10.5,
    color: COLORS.textFaint,
    fontWeight: '600',
  },
  infoValor: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: 1,
  },

  detalleBtn: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detalleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});