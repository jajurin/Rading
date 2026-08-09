import React, { useCallback, useMemo, useState } from 'react';
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

// TODO: ajustá el path si tu estructura de carpetas es distinta.
import API_URL from '../configS';

// -------------------------------------------------------------------------
// Config
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
  green: '#17A258',
  greenBg: 'rgba(23,162,88,0.1)',
  orange: '#C97A11',
  orangeBg: 'rgba(245,165,36,0.14)',
  red: '#E23744',
  redBg: 'rgba(226,55,68,0.1)',
  shadow: '#0d47a8',
};

const FILTROS = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'EN PROCESO', label: 'En proceso' },
  { key: 'TERMINADO', label: 'Terminadas' },
  { key: 'CANCELADO', label: 'Canceladas' },
];

// -------------------------------------------------------------------------
// Iconos
// -------------------------------------------------------------------------
const Icons = {
  Clock: ({ color = COLORS.textMuted, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7V12L15.5 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
  Users: ({ color = COLORS.blueLight, size = 13 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M3.5 19C3.5 15.5 6 13.5 9 13.5C12 13.5 14.5 15.5 14.5 19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15.5 6C16.9 6.3 18 7.5 18 9C18 10.5 16.9 11.7 15.5 12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M17 13.5C19.2 13.9 20.5 15.7 20.5 19" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  ),
  Inbox: ({ color = COLORS.textFaint, size = 44 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13L6 5H18L21 13V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V13Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <Path d="M3 13H8.5L10 16H14L15.5 13H21" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
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

function formatMonto(item) {
  if (item.fijo && item.precio) return { label: 'Fijo', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  if (item.precioEstimadoIA) return { label: 'Estimado', valor: `$${Number(item.precioEstimadoIA).toLocaleString('es-AR')}` };
  if (item.precio) return { label: 'Precio', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  return { label: 'Precio', valor: 'A convenir' };
}

function iniciales(nombre = '', apellido = '') {
  const a = nombre?.charAt(0) || '';
  const b = apellido?.charAt(0) || '';
  return (a + b).toUpperCase() || '?';
}

function estadoTrabajoInfo(estado) {
  switch (estado) {
    case 'EN PROCESO':
      return { label: 'En proceso', color: COLORS.orange, bg: COLORS.orangeBg };
    case 'TERMINADO':
      return { label: 'Terminado', color: COLORS.green, bg: COLORS.greenBg };
    case 'CANCELADO':
      return { label: 'Cancelado', color: COLORS.red, bg: COLORS.redBg };
    case 'PENDIENTE':
    default:
      return { label: 'Pendiente', color: COLORS.blueLight, bg: COLORS.chipBg };
  }
}

// -------------------------------------------------------------------------
// Fila de filtros (scrolleable, con contador por estado)
// -------------------------------------------------------------------------
function FiltrosBar({ filtro, setFiltro, solicitudes }) {
  const conteo = useMemo(() => {
    const c = { TODAS: solicitudes.length, PENDIENTE: 0, 'EN PROCESO': 0, TERMINADO: 0, CANCELADO: 0 };
    solicitudes.forEach((s) => {
      if (c[s.estado] !== undefined) c[s.estado] += 1;
    });
    return c;
  }, [solicitudes]);

  return (
    <View style={styles.filtrosWrap}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTROS}
        keyExtractor={(f) => f.key}
        contentContainerStyle={styles.filtrosRow}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        renderItem={({ item: f }) => {
          const activo = filtro === f.key;
          const cantidad = conteo[f.key] ?? 0;
          return (
            <TouchableOpacity
              style={[styles.filtroChip, activo && styles.filtroChipActivo]}
              activeOpacity={0.8}
              onPress={() => setFiltro(f.key)}
            >
              <Text style={[styles.filtroChipText, activo && styles.filtroChipTextActivo]}>{f.label}</Text>
              {cantidad > 0 && (
                <View style={[styles.filtroChipCount, activo && styles.filtroChipCountActivo]}>
                  <Text style={[styles.filtroChipCountText, activo && styles.filtroChipCountTextActivo]}>
                    {cantidad}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------------------
// Card
// -------------------------------------------------------------------------
function SolicitudCard({ item, onVerDetalles }) {
  const precio = formatMonto(item);
  const categoriaLabel = item.categoria_nombre || item.servicio_nombre || 'Servicio';
  const estadoInfo = estadoTrabajoInfo(item.estado);
  const trabajadorAsignado = item.idTrabajadorAsignado
    ? `${item.trabajadorNombre || ''} ${item.trabajadorApellido || ''}`.trim()
    : null;
  const mostrarOfertas = item.estado === 'PENDIENTE' && Number(item.cantidadOfertas) > 0;

  return (
    <View style={[styles.card, item.emergencia && styles.cardEmergency]}>
      {item.emergencia && (
        <View style={styles.emergencyStrip}>
          <Icons.Alert color="#FFFFFF" size={13} />
          <Text style={styles.emergencyStripText}>EMERGENCIA</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoriaTitulo} numberOfLines={1}>
              {categoriaLabel}
            </Text>
            {trabajadorAsignado ? (
              <View style={styles.trabajadorRow}>
                <View style={styles.avatarChico}>
                  <Text style={styles.avatarChicoText}>
                    {iniciales(item.trabajadorNombre, item.trabajadorApellido)}
                  </Text>
                </View>
                <Text style={styles.trabajadorNombre} numberOfLines={1}>
                  {trabajadorAsignado}
                </Text>
              </View>
            ) : (
              <Text style={styles.sinAsignar}>Sin trabajador asignado</Text>
            )}
          </View>

          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
            <Text style={[styles.estadoBadgeText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
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
            <Icons.Cash />
            <View>
              <Text style={styles.infoLabel}>{precio.label}</Text>
              <Text style={styles.infoValor}>{precio.valor}</Text>
            </View>
          </View>
        </View>

        {mostrarOfertas && (
          <View style={styles.ofertasBanner}>
            <Icons.Users />
            <Text style={styles.ofertasBannerText}>
              {item.cantidadOfertas} oferta{Number(item.cantidadOfertas) === 1 ? '' : 's'} esperando tu respuesta
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.detalleBtn}
          activeOpacity={0.85}
          onPress={() => onVerDetalles(item)}
        >
          <Text style={styles.detalleBtnText}>{mostrarOfertas ? 'Ver ofertas' : 'Ver detalles'}</Text>
          <Icons.Chevron />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------------------------------------------------------------
// Pantalla principal
// -------------------------------------------------------------------------
export default function MisSolicitudesCliente() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const usuario = route.params?.usuario;
  const clienteId = usuario?.idCliente;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');

  const cargarSolicitudes = useCallback(async () => {
    setError(null);
    try {
      if (!clienteId) {
        throw new Error('No se encontró el cliente logueado.');
      }

      const url = `${API_URL}/cliente/misSolicitudes/${clienteId}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.message || 'No pudimos cargar tus solicitudes.');
      }

      const rows = await resp.json();
      setSolicitudes(rows || []);
    } catch (e) {
      setError(e?.message || 'No pudimos cargar tus solicitudes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clienteId]);

  useFocusEffect(
    useCallback(() => {
      cargarSolicitudes();
    }, [cargarSolicitudes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarSolicitudes();
  };

  const handleVerDetalles = (item) => {
    // Si está PENDIENTE y tiene ofertas, llevá al cliente directo a la
    // pantalla donde puede comparar y aceptar ofertas (GET /cliente/ofertas/:idTrabajo).
    // TODO: reemplazá 'OfertasRecibidasCliente' por el nombre real de esa pantalla en tu navigator.
    if (item.estado === 'PENDIENTE' && Number(item.cantidadOfertas) > 0) {
      navigation.navigate('OfertasRecibidasCliente', { idTrabajo: item.id, clienteId });
    } else {
      // TODO: reemplazá 'DetalleSolicitudCliente' por el nombre real de esa pantalla.
      navigation.navigate('DetalleSolicitudCliente', { idTrabajo: item.id, clienteId });
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    if (filtro === 'TODAS') return solicitudes;
    return solicitudes.filter((s) => s.estado === filtro);
  }, [solicitudes, filtro]);

  const subtitulo = useMemo(() => {
    if (loading) return 'Cargando tus solicitudes…';
    if (error) return 'Ocurrió un problema';
    const cantidad = solicitudesFiltradas.length;
    return `${cantidad} solicitud${cantidad === 1 ? '' : 'es'}`;
  }, [loading, error, solicitudesFiltradas.length]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis solicitudes</Text>
        <Text style={styles.headerSubtitle}>{subtitulo}</Text>
      </View>

      <FiltrosBar filtro={filtro} setFiltro={setFiltro} solicitudes={solicitudes} />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Icons.Inbox />
          <Text style={styles.emptyTitle}>No pudimos cargar tus solicitudes</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarSolicitudes} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : solicitudesFiltradas.length === 0 ? (
        <View style={styles.centerState}>
          <Icons.Inbox />
          <Text style={styles.emptyTitle}>Sin solicitudes por acá</Text>
          <Text style={styles.emptySubtitle}>
            {filtro === 'TODAS'
              ? 'Todavía no enviaste ninguna solicitud.'
              : 'No tenés solicitudes con este estado.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={solicitudesFiltradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <SolicitudCard item={item} onVerDetalles={handleVerDetalles} />}
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },

  // ---- Filtros ----
  filtrosWrap: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 4,
  },
  filtrosRow: {
    paddingHorizontal: 16,
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filtroChipActivo: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  filtroChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filtroChipTextActivo: {
    color: '#FFFFFF',
  },
  filtroChipCount: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtroChipCountActivo: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filtroChipCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.blueLight,
  },
  filtroChipCountTextActivo: {
    color: '#FFFFFF',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardEmergency: {
    borderColor: 'rgba(226,55,68,0.35)',
  },
  emergencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.red,
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
    alignItems: 'flex-start',
  },
  categoriaTitulo: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  trabajadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  avatarChico: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChicoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 9.5,
  },
  trabajadorNombre: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sinAsignar: {
    fontSize: 12.5,
    fontWeight: '500',
    color: COLORS.textFaint,
    marginTop: 6,
  },

  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: '800',
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

  ofertasBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: COLORS.chipBg,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  ofertasBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blueLight,
  },

  detalleBtn: {
    marginTop: 14,
    backgroundColor: COLORS.blue,
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