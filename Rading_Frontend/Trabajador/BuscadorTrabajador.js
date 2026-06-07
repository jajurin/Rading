import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Image, SafeAreaView,
  Modal, ScrollView, TextInput,
} from "react-native";
import API_URL from "../configS";
import TrabajoActivoTrabajador from "./TrabajoActivoTrabajador";
import Search from "./Search";

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
        source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
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

const CATEGORIAS = [
  'Electrisista', 'Plomero', 'Jardinero', 'Gasista',
  'Limpieza', 'Cerrajero', 'Diseñador Gráfico', 'Programador',
  'Redactor', 'Editor de Video', 'Community Manager',
  'Abogado', 'Contador', 'Arquitecto', 'Médico', 'Psicólogo', 'Ingeniero',
];

const FilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [estrellas,    setEstrellas]    = useState(initialFilters.estrellas    ?? null)
  const [categoria,    setCategoria]    = useState(initialFilters.categoria    ?? null)
  const [fijo,         setFijo]         = useState(initialFilters.fijo         ?? null)
  const [emergencia,   setEmergencia]   = useState(initialFilters.emergencia   ?? null)
  const [distanciaMax, setDistanciaMax] = useState(initialFilters.distanciaMax ?? null)
  const [horarioDesde, setHorarioDesde] = useState(initialFilters.horarioDesde ?? '')
  const [horarioHasta, setHorarioHasta] = useState(initialFilters.horarioHasta ?? '')

  const handleReset = () => {
    setEstrellas(null); setCategoria(null); setFijo(null)
    setEmergencia(null); setDistanciaMax(null)
    setHorarioDesde(''); setHorarioHasta('')
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

            <Text style={[styles.filterLabel, { marginTop: 18 }]}>Categoría</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, categoria === cat && styles.chipActive]}
                  onPress={() => setCategoria(categoria === cat ? null : cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, categoria === cat && styles.chipTextActive]}>{cat}</Text>
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
              <TimePicker label="Hasta"  value={horarioHasta} onChange={setHorarioHasta} />
            </View>

          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Restablecer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                onApply({ estrellas, categoria, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta })
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

export default function BuscadorCliente() {
  const [clientes, setClientes]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [buscado, setBuscado]       = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [lastTexto, setLastTexto]   = useState('');

  const [filters, setFilters] = useState({
    estrellas: null,
    categoria: null,
    fijo: null,
    emergencia: null,
    distanciaMax: null,
    horarioDesde: '',
    horarioHasta: '',
  });

  const activeFilterCount = [
    filters.estrellas,
    filters.categoria,
    filters.fijo,
    filters.emergencia,
    filters.distanciaMax,
    filters.horarioDesde || filters.horarioHasta,
  ].filter(Boolean).length;

  const fetchClientes = async (texto = '', overrideFilters = null) => {
    const f = overrideFilters ?? filters;
    const hayTexto   = texto && texto.trim();
    const hayFiltros = f.estrellas || f.categoria || f.fijo || f.emergencia || f.distanciaMax || f.horarioDesde || f.horarioHasta;

    if (!hayTexto && !hayFiltros) return;

    try {
      setLoading(true);
      setError(null);
      setBuscado(true);
      if (hayTexto) setLastTexto(texto);

      const params = new URLSearchParams();
      if (hayTexto)       params.append('texto', texto.trim());
      if (f.estrellas)    params.append('estrellas', f.estrellas);
      if (f.categoria)    params.append('categoria', f.categoria);
      if (f.fijo)         params.append('fijo', f.fijo);
      if (f.emergencia)   params.append('emergencia', f.emergencia);
      if (f.distanciaMax) params.append('distanciaMax', f.distanciaMax);
      if (f.horarioDesde) params.append('horarioDesde', f.horarioDesde);
      if (f.horarioHasta) params.append('horarioHasta', f.horarioHasta);

      const url = `${API_URL}/trabajador/buscarCliente?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setClientes(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar los clientes');
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
            <Text style={styles.headerTitle}>Buscar Clientes</Text>
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
          <Text style={styles.placeholderIcon}>🔍</Text>
          <Text style={styles.placeholderText}>Escribí un nombre o aplicá filtros para buscar</Text>
        </View>
      ) : clientes.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.placeholderIcon}>😕</Text>
          <Text style={styles.placeholderText}>No se encontraron clientes</Text>
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

      <TrabajoActivoTrabajador />

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