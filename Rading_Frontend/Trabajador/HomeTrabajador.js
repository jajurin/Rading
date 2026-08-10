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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';

import Header from '../Header';
import BottomNavBarTrabajador from './Navegadortrabajador';
import TrabajoActivoTrabajador from './TrabajoActivoTrabajador';
import TrabajoActivoOverlayTrabajador from './TrabajoActivoOverlayTrabajador';
import Search from './Search';
import API_URL from '../configS';

// ── Paleta ─────────────────────────────────────────────────────────────────
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
const WHITE        = '#FFFFFF';
// Fijo = precio ya cerrado por el cliente. Subasta = se compite por precio.
const FIJO         = '#6D28D9';
const FIJO_BG      = 'rgba(109,40,217,0.09)';
const FIJO_BORDER  = 'rgba(109,40,217,0.28)';
const SUBASTA      = '#B4740E';
const SUBASTA_BG   = 'rgba(217,142,10,0.12)';
const SUBASTA_BORDER = 'rgba(217,142,10,0.32)';

const NAVBAR_BASE_HEIGHT = 30;
const WIDGET_GAP = 10;

const AVATAR_CLIENTE = (nombre = '', apellido = '') =>
  `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=2A3FD6&color=fff&size=150`;

const obtenerFranjaHoraria = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { saludo: 'Buenos días', icon: 'sunny', gradient: [INDIGO_SOFT, INDIGO] };
  if (h >= 12 && h < 19) return { saludo: 'Buenas tardes', icon: 'partly-sunny', gradient: [INDIGO, '#1E2E9E'] };
  return { saludo: 'Buenas noches', icon: 'moon', gradient: [NAVY, '#25306E'] };
};

const iniciales = (nombre = '', apellido = '') => {
  if (apellido !== undefined) {
    const a = nombre?.charAt(0) || '';
    const b = apellido?.charAt(0) || '';
    return (a + b).toUpperCase() || '?';
  }
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '👤';
};

function modalidadInfo(fijo) {
  return fijo
    ? { shortLabel: 'FIJO', color: FIJO, bg: FIJO_BG, border: FIJO_BORDER }
    : { shortLabel: 'SUBASTA', color: SUBASTA, bg: SUBASTA_BG, border: SUBASTA_BORDER };
}

function formatHora(horaStr) {
  if (!horaStr) return '--:--';
  return horaStr.slice(0, 5);
}

