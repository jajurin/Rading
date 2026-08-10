import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavBarTrabajador from './Navegadortrabajador';
// TODO: ajustá el path si tu estructura de carpetas es distinta.
import API_URL from '../configS';

// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------
const COLORS = {
  bg: '#F3F6FB',
  card: '#FFFFFF',
  border: '#E7ECF5',
  borderStrong: '#D6DEEC',
  text: '#0F1B2D',
  textMuted: '#66748C',
  textFaint: '#94A1B5',
  blue: '#0d47a8',
  blueDeep: '#0A3A87',
  blueLight: '#1565D8',
  chipBg: 'rgba(21,101,216,0.08)',
  chipText: '#1565D8',
  green: '#17A258',
  greenBg: 'rgba(23,162,88,0.1)',
  red: '#E23744',
  redBg: 'rgba(226,55,68,0.1)',
  // Fijo = postulación a precio ya definido por el cliente
  fijo: '#6D28D9',
  fijoBg: 'rgba(109,40,217,0.09)',
  fijoBorder: 'rgba(109,40,217,0.28)',
  // Subasta = se compite por precio
  subasta: '#B4740E',
  subastaBg: 'rgba(217,142,10,0.12)',
  subastaBorder: 'rgba(217,142,10,0.32)',
  shadow: '#0d1c3d',
};

