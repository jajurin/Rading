import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Modal, ScrollView, TextInput,
} from 'react-native';
import API_URL from '../configS';
import Svg, { Path } from 'react-native-svg';

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

const ClienteCard = ({ item, onPressChat }) => (
  <View style={styles.card}>
    <TouchableOpacity activeOpacity={0.8}>
      <Image
        source={{ uri: item.foto ?? 'https://i.pravatar.cc/150?img=12' }}
        style={styles.avatar}
      />
    </TouchableOpacity>
    <View style={styles.cardBody}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.nombre} {item.apellido}</Text>
        <RatingBadge rating={item.estrellas ?? 0} />
      </View>
      <Text style={styles.cardZona}>📧 {item.email ?? '-'}</Text>
      <Text style={styles.cardBio} numberOfLines={2}>
        📞 {item.telefono ?? 'Sin teléfono'}
      </Text>
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
    {value ? (
      <Text style={styles.starLabel}>+{value} estrellas</Text>
    ) : null}
  </View>
);

// ─── Time Picker (simple HH:MM selector) ─────────────────────────────────────

const TimePicker = ({ label, value, onChange }) => {
  const [hour, minute] = value ? value.split(':') : ['', ''];

  const setHour = (h) => {
    const hh = h.replace(/[^0-9]/g, '').slice(0, 2);
    if (hh === '' || (Number(hh) >= 0 && Number(hh) <= 23)) {
      onChange(hh + ':' + (minute || '00'));
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
          style={styles.timeInput}
          value={hour}
          onChangeText={setHour}
          placeholder="HH"
          placeholderTextColor="#888"
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.timeSep}>:</Text>
        <TextInput
          style={styles.timeInput}
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

// ─── Filter Overlay ───────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  'Electrisista', 'Plomero', 'Jardinero', 'Gasista',
  'Limpieza', 'Cerrajero',
  'Diseñador Gráfico', 'Programador', 'Redactor',
  'Editor de Video', 'Community Manager',
  'Abogado', 'Contador', 'Arquitecto',
  'Médico', 'Psicólogo', 'Ingeniero',
];

const FilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [estrellas, setEstrellas]       = useState(initialFilters.estrellas ?? null);
  const [especialidad, setEspecialidad] = useState(initialFilters.especialidad ?? null);
  const [horarioDesde, setHorarioDesde] = useState(initialFilters.horarioDesde ?? '');
  const [horarioHasta, setHorarioHasta] = useState(initialFilters.horarioHasta ?? '');

  const handleApply = () => {
    onApply({ estrellas, especialidad, horarioDesde, horarioHasta });
    onClose();
  };

  const handleReset = () => {
    setEstrellas(null);
    setEspecialidad(null);
    setHorarioDesde('');
    setHorarioHasta('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>Filtrar Hogar (cliente)</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

            {/* Rating */}
            <Text style={styles.filterSection}>Ordenado por:</Text>
            <Text style={styles.filterLabel}>Rating:</Text>
            <StarSelector value={estrellas} onChange={setEstrellas} />

            {/* Especialidad */}
            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Especialidad</Text>
            <View style={styles.chipsWrap}>
              {ESPECIALIDADES.map(esp => (
                <TouchableOpacity
                  key={esp}
                  style={[styles.chip, especialidad === esp && styles.chipActive]}
                  onPress={() => setEspecialidad(especialidad === esp ? null : esp)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, especialidad === esp && styles.chipTextActive]}>
                    {esp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Horario */}
            <Text style={[styles.filterLabel, { marginTop: 18, color: '#1565D8' }]}>Horario disponible</Text>
            <View style={styles.timePickers}>
              <TimePicker label="Desde" value={horarioDesde} onChange={setHorarioDesde} />
              <TimePicker label="Hasta" value={horarioHasta} onChange={setHorarioHasta} />
            </View>
            <Text style={styles.timeHint}>
              El trabajador debe estar disponible en ese rango
            </Text>

            {/* Distancia */}
            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Distancia máxima</Text>
            <View style={styles.distanciaRow}>
              {[5, 10, 20, 50].map(km => (
                <TouchableOpacity
                  key={km}
                  style={[styles.chip, styles.chipDistancia]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{km} km</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.timeHint}>Próximamente disponible</Text>

          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Restablecer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Widget principal ──────────────────────────────────────────────────────────
// Reutilizable: se puede meter dentro de un ScrollView (ej. HomeCliente) o
// usar como pantalla completa (ej. BuscadorTrabajador). No usa FlatList
// a propósito, para poder vivir dentro de otro ScrollView sin el warning
// de "VirtualizedLists should never be nested inside plain ScrollViews".
//
// Expone un ref con `buscar(texto)` para poder dispararlo desde afuera
// (por ejemplo, al tocar una categoría en la Home).

const BuscadorTrabajadorWidget = forwardRef(function BuscadorTrabajadorWidget(
  { usuario, navigation, initialTexto = '' },
  ref
) {
  const [texto, setTexto]           = useState(initialTexto);
  const [clientes, setClientes]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [buscado, setBuscado]       = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    estrellas: null,
    especialidad: null,
    horarioDesde: '',
    horarioHasta: '',
  });

  const activeFilterCount = [
    filters.estrellas,
    filters.especialidad,
    filters.horarioDesde || filters.horarioHasta,
  ].filter(Boolean).length;

  const fetchTrabajadores = async (textoBusqueda = '', overrideFilters = null) => {
    const f = overrideFilters ?? filters;
    const hayTexto   = textoBusqueda && textoBusqueda.trim();
    const hayFiltros = f.estrellas || f.especialidad || f.horarioDesde || f.horarioHasta;

    if (!hayTexto && !hayFiltros) return;

    try {
      setLoading(true);
      setError(null);
      setBuscado(true);

      const params = new URLSearchParams();
      if (hayTexto)       params.append('texto', textoBusqueda.trim());
      if (f.estrellas)    params.append('estrellas', f.estrellas);
      if (f.especialidad) params.append('especialidad', f.especialidad);
      if (f.horarioDesde) params.append('horarioDesde', f.horarioDesde);
      if (f.horarioHasta) params.append('horarioHasta', f.horarioHasta);

      const url = `${API_URL}/cliente/buscarTrabajador?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setClientes(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar los trabajadores');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchTrabajadores(texto, newFilters);
  };

  const handleSubmit = () => fetchTrabajadores(texto);

  // Permite disparar una búsqueda desde afuera, ej: buscadorRef.current.buscar('Plomero')
useImperativeHandle(ref, () => ({
  buscar: (nuevoTexto) => {
    setTexto(nuevoTexto);
    fetchTrabajadores(nuevoTexto);
  },
  // ← NUEVO: busca por especialidad (filtro), no por texto libre
  buscarPorEspecialidad: (especialidad) => {
    const newFilters = { ...filters, especialidad };
    setFilters(newFilters);
    setTexto('');
    fetchTrabajadores('', newFilters);
  },
}));

  return (
    <View>
      {/* Search + Filtro, uno al lado del otro */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="¿Qué necesitás? Ej: electricista"
            placeholderTextColor="#A0AEC0"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
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

      {/* Resultados */}
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
          <Svg width={44} height={44} viewBox="0 0 512 512" fill="none">
            <Path
              fill="#A0AEC0"
              d="M252.78 20.875c-1.302.012-2.6.03-3.905.063-37.928.974-76.148 11.153-111.28 31.437C25.164 117.285-13.41 261.322 51.5 373.75s208.946 151.036 321.375 86.125c77.7-44.86 120.1-127.513 117.47-211.406-3.563 65.847-35.898 128.573-91 169.374-10.828 9.62-22.774 18.315-35.814 25.844-103.68 59.86-235.983 24.4-295.842-79.282-59.86-103.68-24.43-235.984 79.25-295.844 35.64-20.576 74.67-29.88 112.968-29.03 63.304 1.4 124.623 30.57 165.438 82.53l-32.594 23.032c-33.27-42.835-84.01-66.6-136.063-67-.96-.008-1.91-.012-2.875 0-.964.01-1.943.038-2.906.062-28.006.717-56.222 8.215-82.156 23.188-82.99 47.914-111.508 154.322-63.594 237.312 47.914 82.99 154.32 111.51 237.313 63.594 51.37-29.66 81.862-81.724 86.28-136.78-12.53 45.37-42.32 86.745-85.438 114.186-.02.013-.043.018-.062.03l-.344.22c-3.16 2.147-6.42 4.216-9.78 6.156-74.245 42.865-168.918 17.494-211.782-56.75-42.864-74.243-17.493-168.917 56.75-211.78 23.2-13.396 48.39-20.122 73.375-20.782 47.953-1.266 95.138 19.858 125.968 59.156l-39.844 28.156c-20.232-24.32-50.055-37.79-80.594-38.03-1.17-.01-2.33 0-3.5.03-17.035.432-34.176 4.995-49.938 14.094-50.435 29.12-67.806 93.877-38.687 144.313 29.12 50.434 93.908 67.806 144.344 38.686 21.245-12.267 36.623-30.85 45.124-52.03-18.815 21.064-44.364 36.888-73.938 44.155-.04.013-.084.02-.125.033-37.507 10.787-78.796-4.816-99.217-40.188-24.07-41.688-9.845-94.712 31.843-118.78 13.028-7.523 27.143-11.314 41.156-11.69 25.66-.685 50.898 10.098 68.188 30.25l-41 28.97c-5.497-4.796-12.664-7.72-20.53-7.72-17.277 0-31.283 14.007-31.283 31.282 0 17.276 14.004 31.282 31.282 31.282 17.277 0 31.28-14.007 31.28-31.283 0-1.187-.06-2.347-.188-3.5l120.094-57.312 4.03-1.75-.06-.156 62.25-29.72 9.25-4.438-5.282-8.812-19.97-33.375-5.155-8.625-8.25 5.813-8.095 5.718c-45.9-58.864-116.14-91.053-187.844-90.405z"
            />
          </Svg>
          <Text style={styles.placeholderText}>Escribí un nombre o aplicá filtros para buscar</Text>
        </View>
      ) : clientes.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.placeholderText}>No se encontraron trabajadores</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          <Text style={styles.resultCount}>
            {clientes.length} resultado{clientes.length !== 1 ? 's' : ''}
          </Text>
          {clientes.map((item) => (
            <ClienteCard key={item.id.toString()} item={item} onPressChat={() => {}} />
          ))}
        </View>
      )}

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </View>
  );
});

export default BuscadorTrabajadorWidget;

// ─── Styles ───────────────────────────────────────────────────────────────────

const WHITE     = '#ffffff';
const GOLD      = '#ffd700';
const BLUE      = '#1565D8';
const BLUE_DARK = '#0a0f3c';
const BLUE_CARD = '#1e35b5';

const styles = StyleSheet.create({
  // Search + filtro
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    height: 52,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A202C' },

  filterIconBtn: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  filterIconBtnActive: { backgroundColor: BLUE_DARK },
  filterIconText: { fontSize: 20, color: WHITE },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: WHITE,
  },
  filterBadgeText: { color: BLUE_DARK, fontSize: 9, fontWeight: '800' },

  // States
  centerBox:       { justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 20 },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { color: '#A0AEC0', fontSize: 15, textAlign: 'center' },
  loadingText:     { color: BLUE, fontSize: 14, marginTop: 8 },
  errorText:       { color: '#E53E3E', fontSize: 14 },

  // List
  listContent:  { paddingHorizontal: 16, paddingTop: 18 },
  resultCount:  { color: '#A0AEC0', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Card
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE, borderRadius: 12, marginBottom: 10, padding: 12, gap: 10, elevation: 4 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#2a4fd6' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 },
  cardName: { color: WHITE, fontWeight: '700', fontSize: 15 },
  cardZona: { color: '#c0ceff', fontSize: 11, marginBottom: 3 },
  cardBio:  { color: '#dce4ff', fontSize: 12, lineHeight: 16 },

  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE_DARK, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, gap: 2 },
  ratingText:  { color: WHITE, fontSize: 11, fontWeight: '600' },
  ratingStar:  { color: GOLD, fontSize: 11 },

  chatButton: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  chatBubble: { width: 28, height: 22, backgroundColor: WHITE, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  dotsRow:    { flexDirection: 'row', gap: 3 },
  dot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: BLUE_CARD },

  // Modal overlay
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

  filterSection: { color: WHITE, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  filterLabel:   { color: '#8faeff', fontSize: 13, fontWeight: '600', marginBottom: 8 },

  // Stars
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  starIcon:   { fontSize: 28, color: 'rgba(255,255,255,0.25)' },
  starActive: { color: GOLD },
  starLabel:  { color: '#c0ceff', fontSize: 12, marginLeft: 6 },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent' },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  chipTextActive: { color: WHITE, fontWeight: '700' },

  // Time pickers
  timePickers: { gap: 12, marginBottom: 6 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { color: WHITE, fontSize: 14, fontWeight: '600', width: 60 },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: WHITE, fontSize: 18, fontWeight: '700',
    textAlign: 'center', width: 54, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  timeSep:   { color: WHITE, fontSize: 20, fontWeight: '800' },
  timeHint:  { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 },
  distanciaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chipDistancia: { opacity: 0.4 },

  // Footer
  sheetFooter: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center' },
  resetBtnText: { color: WHITE, fontWeight: '700', fontSize: 15 },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center' },
  applyBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },
});