function formatDistancia(valor) {
  if (valor === null || valor === undefined) return null;
  const km = Number(valor);
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatPrecioResultado(item) {
  if (item.fijo && item.precio) return { label: 'Precio fijo', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  if (item.precioEstimadoIA) return { label: 'Estimado', valor: `$${Number(item.precioEstimadoIA).toLocaleString('es-AR')}` };
  if (item.precio) return { label: 'Precio base', valor: `$${Number(item.precio).toLocaleString('es-AR')}` };
  return { label: 'Precio', valor: 'A convenir' };
}

const SERVICIOS = [
  { id: 1,  nombre: 'Electricista' },
  { id: 2,  nombre: 'Plomero' },
  { id: 3,  nombre: 'Jardinero' },
  { id: 4,  nombre: 'Gasista' },
  { id: 5,  nombre: 'Limpieza' },
  { id: 6,  nombre: 'Cerrajero' },
  { id: 7,  nombre: 'Diseñador Gráfico' },
  { id: 8,  nombre: 'Programador' },
  { id: 9,  nombre: 'Redactor' },
  { id: 10, nombre: 'Editor de Video' },
  { id: 11, nombre: 'Community Manager' },
  { id: 12, nombre: 'Abogado' },
  { id: 13, nombre: 'Contador' },
  { id: 14, nombre: 'Arquitecto' },
  { id: 15, nombre: 'Médico' },
  { id: 16, nombre: 'Psicólogo' },
  { id: 17, nombre: 'Ingeniero' },
];

// ── Iconos ─────────────────────────────────────────────────────────────────
const Icons = {
  Sliders: ({ color = INDIGO, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="5" y1="6" x2="19" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="5" y1="18" x2="19" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="9" cy="6" r="2" fill={CARD} stroke={color} strokeWidth="1.8" />
      <Circle cx="15" cy="12" r="2" fill={CARD} stroke={color} strokeWidth="1.8" />
      <Circle cx="10" cy="18" r="2" fill={CARD} stroke={color} strokeWidth="1.8" />
    </Svg>
  ),
  Clock: ({ color = TEXT_MUTED, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7V12L15.5 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Pin: ({ color = TEXT_MUTED, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 19 14.4353 19 9.6C19 5.67451 15.866 2.5 12 2.5C8.13401 2.5 5 5.67451 5 9.6C5 14.4353 12 21 12 21Z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <Circle cx="12" cy="9.6" r="2.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  ),
  Cash: ({ color = TEXT_MUTED, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7.5C3 6.67157 3.67157 6 4.5 6H19.5C20.3284 6 21 6.67157 21 7.5V16.5C21 17.3284 20.3284 18 19.5 18H4.5C3.67157 18 3 17.3284 3 16.5V7.5Z"
        stroke={color} strokeWidth="1.8"
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
  Etiqueta: ({ color = FIJO, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.5 3H19a2 2 0 012 2v7.5a2 2 0 01-.586 1.414l-8 8a2 2 0 01-2.828 0l-7-7a2 2 0 010-2.828l8-8A2 2 0 0111.5 3z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <Circle cx="15.5" cy="8.5" r="1.6" stroke={color} strokeWidth="1.6" />
    </Svg>
  ),
  Subasta: ({ color = SUBASTA, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L20.5 8V16L12 21L3.5 16V8L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M12 8L15.2 9.9V13.6L12 15.5L8.8 13.6V9.9L12 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
  Close: ({ color = '#FFFFFF', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  Search2: ({ color = TEXT_MUTED, size = 32 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <Line x1="21" y1="21" x2="16.5" y2="16.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
};

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

// ── Card de resultado de búsqueda ─────────────────────────────────────────
function ResultadoCard({ item, onVerDetalles }) {
  const precio = formatPrecioResultado(item);
  const nombreCliente = `${item.nombre ?? ''} ${item.apellido ?? ''}`.trim();
  const categoriaLabel = item.categoria_nombre || item.servicio_nombre || 'Servicio';
  const modInfo = modalidadInfo(item.fijo);
  const distanciaTxt = formatDistancia(item.distancia);
  const ctaGradient = item.fijo ? [FIJO, '#4C1D95'] : [SUBASTA, '#8A5A0A'];

  return (
    <View style={[styles.resCard, item.emergencia && styles.resCardEmergency]}>
      <View style={[styles.resAccentBar, { backgroundColor: modInfo.color }]} />

      {item.emergencia && (
        <View style={styles.emergencyStrip}>
          <Icons.Alert color="#FFFFFF" size={13} />
          <Text style={styles.emergencyStripText}>EMERGENCIA</Text>
        </View>
      )}

      <View style={styles.resCardBody}>
        <View style={styles.resCardHeaderRow}>
          <View style={styles.resAvatarWrap}>
            <Image
              source={{ uri: item.foto ?? AVATAR_CLIENTE(item.nombre, item.apellido) }}
              style={styles.resAvatar}
            />
          </View>

          <View style={{ flex: 1, marginLeft: 13 }}>
            <Text style={styles.resClienteNombre} numberOfLines={1}>
              {nombreCliente || 'Cliente'}
            </Text>
            <View style={styles.resChipsRow}>
              <View style={styles.resChip}>
                <Ionicons name="briefcase-outline" size={11} color={INDIGO} />
                <Text style={styles.resChipText} numberOfLines={1}>{categoriaLabel}</Text>
              </View>
              <ModalidadBadge fijo={item.fijo} />
            </View>
          </View>
        </View>

        {distanciaTxt && (
          <View style={styles.distanciaBadgeFloat}>
            <Icons.Pin color={INDIGO} size={11} />
            <Text style={styles.distanciaBadgeText}>{distanciaTxt}</Text>
          </View>
        )}

        {!!item.descripcion && (
          <Text style={styles.resDescripcion} numberOfLines={2}>{item.descripcion}</Text>
        )}

        <View style={styles.resInfoRow}>
          <View style={styles.resInfoItem}>
            <View style={styles.resInfoIconWrap}>
              <Icons.Clock color={INDIGO} size={14} />
            </View>
            <View>
              <Text style={styles.resInfoLabel}>Horario</Text>
              <Text style={styles.resInfoValor}>{formatHora(item.horario_requerido)}</Text>
            </View>
          </View>

          <View style={styles.resInfoDivider} />

          <View style={styles.resInfoItem}>
            <View style={[styles.resInfoIconWrap, { backgroundColor: modInfo.bg }]}>
              <Icons.Cash color={modInfo.color} size={14} />
            </View>
            <View>
              <Text style={styles.resInfoLabel}>{precio.label}</Text>
              <Text style={[styles.resInfoValor, { color: modInfo.color, fontSize: 14.5 }]}>{precio.valor}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.88} onPress={() => onVerDetalles(item)}>
          <LinearGradient
            colors={ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.resDetalleBtn}
          >
            <Text style={styles.resDetalleBtnText}>{item.fijo ? 'Ver y postularme' : 'Ver y ofertar'}</Text>
            <Icons.Chevron />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Selector de estrellas y horario, reutilizados en el modal de filtros ──
const StarSelector = ({ value, onChange }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((n) => (
      <TouchableOpacity key={n} onPress={() => onChange(value === n ? null : n)} activeOpacity={0.7}>
        <Ionicons
          name={n <= (value ?? 0) ? 'star' : 'star-outline'}
          size={26}
          color={n <= (value ?? 0) ? AMBER : 'rgba(255,255,255,0.3)'}
        />
      </TouchableOpacity>
    ))}
    {value ? <Text style={styles.starLabel}>+{value} estrellas</Text> : null}
  </View>
);

const TimePicker = ({ label, value, onChange }) => {
  const minuteRef = React.useRef(null);
  const [hour, minute] = value ? value.split(':') : ['', ''];

  const setHour = (h) => {
    const hh = h.replace(/[^0-9]/g, '').slice(0, 2);
    if (hh === '' || (Number(hh) >= 0 && Number(hh) <= 23)) {
      onChange(hh + ':' + (minute || '00'));
      if (hh.length === 2) minuteRef.current?.focus();
    }
  };

  const setMinute = (m) => {
    const mm = m.replace(/[^0-9]/g, '').slice(0, 2);
    if (mm === '' || (Number(mm) >= 0 && Number(mm) <= 59)) {
      onChange((hour || '00') + ':' + mm);
    }
  };

  return (
    <View style={styles.timePickerRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeInputs}>
        <TextInput
          style={styles.timeInputBox}
          value={hour}
          onChangeText={setHour}
          placeholder="HH"
          placeholderTextColor="rgba(255,255,255,0.35)"
          keyboardType="number-pad"
          maxLength={2}
          returnKeyType="next"
          onSubmitEditing={() => minuteRef.current?.focus()}
        />
        <Text style={styles.timeSep}>:</Text>
        <TextInput
          ref={minuteRef}
          style={styles.timeInputBox}
          value={minute}
          onChangeText={setMinute}
          placeholder="MM"
          placeholderTextColor="rgba(255,255,255,0.35)"
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
    </View>
  );
};

// ── Modal de filtros (embebido, no navega a otra pantalla) ────────────────
function FilterModal({ visible, onClose, onApply, initialFilters }) {
  const [estrellas,    setEstrellas]    = useState(initialFilters.estrellas    ?? null);
  const [servicio_id,  setServicioId]   = useState(initialFilters.servicio_id  ?? null);
  const [fijo,         setFijo]         = useState(initialFilters.fijo         ?? null);
  const [emergencia,   setEmergencia]   = useState(initialFilters.emergencia   ?? null);
  const [distanciaMax, setDistanciaMax] = useState(initialFilters.distanciaMax ?? null);
  const [horarioDesde, setHorarioDesde] = useState(initialFilters.horarioDesde ?? '');
  const [horarioHasta, setHorarioHasta] = useState(initialFilters.horarioHasta ?? '');
  const [precioMin,    setPrecioMin]    = useState(initialFilters.precioMin    ?? '');
  const [precioMax,    setPrecioMax]    = useState(initialFilters.precioMax    ?? '');

  const handleReset = () => {
    setEstrellas(null); setServicioId(null); setFijo(null);
    setEmergencia(null); setDistanciaMax(null);
    setHorarioDesde(''); setHorarioHasta('');
    setPrecioMin(''); setPrecioMax('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetGrabber} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>FILTROS</Text>
              <Text style={styles.sheetTitle}>Filtrar búsqueda</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icons.Close />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.filterLabel}>Rating del cliente</Text>
            <StarSelector value={estrellas} onChange={setEstrellas} />

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Servicio</Text>
            <View style={styles.chipsWrap}>
              {SERVICIOS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, servicio_id === s.id && styles.chipActive]}
                  onPress={() => setServicioId(servicio_id === s.id ? null : s.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, servicio_id === s.id && styles.chipTextActive]}>{s.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Tipo de trabajo</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ label: 'Fijo', val: 'true' }, { label: 'Subasta', val: 'false' }].map((op) => (
                <TouchableOpacity
                  key={op.val}
                  style={[styles.chip, fijo === op.val && styles.chipActive]}
                  onPress={() => setFijo(fijo === op.val ? null : op.val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, fijo === op.val && styles.chipTextActive]}>{op.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Emergencia</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ label: 'Solo emergencias', val: 'true', icon: 'flash' }, { label: 'No urgente', val: 'false', icon: 'checkmark-circle-outline' }].map((op) => (
                <TouchableOpacity
                  key={op.val}
                  style={[styles.chip, styles.chipIconRow, emergencia === op.val && styles.chipActive]}
                  onPress={() => setEmergencia(emergencia === op.val ? null : op.val)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={op.icon} size={13} color={emergencia === op.val ? WHITE : 'rgba(255,255,255,0.6)'} />
                  <Text style={[styles.chipText, emergencia === op.val && styles.chipTextActive]}>{op.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Distancia máxima (km)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[5, 10, 20, 50].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, distanciaMax === String(d) && styles.chipActive]}
                  onPress={() => setDistanciaMax(distanciaMax === String(d) ? null : String(d))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, distanciaMax === String(d) && styles.chipTextActive]}>{d} km</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Horario requerido</Text>
            <View style={styles.timePickers}>
              <TimePicker label="Desde" value={horarioDesde} onChange={setHorarioDesde} />
              <TimePicker label="Hasta" value={horarioHasta} onChange={setHorarioHasta} />
            </View>

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Rango de precio ($)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                style={[styles.timeInputBox, { width: 100, fontSize: 14 }]}
                value={precioMin}
                onChangeText={setPrecioMin}
                placeholder="Mín"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="numeric"
              />
              <Text style={styles.timeSep}>—</Text>
              <TextInput
                style={[styles.timeInputBox, { width: 100, fontSize: 14 }]}
                value={precioMax}
                onChangeText={setPrecioMax}
                placeholder="Máx"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Restablecer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                onApply({ estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta, precioMin, precioMax });
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>Aplicar filtros</Text>
              <Ionicons name="arrow-forward" size={16} color={WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ───────────────────────────────────────────────────

export default function HomeTrabajador({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const idTrabajador = usuario?.idTrabajador;

  const franja = useMemo(() => obtenerFranjaHoraria(), []);
  const insets = useSafeAreaInsets();

  const navBarHeight = NAVBAR_BASE_HEIGHT + Math.max(insets.bottom, 10);
  const widgetBottomOffset = navBarHeight + WIDGET_GAP;

  const [disponible, setDisponible] = useState(true);
  const [cambiandoDisponibilidad, setCambiandoDisponibilidad] = useState(false);

  const [resumen, setResumen] = useState({ ganancias_hoy: 0, trabajos_completados: 0, rating: 0 });
  const [cargandoResumen, setCargandoResumen] = useState(true);

  const [tieneChatsSinLeer, setTieneChatsSinLeer] = useState(false);
  const [showTrabajoActivo, setShowTrabajoActivo] = useState(false);

  // ── Búsqueda + filtros, ahora embebidos en la Home ──────────────────────
  const [lastTexto, setLastTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(null);
  const [buscado, setBuscado] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    estrellas: null,
    servicio_id: null,
    fijo: null,
    emergencia: null,
    distanciaMax: null,
    horarioDesde: '',
    horarioHasta: '',
    precioMin: '',
    precioMax: '',
  });

  const activeFilterCount = [
    filters.estrellas,
    filters.servicio_id,
    filters.fijo,
    filters.emergencia,
    filters.distanciaMax,
    filters.horarioDesde || filters.horarioHasta,
    filters.precioMin || filters.precioMax,
  ].filter(Boolean).length;

  const chequearChatsSinLeer = useCallback(async () => {
    if (!idTrabajador || !usuario?.id) return;
    try {
      const resp = await fetch(`${API_URL}/chat/trabajador/${idTrabajador}?idUsuario=${usuario.id}`);
      if (!resp.ok) throw new Error('Respuesta no OK al chequear chats sin leer');
      const chats = await resp.json();
      setTieneChatsSinLeer(chats.some((c) => Number(c.no_leidos) > 0));
    } catch (err) {
      console.error('Error al chequear chats sin leer:', err);
    }
  }, [idTrabajador, usuario?.id]);

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

  useEffect(() => {
    cargarResumen();
    chequearChatsSinLeer();
  }, [cargarResumen, chequearChatsSinLeer]);

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
      setDisponible(!valor);
    } finally {
      setCambiandoDisponibilidad(false);
    }
  };

  const fetchResultados = useCallback(async (texto = '', overrideFilters = null) => {
    const f = overrideFilters ?? filters;
    const hayTexto = texto && texto.trim();
    const hayFiltros = f.estrellas || f.servicio_id || f.fijo || f.emergencia
      || f.distanciaMax || f.horarioDesde || f.horarioHasta
      || f.precioMin || f.precioMax;

    if (!hayTexto && !hayFiltros) {
      setBuscado(false);
      setResultados([]);
      return;
    }

    try {
      setBuscando(true);
      setErrorBusqueda(null);
      setBuscado(true);
      if (hayTexto) setLastTexto(texto);

      const params = new URLSearchParams();
      if (hayTexto) params.append('texto', texto.trim());
      if (f.estrellas) params.append('estrellas', f.estrellas);
      if (f.servicio_id) params.append('servicio_id', f.servicio_id);
      if (f.fijo) params.append('fijo', f.fijo);
      if (f.emergencia) params.append('emergencia', f.emergencia);
      if (f.distanciaMax) params.append('distanciaMax', f.distanciaMax);
      if (f.horarioDesde) params.append('horarioDesde', f.horarioDesde);
      if (f.horarioHasta) params.append('horarioHasta', f.horarioHasta);
      if (f.precioMin) params.append('precioMin', f.precioMin);
      if (f.precioMax) params.append('precioMax', f.precioMax);
      if (idTrabajador) params.append('idTrabajador', idTrabajador);

      const url = `${API_URL}/trabajador/buscarCliente?${params.toString()}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('No pudimos completar la búsqueda.');
      const data = await resp.json();
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al buscar:', err);
      setErrorBusqueda('No pudimos completar la búsqueda.');
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }, [filters, idTrabajador]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchResultados(lastTexto, newFilters);
  };

  const handleVerDetalles = (item) => {
    navigation?.navigate('DetalleOfertaTrabajador', { ofertaId: item.id, trabajadorId: idTrabajador });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
     <Header usuario={usuario} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
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

        {/* ── Resumen del día ───────────────────────────────────────── */}
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

        {/* ── Buscador con filtro embebido ─────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buscar trabajos</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Search onSearch={(t) => fetchResultados(t)} />
          </View>
          <TouchableOpacity
            style={[styles.filterIconBtn, activeFilterCount > 0 && styles.filterIconBtnActive]}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.85}
          >
            <Icons.Sliders color={activeFilterCount > 0 ? '#fff' : INDIGO} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Resultados de la búsqueda, mismas tarjetas que "Ofertas cercanas" ── */}
        {buscando ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={INDIGO} />
          </View>
        ) : errorBusqueda ? (
          <EstadoVacio icon="alert-circle-outline" texto={errorBusqueda} />
        ) : buscado && resultados.length === 0 ? (
          <EstadoVacio icon="search-outline" texto="No encontramos trabajos con esos criterios" />
        ) : buscado && resultados.length > 0 ? (
          <View style={styles.resultadosList}>
            <Text style={styles.resultCount}>
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
            </Text>
            {resultados.map((item) => (
              <ResultadoCard key={item.id} item={item} onVerDetalles={handleVerDetalles} />
            ))}
          </View>
        ) : null}

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

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />

      <BottomNavBarTrabajador
        usuario={usuario}
        pantallaActiva="inicio"
        tieneChatsSinLeer={tieneChatsSinLeer}
      />
    </SafeAreaView>
  );
}

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
  scrollContent: { paddingBottom: 190 },

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

  sectionHeader: {
    marginTop: 26, marginHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: { color: TEXT_DARK, fontWeight: '800', fontSize: 17 },

  // ── Buscador + botón de filtro ──────────────────────────────────────
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingRight: 16,
    gap: 8,
  },
  filterIconBtn: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  filterIconBtnActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  filterBadge: {
    position: 'absolute', top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: AMBER, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: BG,
  },
  filterBadgeText: { color: NAVY, fontSize: 9, fontWeight: '800' },

  resultCount: {
    color: TEXT_MUTED, fontSize: 12, fontWeight: '700',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  resultadosList: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  // ── Card de resultado ──────────────────────────────────────────────
  resCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  resAccentBar: { height: 4, width: '100%' },
  resCardEmergency: { borderColor: 'rgba(226,55,68,0.35)' },
  emergencyStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: RED, paddingVertical: 7,
  },
  emergencyStripText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  resCardBody: { padding: 18 },
  resCardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  resAvatarWrap: {
    padding: 2.5, borderRadius: 30, backgroundColor: BG,
    borderWidth: 1, borderColor: BORDER,
  },
  resAvatar: { width: 52, height: 52, borderRadius: 26 },
  resClienteNombre: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, letterSpacing: -0.2 },
  resChipsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  resChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: 'rgba(42,63,214,0.08)',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  resChipText: { fontSize: 11.5, fontWeight: '700', color: INDIGO },

  modBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  modBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  distanciaBadgeFloat: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(42,63,214,0.08)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginTop: 10,
  },
  distanciaBadgeText: { fontSize: 11.5, fontWeight: '700', color: INDIGO },

  resDescripcion: { fontSize: 12.5, color: TEXT_MUTED, marginTop: 10, lineHeight: 17.5 },

  resInfoRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    backgroundColor: BG, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 12,
  },
  resInfoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  resInfoIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(42,63,214,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  resInfoDivider: { width: 1, height: 28, backgroundColor: BORDER, marginHorizontal: 8 },
  resInfoLabel: { fontSize: 10.5, color: TEXT_MUTED, fontWeight: '600' },
  resInfoValor: { fontSize: 13, color: TEXT_DARK, fontWeight: '800', marginTop: 1 },

  resDetalleBtn: {
    marginTop: 14, borderRadius: 15, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 3,
  },
  resDetalleBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.1 },

  // ── Accesos rápidos ──────────────────────────────────────────────────
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

  // ── Modal de filtros ──────────────────────────────────────────────────
  overlay: { flex: 1, backgroundColor: 'rgba(9,13,35,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: NAVY_SOFT,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10,
    maxHeight: '90%',
  },
  sheetGrabber: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 16,
  },
  sheetEyebrow: { color: AMBER, fontSize: 10.5, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },

  filterLabel: { color: '#9AAAF5', fontSize: 12.5, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  starLabel: { color: '#c0ceff', fontSize: 12, marginLeft: 6 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  chipText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: WHITE, fontWeight: '700' },

  timePickers: { gap: 12, marginBottom: 6 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { color: WHITE, fontSize: 14, fontWeight: '600', width: 60 },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInputBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: WHITE, fontSize: 18, fontWeight: '700',
    textAlign: 'center', width: 54, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  timeSep: { color: WHITE, fontSize: 20, fontWeight: '800' },

  sheetFooter: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  resetBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center',
  },
  resetBtnText: { color: WHITE, fontWeight: '700', fontSize: 15 },
  applyBtn: {
    flex: 2, flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: INDIGO, alignItems: 'center', justifyContent: 'center',
    shadowColor: INDIGO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  applyBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },
});