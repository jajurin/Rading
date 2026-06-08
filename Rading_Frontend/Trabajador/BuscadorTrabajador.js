import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Image, SafeAreaView,
  Modal, ScrollView, TextInput,
} from "react-native";
import Svg, { Path } from 'react-native-svg';
import API_URL from "../configS";
import TrabajoActivoTrabajador from "./TrabajoActivoTrabajador";           // ← banner
import TrabajoActivoOverlayTrabajador from "./TrabajoActivoOverlayTrabajador"; // ← modal (corregido)
import Search from "./Search";
import RadarIcon from "../assets/RadarIcon";

// ─── Sub-components ──────────────────────────────────────────────────────────

const RatingBadge = ({ rating }) => (
  <View style={styles.ratingBadge}>
    <Text style={styles.ratingText}>{Number(rating).toFixed(2)}</Text>
    <Text style={styles.ratingStar}>★</Text>
  </View>
);

const ChatIcon = () => (
  <View style={styles.chatBubble}>
    <View style={styles.dotsRow}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  </View>
);

const SERVICIOS_MAP = {
  1: 'Electricista', 2: 'Plomero', 3: 'Jardinero', 4: 'Gasista',
  5: 'Limpieza', 6: 'Cerrajero', 7: 'Diseñador Gráfico', 8: 'Programador',
  9: 'Redactor', 10: 'Editor de Video', 11: 'Community Manager',
  12: 'Abogado', 13: 'Contador', 14: 'Arquitecto',
  15: 'Médico', 16: 'Psicólogo', 17: 'Ingeniero',
};

const ClienteCard = ({ item, onPressChat }) => (
  <View style={styles.card}>
    <TouchableOpacity activeOpacity={0.8}>
      <Image
        source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
        style={styles.avatar}
      />
    </TouchableOpacity>
    <View style={styles.cardBody}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.nombre} {item.apellido}</Text>
        <RatingBadge rating={item.estrellas ?? 0} />
      </View>
      {(item.especialidad || item.servicio_id) ? (
        <Text style={styles.cardTag}>
          🔧 {item.especialidad ?? SERVICIOS_MAP[item.servicio_id] ?? 'Sin especialidad'}
        </Text>
      ) : null}
      {item.horario_requerido ? (
        <Text style={styles.cardZona}>
          🕐 {item.horario_requerido}{item.horario_finalizado ? ` — ${item.horario_finalizado}` : ''}
        </Text>
      ) : null}
      {item.distancia != null ? (
        <Text style={styles.cardZona}>📍 {item.distancia} km</Text>
      ) : null}
      <View style={styles.cardFooterRow}>
        <View style={[styles.badge, item.fijo ? styles.badgeFijo : styles.badgeSubasta]}>
          <Text style={styles.badgeText}>{item.fijo ? 'Fijo' : 'Subasta'}</Text>
        </View>
        {item.fijo && item.precio != null && (
          <View style={styles.badgePrecio}>
            <Text style={styles.badgePrecioText}>${Number(item.precio).toLocaleString()}</Text>
          </View>
        )}
        {item.emergencia && (
          <View style={styles.badgeEmergencia}>
            <Text style={styles.badgeText}>Urgente</Text>
          </View>
        )}
      </View>
    </View>
    <TouchableOpacity style={styles.chatButton} onPress={() => onPressChat(item)} activeOpacity={0.8}>
      <ChatIcon />
    </TouchableOpacity>
  </View>
);

// ─── Star Rating Selector ─────────────────────────────────────────────────────

const StarSelector = ({ value, onChange }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(n => (
      <TouchableOpacity key={n} onPress={() => onChange(value === n ? null : n)} activeOpacity={0.7}>
        <Text style={[styles.starIcon, n <= (value ?? 0) && styles.starActive]}>★</Text>
      </TouchableOpacity>
    ))}
    {value ? <Text style={styles.starLabel}>+{value} estrellas</Text> : null}
  </View>
);

// ─── Time Picker ──────────────────────────────────────────────────────────────

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
          placeholderTextColor="#888"
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
          placeholderTextColor="#888"
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
    </View>
  );
};