const FILTROS = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'ACEPTADA', label: 'Aceptadas' },
  { key: 'RECHAZADA', label: 'Rechazadas' },
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
  Cash: ({ color = COLORS.blue, size = 18 }) => (
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
  Pencil: ({ color = COLORS.blue, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20L4.6 16.6L15.2 6C15.8 5.4 16.8 5.4 17.4 6L18 6.6C18.6 7.2 18.6 8.2 18 8.8L7.4 19.4L4 20Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <Line x1="13.5" y1="7.7" x2="16.3" y2="10.5" stroke={color} strokeWidth="1.6" />
    </Svg>
  ),
  Close: ({ color = COLORS.textMuted, size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  // Etiqueta = precio fijo, ya cerrado por el cliente
  Etiqueta: ({ color = COLORS.fijo, size = 13 }) => (
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
  // Rombo con martillo estilizado = subasta, se compite por precio
  Subasta: ({ color = COLORS.subasta, size = 13 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L20.5 8V16L12 21L3.5 16V8L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M12 8L15.2 9.9V13.6L12 15.5L8.8 13.6V9.9L12 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
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

function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function formatMonto(valor) {
  if (valor === null || valor === undefined) return '-';
  return `$${Number(valor).toLocaleString('es-AR')}`;
}

function iniciales(nombre = '', apellido = '') {
  const a = nombre?.charAt(0) || '';
  const b = apellido?.charAt(0) || '';
  return (a + b).toUpperCase() || '?';
}

function estadoOfertaInfo(estado) {
  switch (estado) {
    case 'ACEPTADA':
      return { label: 'Aceptada', color: COLORS.green, bg: COLORS.greenBg };
    case 'RECHAZADA':
      return { label: 'Rechazada', color: COLORS.red, bg: COLORS.redBg };
    case 'PENDIENTE':
    default:
      return { label: 'Pendiente', color: COLORS.blueLight, bg: COLORS.chipBg };
  }
}

// Fijo = el cliente ya puso el precio y vos te postulás a ese monto.
// Subasta = compiten varios trabajadores ofertando precio, gana el que
// el cliente elija (generalmente el más bajo). Paleta bien distinta
// (violeta vs. dorado) para que se lea de un vistazo, incluso sin leer texto.
function modalidadInfo(fijo) {
  return fijo
    ? { label: 'Precio fijo', shortLabel: 'FIJO', color: COLORS.fijo, bg: COLORS.fijoBg, border: COLORS.fijoBorder, Icon: Icons.Etiqueta }
    : { label: 'Subasta', shortLabel: 'SUBASTA', color: COLORS.subasta, bg: COLORS.subastaBg, border: COLORS.subastaBorder, Icon: Icons.Subasta };
}

// -------------------------------------------------------------------------
// Badge de modalidad (Fijo / Subasta) — reutilizable
// -------------------------------------------------------------------------
function ModalidadBadge({ fijo, compact = false }) {
  const info = modalidadInfo(fijo);
  const { Icon } = info;
  return (
    <View style={[styles.modBadge, { backgroundColor: info.bg, borderColor: info.border }]}>
      <Icon color={info.color} size={compact ? 11 : 12.5} />
      <Text style={[styles.modBadgeText, { color: info.color }]}>{info.shortLabel}</Text>
    </View>
  );
}

// -------------------------------------------------------------------------
// Fila de filtros (scrolleable, con contador por estado)
// -------------------------------------------------------------------------
function FiltrosBar({ filtro, setFiltro, ofertas }) {
  const conteo = useMemo(() => {
    const c = { TODAS: ofertas.length, PENDIENTE: 0, ACEPTADA: 0, RECHAZADA: 0 };
    ofertas.forEach((o) => {
      if (c[o.estado] !== undefined) c[o.estado] += 1;
    });
    return c;
  }, [ofertas]);

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
// Modal de edición de oferta
// -------------------------------------------------------------------------
function EditarOfertaModal({ visible, oferta, trabajadorId, onClose, onGuardado }) {
  const [precio, setPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (oferta) {
      setPrecio(oferta.precio != null ? String(oferta.precio) : '');
      setMensaje(oferta.mensaje || '');
      setError(null);
    }
  }, [oferta]);

  const handleGuardar = async () => {
    const precioNum = Number(precio);
    if (!precio || Number.isNaN(precioNum) || precioNum <= 0) {
      setError('Ingresá un precio válido.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/trabajador/ofertas/${oferta.idOferta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idTrabajador: trabajadorId,
          precio: precioNum,
          costoExtraMin: oferta.costoExtraMin ?? null,
          costoExtraMax: oferta.costoExtraMax ?? null,
          mensaje: mensaje.trim() || null,
        }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body?.message || 'No pudimos actualizar tu oferta.');
      }
      onGuardado();
    } catch (e) {
      setError(e?.message || 'No pudimos actualizar tu oferta.');
    } finally {
      setGuardando(false);
    }
  };

  if (!oferta) return null;

  const info = modalidadInfo(oferta.fijo);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={[styles.modalAccentBar, { backgroundColor: info.color }]} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Editar oferta</Text>
              <ModalidadBadge fijo={oferta.fijo} />
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icons.Close />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Tu precio</Text>
          <View style={styles.modalInputRow}>
            <Text style={styles.modalInputPrefix}>$</Text>
            <TextInput
              style={styles.modalInputInline}
              value={precio}
              onChangeText={setPrecio}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textFaint}
            />
          </View>

          <Text style={styles.modalLabel}>Mensaje (opcional)</Text>
          <TextInput
            style={[styles.modalInput, styles.modalInputMultiline]}
            value={mensaje}
            onChangeText={setMensaje}
            placeholder="Contale al cliente algo sobre tu oferta…"
            placeholderTextColor={COLORS.textFaint}
            multiline
            numberOfLines={3}
          />

          {!!error && <Text style={styles.modalError}>{error}</Text>}

          <TouchableOpacity
            style={[styles.modalGuardarBtn, { backgroundColor: info.color }, guardando && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.modalGuardarBtnText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// -------------------------------------------------------------------------
// Card
// -------------------------------------------------------------------------
function OfertaEnviadaCard({ item, onVerDetalles, onEditar }) {
  const nombreCliente = `${item.nombre} ${item.apellido}`.trim();
  const categoriaLabel = item.categoria_nombre || item.servicio_nombre || 'Servicio';
  const estadoInfo = estadoOfertaInfo(item.estado);
  const modInfo = modalidadInfo(item.fijo);
  const esEditable = item.estado === 'PENDIENTE';

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: modInfo.color },
        item.emergencia && styles.cardEmergency,
      ]}
    >
      {item.emergencia && (
        <View style={styles.emergencyStrip}>
          <Icons.Alert color="#FFFFFF" size={13} />
          <Text style={styles.emergencyStripText}>EMERGENCIA</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales(item.nombre, item.apellido)}</Text>
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
              <ModalidadBadge fijo={item.fijo} compact />
            </View>
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

        {!!item.mensaje && (
          <Text style={styles.mensaje} numberOfLines={2}>
            “{item.mensaje}”
          </Text>
        )}

        {/* Monto ofertado: bien visible, con botón de editar si sigue pendiente.
            El color de fondo cambia según modalidad para reforzar el contexto. */}
        <View style={[styles.ofertaBox, { backgroundColor: modInfo.bg, borderColor: modInfo.border }]}>
          <View style={styles.ofertaBoxLeft}>
            <View style={[styles.ofertaBoxIconWrap, { backgroundColor: '#FFFFFF' }]}>
              <Icons.Cash color={modInfo.color} size={16} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.ofertaBoxLabel, { color: modInfo.color }]}>
                {item.fijo ? 'Te postulaste por' : 'Tu oferta en subasta'}
              </Text>
              <Text style={styles.ofertaBoxMonto}>{formatMonto(item.precio)}</Text>
            </View>
          </View>

          {esEditable && !item.fijo && (
            <TouchableOpacity style={styles.editarBtn} activeOpacity={0.8} onPress={() => onEditar(item)}>
              <Icons.Pencil color={modInfo.color} />
              <Text style={[styles.editarBtnText, { color: modInfo.color }]}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icons.Clock />
            <View>
              <Text style={styles.infoLabel}>Horario</Text>
              <Text style={styles.infoValor}>{formatHora(item.horario_requerido)}</Text>
            </View>
          </View>

          {!!item.fecha_creado && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <View>
                  <Text style={styles.infoLabel}>Enviada</Text>
                  <Text style={styles.infoValor}>{formatFecha(item.fecha_creado)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.detalleBtn, { backgroundColor: COLORS.blue }]}
          activeOpacity={0.85}
          onPress={() => onVerDetalles(item)}
        >
          <Text style={styles.detalleBtnText}>Ver detalles</Text>
          <Icons.Chevron />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------------------------------------------------------------
// Pantalla principal
// -------------------------------------------------------------------------
export default function MisOfertasTrabajador() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const usuario = route.params?.usuario;
  const trabajadorId = usuario?.idTrabajador;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [ofertas, setOfertas] = useState([]);
  const [filtro, setFiltro] = useState('TODAS');
  const [ofertaEditando, setOfertaEditando] = useState(null);

  const cargarOfertas = useCallback(async () => {
    setError(null);
    try {
      if (!trabajadorId) {
        throw new Error('No se encontró el trabajador logueado.');
      }

      const url = `${API_URL}/trabajador/misOfertas/${trabajadorId}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.message || 'No pudimos cargar tus ofertas.');
      }

      const rows = await resp.json();
      setOfertas(rows || []);
    } catch (e) {
      setError(e?.message || 'No pudimos cargar tus ofertas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trabajadorId]);

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
    navigation.navigate('DetalleOfertaTrabajador', {
      ofertaId: item.idTrabajo,
      trabajadorId,
    });
  };

  const handleGuardadoEdicion = () => {
    setOfertaEditando(null);
    cargarOfertas();
  };

  const ofertasFiltradas = useMemo(() => {
    if (filtro === 'TODAS') return ofertas;
    return ofertas.filter((o) => o.estado === filtro);
  }, [ofertas, filtro]);

  const subtitulo = useMemo(() => {
    if (loading) return 'Cargando tus ofertas…';
    if (error) return 'Ocurrió un problema';
    const cantidad = ofertasFiltradas.length;
    return `${cantidad} oferta${cantidad === 1 ? '' : 's'}`;
  }, [loading, error, ofertasFiltradas.length]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis ofertas</Text>
        <Text style={styles.headerSubtitle}>{subtitulo}</Text>
      </View>

      <FiltrosBar filtro={filtro} setFiltro={setFiltro} ofertas={ofertas} />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Icons.Inbox />
          <Text style={styles.emptyTitle}>No pudimos cargar tus ofertas</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarOfertas} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : ofertasFiltradas.length === 0 ? (
        <View style={styles.centerState}>
          <Icons.Inbox />
          <Text style={styles.emptyTitle}>Sin ofertas por acá</Text>
          <Text style={styles.emptySubtitle}>
            {filtro === 'TODAS'
              ? 'Todavía no enviaste ninguna oferta.'
              : 'No tenés ofertas con este estado.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={ofertasFiltradas}
          keyExtractor={(item) => String(item.idOferta)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <OfertaEnviadaCard item={item} onVerDetalles={handleVerDetalles} onEditar={setOfertaEditando} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
          }
        />
      )}

 <EditarOfertaModal
        visible={!!ofertaEditando}
        oferta={ofertaEditando}
        trabajadorId={trabajadorId}
        onClose={() => setOfertaEditando(null)}
        onGuardado={handleGuardadoEdicion}
      />

      <BottomNavBarTrabajador usuario={usuario} pantallaActiva="busqueda" />
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
    paddingTop: 16,
    paddingBottom: 12,
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
  mensaje: {
    fontSize: 12.5,
    color: COLORS.text,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 17,
  },

  // ---- Monto ofertado destacado ----
  ofertaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  ofertaBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ofertaBoxIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ofertaBoxLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  ofertaBoxMonto: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 1,
  },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editarBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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

  // ---- Modal edición ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,27,45,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  modalAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  modalInputPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginRight: 4,
  },
  modalInput: {
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  modalInputInline: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 12,
  },
  modalInputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalError: {
    fontSize: 12.5,
    color: COLORS.red,
    marginTop: 10,
    fontWeight: '600',
  },
  modalGuardarBtn: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGuardarBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
});