// ─── Filter Modal ─────────────────────────────────────────────────────────────

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

const FilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [estrellas,    setEstrellas]    = useState(initialFilters.estrellas    ?? null)
  const [servicio_id,  setServicioId]   = useState(initialFilters.servicio_id  ?? null)
  const [fijo,         setFijo]         = useState(initialFilters.fijo         ?? null)
  const [emergencia,   setEmergencia]   = useState(initialFilters.emergencia   ?? null)
  const [distanciaMax, setDistanciaMax] = useState(initialFilters.distanciaMax ?? null)
  const [horarioDesde, setHorarioDesde] = useState(initialFilters.horarioDesde ?? '')
  const [horarioHasta, setHorarioHasta] = useState(initialFilters.horarioHasta ?? '')
  const [precioMin,    setPrecioMin]    = useState(initialFilters.precioMin    ?? '')
  const [precioMax,    setPrecioMax]    = useState(initialFilters.precioMax    ?? '')

  const handleReset = () => {
    setEstrellas(null); setServicioId(null); setFijo(null)
    setEmergencia(null); setDistanciaMax(null)
    setHorarioDesde(''); setHorarioHasta('')
    setPrecioMin(''); setPrecioMax('')
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Filtrar solicitudes</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.filterLabel}>Rating del cliente:</Text>
            <StarSelector value={estrellas} onChange={setEstrellas} />

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Servicio</Text>
            <View style={styles.chipsWrap}>
              {SERVICIOS.map(s => (
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

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Tipo de trabajo</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ label: 'Fijo', val: 'true' }, { label: 'Subasta', val: 'false' }].map(op => (
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

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Emergencia</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[{ label: '🚨 Solo emergencias', val: 'true' }, { label: 'No urgente', val: 'false' }].map(op => (
                <TouchableOpacity
                  key={op.val}
                  style={[styles.chip, emergencia === op.val && styles.chipActive]}
                  onPress={() => setEmergencia(emergencia === op.val ? null : op.val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, emergencia === op.val && styles.chipTextActive]}>{op.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Distancia máxima (km)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[5, 10, 20, 50].map(d => (
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

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Horario requerido</Text>
            <View style={styles.timePickers}>
              <TimePicker label="Desde" value={horarioDesde} onChange={setHorarioDesde} />
              <TimePicker label="Hasta" value={horarioHasta} onChange={setHorarioHasta} />
            </View>

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Rango de precio ($)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                style={[styles.timeInputBox, { width: 100, fontSize: 14 }]}
                value={precioMin}
                onChangeText={setPrecioMin}
                placeholder="Mín"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              <Text style={styles.timeSep}>—</Text>
              <TextInput
                style={[styles.timeInputBox, { width: 100, fontSize: 14 }]}
                value={precioMax}
                onChangeText={setPrecioMax}
                placeholder="Máx"
                placeholderTextColor="#888"
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
                onApply({ estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta, precioMin, precioMax })
                onClose()
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BuscadorTrabajador({ route, navigation  }) {              // ← agregado { route }
  const { usuario } = route.params;                                  // ← leer params
  const idTrabajador = usuario.idTrabajador;                         // ← id real

  const [showTrabajoActivo, setShowTrabajoActivo] = useState(false);
  const [clientes, setClientes]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [buscado, setBuscado]       = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [lastTexto, setLastTexto]   = useState('');

  const [filters, setFilters] = useState({
    estrellas:    null,
    servicio_id:  null,
    fijo:         null,
    emergencia:   null,
    distanciaMax: null,
    horarioDesde: '',
    horarioHasta: '',
    precioMin:    '',
    precioMax:    '',
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

  const fetchClientes = async (texto = '', overrideFilters = null) => {
    const f = overrideFilters ?? filters;
    const hayTexto   = texto && texto.trim();
    const hayFiltros = f.estrellas || f.servicio_id || f.fijo || f.emergencia
                    || f.distanciaMax || f.horarioDesde || f.horarioHasta
                    || f.precioMin || f.precioMax;

    if (!hayTexto && !hayFiltros) return;

    try {
      setLoading(true);
      setError(null);
      setBuscado(true);
      if (hayTexto) setLastTexto(texto);

      const params = new URLSearchParams();
      if (hayTexto)       params.append('texto',        texto.trim());
      if (f.estrellas)    params.append('estrellas',    f.estrellas);
      if (f.servicio_id)  params.append('servicio_id',  f.servicio_id);
      if (f.fijo)         params.append('fijo',         f.fijo);
      if (f.emergencia)   params.append('emergencia',   f.emergencia);
      if (f.distanciaMax) params.append('distanciaMax', f.distanciaMax);
      if (f.horarioDesde) params.append('horarioDesde', f.horarioDesde);
      if (f.horarioHasta) params.append('horarioHasta', f.horarioHasta);
      if (f.precioMin)    params.append('precioMin',    f.precioMin);
      if (f.precioMax)    params.append('precioMax',    f.precioMax);

      const url = `${API_URL}/trabajador/buscarCliente?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setClientes(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar los Trabajos');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchClientes(lastTexto, newFilters);
  };

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Buscar Trabajos</Text>
            <Text style={styles.headerSub}>Encontrá el cliente que necesitás</Text>
          </View>
          <TouchableOpacity
            style={[styles.filterIconBtn, activeFilterCount > 0 && styles.filterIconBtnActive]}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterIconText}>⚙</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Search onSearch={(t) => fetchClientes(t)} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1565D8" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.placeholderIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !buscado ? (
        <View style={styles.centerBox}>
          <Svg width={48} height={48} viewBox="0 0 512 512" fill="none">
            <Path
              fill="#A0AEC0"
              d="M252.78 20.875c-1.302.012-2.6.03-3.905.063-37.928.974-76.148 11.153-111.28 31.437C25.164 117.285-13.41 261.322 51.5 373.75s208.946 151.036 321.375 86.125c77.7-44.86 120.1-127.513 117.47-211.406-3.563 65.847-35.898 128.573-91 169.374-10.828 9.62-22.774 18.315-35.814 25.844-103.68 59.86-235.983 24.4-295.842-79.282-59.86-103.68-24.43-235.984 79.25-295.844 35.64-20.576 74.67-29.88 112.968-29.03 63.304 1.4 124.623 30.57 165.438 82.53l-32.594 23.032c-33.27-42.835-84.01-66.6-136.063-67-.96-.008-1.91-.012-2.875 0-.964.01-1.943.038-2.906.062-28.006.717-56.222 8.215-82.156 23.188-82.99 47.914-111.508 154.322-63.594 237.312 47.914 82.99 154.32 111.51 237.313 63.594 51.37-29.66 81.862-81.724 86.28-136.78-12.53 45.37-42.32 86.745-85.438 114.186-.02.013-.043.018-.062.03l-.344.22c-3.16 2.147-6.42 4.216-9.78 6.156-74.245 42.865-168.918 17.494-211.782-56.75-42.864-74.243-17.493-168.917 56.75-211.78 23.2-13.396 48.39-20.122 73.375-20.782 47.953-1.266 95.138 19.858 125.968 59.156l-39.844 28.156c-20.232-24.32-50.055-37.79-80.594-38.03-1.17-.01-2.33 0-3.5.03-17.035.432-34.176 4.995-49.938 14.094-50.435 29.12-67.806 93.877-38.687 144.313 29.12 50.434 93.908 67.806 144.344 38.686 21.245-12.267 36.623-30.85 45.124-52.03-18.815 21.064-44.364 36.888-73.938 44.155-.04.013-.084.02-.125.033-37.507 10.787-78.796-4.816-99.217-40.188-24.07-41.688-9.845-94.712 31.843-118.78 13.028-7.523 27.143-11.314 41.156-11.69 25.66-.685 50.898 10.098 68.188 30.25l-41 28.97c-5.497-4.796-12.664-7.72-20.53-7.72-17.277 0-31.283 14.007-31.283 31.282 0 17.276 14.004 31.282 31.282 31.282 17.277 0 31.28-14.007 31.28-31.283 0-1.187-.06-2.347-.188-3.5l120.094-57.312 4.03-1.75-.06-.156 62.25-29.72 9.25-4.438-5.282-8.812-19.97-33.375-5.155-8.625-8.25 5.813-8.095 5.718c-45.9-58.864-116.14-91.053-187.844-90.405z"
            />
          </Svg>
          <Text style={styles.placeholderText}>Escribí un nombre o aplicá filtros para buscar</Text>
        </View>
      ) : clientes.length === 0 ? (
        <View style={styles.centerBox}>
          <RadarIcon size={48} color="#A0AEC0" />
          <Text style={styles.placeholderText}>No se encontraron Trabajos</Text>
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {clientes.length} resultado{clientes.length !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <ClienteCard item={item} onPressChat={() => {}} />
          )}
        />
      )}

      <TrabajoActivoTrabajador
        onPress={() => setShowTrabajoActivo(true)}
        expanded={showTrabajoActivo}
      />

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

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const WHITE     = '#ffffff';
const GOLD      = '#ffd700';
const BLUE      = '#1565D8';
const BLUE_DARK = '#0a0f3c';
const BLUE_CARD = '#1e35b5';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FB' },

  header: { backgroundColor: BLUE, paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: WHITE, fontSize: 24, fontWeight: '800', marginBottom: 2 },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  filterIconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterIconBtnActive: { backgroundColor: WHITE },
  filterIconText: { fontSize: 20 },
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { color: BLUE_DARK, fontSize: 9, fontWeight: '800' },

  centerBox:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { color: '#A0AEC0', fontSize: 15, textAlign: 'center' },
  loadingText:     { color: BLUE, fontSize: 14, marginTop: 8 },
  errorText:       { color: '#E53E3E', fontSize: 14 },

  listContent:  { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  resultCount:  { color: '#A0AEC0', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: BLUE, borderRadius: 12,
    marginBottom: 10, padding: 12, gap: 10, elevation: 4,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#2a4fd6' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 },
  cardName: { color: WHITE, fontWeight: '700', fontSize: 15 },
  cardTag:  { color: WHITE, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  cardZona: { color: '#c0ceff', fontSize: 11, marginBottom: 3 },
  cardBio:  { color: '#dce4ff', fontSize: 12, lineHeight: 16 },

  cardFooterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeFijo:      { backgroundColor: '#5ec4ff' },
  badgeSubasta:   { backgroundColor: '#005f57' },
  badgeEmergencia:{ backgroundColor: '#ff0000', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText:      { color: WHITE, fontSize: 11, fontWeight: '700' },
  badgePrecio:    { backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgePrecioText:{ color: BLUE_DARK, fontSize: 11, fontWeight: '800' },

  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE_DARK, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, gap: 2 },
  ratingText:  { color: WHITE, fontSize: 11, fontWeight: '600' },
  ratingStar:  { color: GOLD, fontSize: 11 },

  chatButton: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  chatBubble: { width: 28, height: 22, backgroundColor: WHITE, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  dotsRow:    { flexDirection: 'row', gap: 3 },
  dot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: BLUE_CARD },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#12184a',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 8,
    maxHeight: '90%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  closeBtn:    { marginRight: 12, padding: 4 },
  closeBtnText: { color: WHITE, fontSize: 18, fontWeight: '600' },
  sheetTitle:  { color: WHITE, fontSize: 17, fontWeight: '800' },

  filterLabel: { color: '#8faeff', fontSize: 13, fontWeight: '600', marginBottom: 8 },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  starIcon:   { fontSize: 28, color: 'rgba(255,255,255,0.25)' },
  starActive: { color: GOLD },
  starLabel:  { color: '#c0ceff', fontSize: 12, marginLeft: 6 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent' },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  chipTextActive: { color: WHITE, fontWeight: '700' },

  timePickers:   { gap: 12, marginBottom: 6 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel:     { color: WHITE, fontSize: 14, fontWeight: '600', width: 60 },
  timeInputs:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInputBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: WHITE, fontSize: 18, fontWeight: '700',
    textAlign: 'center', width: 54, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  timeSep: { color: WHITE, fontSize: 20, fontWeight: '800' },

  sheetFooter: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center' },
  resetBtnText: { color: WHITE, fontWeight: '700', fontSize: 15 },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center' },
  applyBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },
});