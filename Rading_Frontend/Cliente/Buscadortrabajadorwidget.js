import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Modal, ScrollView, TextInput,
} from 'react-native';
import API_URL from '../configS';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

// ── Paleta ─────────────────────────────────────────────────────────────────
// Misma identidad que HomeCliente: índigo como color de marca, ámbar como
// único acento (rating, insignias), navy para superficies oscuras.
const WHITE      = '#ffffff';
const AMBER      = '#F5A623';
const INDIGO     = '#2A3FD6';
const INDIGO_SOFT = 'rgba(42,63,214,0.10)';
const NAVY       = '#0F1B4C';
const NAVY_SOFT  = '#161F52';
const TEXT_DARK  = '#12172E';
const TEXT_GRAY  = '#828AA0';
const BG_SOFT    = 'rgba(42,63,214,0.08)';
const BORDER     = 'rgba(15,27,76,0.08)';

// ─── Sub-components ──────────────────────────────────────────────────────────

const EstrellasRating = ({ valor = 0, size = 13 }) => {
  const estrellas = Math.max(0, Math.min(5, Number(valor) || 0));
  const llenas = Math.floor(estrellas);
  const decimal = estrellas - llenas;
  const media = decimal >= 0.25 && decimal < 0.75;
  const extraLlena = decimal >= 0.75;
  const totalLlenas = llenas + (extraLlena ? 1 : 0);
  const vacias = 5 - totalLlenas - (media ? 1 : 0);

  return (
    <View style={styles.starsRowMini}>
      {Array.from({ length: totalLlenas }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color={AMBER} />
      ))}
      {media && <Ionicons name="star-half" size={size} color={AMBER} />}
      {Array.from({ length: vacias }).map((_, i) => (
        <Ionicons key={`e${i}`} name="star-outline" size={size} color={AMBER} />
      ))}
      <Text style={styles.ratingNumero}>{estrellas.toFixed(1)}</Text>
    </View>
  );
};

const Avatar = ({ foto, nombre, apellido }) => {
  if (foto) {
    return <Image source={{ uri: foto }} style={styles.avatar} />;
  }
  const iniciales = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarIniciales}>{iniciales || '?'}</Text>
    </View>
  );
};

const ClienteCard = ({ item, onPressChat }) => (
  <View style={styles.card}>
    <Avatar foto={item.foto} nombre={item.nombre} apellido={item.apellido} />

    <View style={styles.cardBody}>
      <Text style={styles.cardName} numberOfLines={1}>
        {item.nombre} {item.apellido}
      </Text>

      <View style={styles.cardMetaRow}>
        <EstrellasRating valor={item.estrellas} />
        {item.distancia_km != null && (
          <View style={styles.distPill}>
            <Ionicons name="location" size={10} color={INDIGO} />
            <Text style={styles.distPillText}>{Number(item.distancia_km).toFixed(1)} km</Text>
          </View>
        )}
      </View>

      <View style={styles.contactRow}>
        <Ionicons name="mail-outline" size={12} color={TEXT_GRAY} />
        <Text style={styles.cardContacto} numberOfLines={1}>{item.email ?? 'Sin email'}</Text>
      </View>
      <View style={styles.contactRow}>
        <Ionicons name="call-outline" size={12} color={TEXT_GRAY} />
        <Text style={styles.cardContacto} numberOfLines={1}>{item.telefono ?? 'Sin teléfono'}</Text>
      </View>
    </View>

    <TouchableOpacity
      style={styles.chatButton}
      onPress={() => onPressChat?.(item)}
      activeOpacity={0.85}
    >
      <Ionicons name="chatbubble-ellipses" size={19} color={WHITE} />
    </TouchableOpacity>
  </View>
);

const StarSelector = ({ value, onChange }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(n => (
      <TouchableOpacity key={n} onPress={() => onChange(value === n ? null : n)} activeOpacity={0.7}>
        <Ionicons
          name={n <= (value ?? 0) ? 'star' : 'star-outline'}
          size={27}
          color={n <= (value ?? 0) ? AMBER : 'rgba(255,255,255,0.3)'}
        />
      </TouchableOpacity>
    ))}
    {value ? (
      <Text style={styles.starLabel}>+{value} estrellas</Text>
    ) : null}
  </View>
);

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
          placeholderTextColor="rgba(255,255,255,0.35)"
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.timeSep}>:</Text>
        <TextInput
          style={styles.timeInput}
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

const ESPECIALIDADES_POR_CATEGORIA = [
  {
    categoria: 'Hogar y oficios',
    servicios: [
      'Electrisista', 'Plomero', 'Jardinero', 'Gasista', 'Limpieza', 'Cerrajero',
      'Pintor', 'Carpintería', 'Mudanzas', 'Vidriero', 'Colocador de Pisos',
      'Tapicero', 'Herrero', 'Albañil', 'Service de Electrodomésticos',
      'Fumigador / Control de Plagas', 'Mantenimiento de Piletas',
      'Niñera', 'Cuidador de Adultos Mayores', 'Paseador de Perros',
    ],
  },
  {
    categoria: 'Digital y freelance',
    servicios: [
      'Diseñador Gráfico', 'Programador', 'Redactor',
      'Editor de Video', 'Community Manager',
    ],
  },
  {
    categoria: 'Profesionales',
    servicios: [
      'Abogado', 'Contador', 'Arquitecto', 'Médico', 'Psicólogo', 'Ingeniero',
    ],
  },
];

const FilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const [estrellas, setEstrellas]       = useState(initialFilters.estrellas ?? null);
  const [especialidad, setEspecialidad] = useState(initialFilters.especialidad ?? null);
  const [horarioDesde, setHorarioDesde] = useState(initialFilters.horarioDesde ?? '');
  const [horarioHasta, setHorarioHasta] = useState(initialFilters.horarioHasta ?? '');
  const [radioKm, setRadioKm]           = useState(initialFilters.radioKm ?? null);

  const handleApply = () => {
    onApply({ estrellas, especialidad, horarioDesde, horarioHasta, radioKm });
    onClose();
  };

  const handleReset = () => {
    setEstrellas(null);
    setEspecialidad(null);
    setHorarioDesde('');
    setHorarioHasta('');
    setRadioKm(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetGrabber} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>FILTROS</Text>
              <Text style={styles.sheetTitle}>Encontrá a tu profesional</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={WHITE} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

            <Text style={styles.filterLabel}>Valoración mínima</Text>
            <StarSelector value={estrellas} onChange={setEstrellas} />

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Especialidad</Text>

            {ESPECIALIDADES_POR_CATEGORIA.map(grupo => (
              <View key={grupo.categoria} style={{ marginBottom: 14 }}>
                <Text style={styles.categoriaLabel}>{grupo.categoria}</Text>
                <View style={styles.chipsWrap}>
                  {grupo.servicios.map(esp => (
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
              </View>
            ))}

            <Text style={[styles.filterLabel, { marginTop: 8 }]}>Horario disponible</Text>
            <View style={styles.timePickers}>
              <TimePicker label="Desde" value={horarioDesde} onChange={setHorarioDesde} />
              <TimePicker label="Hasta" value={horarioHasta} onChange={setHorarioHasta} />
            </View>
            <Text style={styles.timeHint}>
              El trabajador debe estar disponible en ese rango
            </Text>

            <Text style={[styles.filterLabel, { marginTop: 22 }]}>Distancia máxima</Text>
            <View style={styles.distanciaRow}>
              {[5, 10, 20, 50].map(km => (
                <TouchableOpacity
                  key={km}
                  style={[styles.chip, radioKm === km && styles.chipActive]}
                  onPress={() => setRadioKm(radioKm === km ? null : km)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, radioKm === km && styles.chipTextActive]}>{km} km</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.timeHint}>Ordena por cercanía a tu dirección registrada</Text>

          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Restablecer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Aplicar filtros</Text>
              <Ionicons name="arrow-forward" size={16} color={WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Widget principal ──────────────────────────────────────────────────────────

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
    radioKm: null,
  });

  const activeFilterCount = [
    filters.estrellas,
    filters.especialidad,
    filters.horarioDesde || filters.horarioHasta,
    filters.radioKm,
  ].filter(Boolean).length;

  const fetchTrabajadores = async (textoBusqueda = '', overrideFilters = null) => {
    const f = overrideFilters ?? filters;
    const hayTexto   = textoBusqueda && textoBusqueda.trim();
    const hayFiltros = f.estrellas || f.especialidad || f.horarioDesde || f.horarioHasta || f.radioKm;

    if (!hayTexto && !hayFiltros) return;

    try {
      setLoading(true);
      setError(null);
      setBuscado(true);

      const params = new URLSearchParams();
      if (hayTexto)              params.append('texto', textoBusqueda.trim());
      if (f.estrellas)           params.append('estrellas', f.estrellas);
      if (f.especialidad)        params.append('especialidad', f.especialidad);
      if (f.horarioDesde)        params.append('horarioDesde', f.horarioDesde);
      if (f.horarioHasta)        params.append('horarioHasta', f.horarioHasta);
      if (f.radioKm)             params.append('radioKm', f.radioKm);
      if (usuario?.lat != null)  params.append('lat', usuario.lat);
      if (usuario?.lng != null)  params.append('lng', usuario.lng);

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

  useImperativeHandle(ref, () => ({
    buscar: (nuevoTexto) => {
      setTexto(nuevoTexto);
      fetchTrabajadores(nuevoTexto);
    },
    buscarPorEspecialidad: (especialidad) => {
      const newFilters = { ...filters, especialidad };
      setFilters(newFilters);
      setTexto('');
      fetchTrabajadores('', newFilters);
    },
  }));

  return (
    <View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={TEXT_GRAY} />
          <TextInput
            style={styles.searchInput}
            placeholder="¿Qué necesitás? Ej: electricista"
            placeholderTextColor="#A0AEC0"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
          {texto.length > 0 && (
            <TouchableOpacity onPress={() => setTexto('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color="#C3CADA" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterIconBtn, activeFilterCount > 0 && styles.filterIconBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options" size={20} color={WHITE} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={INDIGO} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle" size={22} color="#E53E3E" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !buscado ? (
        <View style={styles.centerBox}>
          <Svg width={44} height={44} viewBox="0 0 512 512" fill="none">
            <Path
              fill="#C3CADA"
              d="M252.78 20.875c-1.302.012-2.6.03-3.905.063-37.928.974-76.148 11.153-111.28 31.437C25.164 117.285-13.41 261.322 51.5 373.75s208.946 151.036 321.375 86.125c77.7-44.86 120.1-127.513 117.47-211.406-3.563 65.847-35.898 128.573-91 169.374-10.828 9.62-22.774 18.315-35.814 25.844-103.68 59.86-235.983 24.4-295.842-79.282-59.86-103.68-24.43-235.984 79.25-295.844 35.64-20.576 74.67-29.88 112.968-29.03 63.304 1.4 124.623 30.57 165.438 82.53l-32.594 23.032c-33.27-42.835-84.01-66.6-136.063-67-.96-.008-1.91-.012-2.875 0-.964.01-1.943.038-2.906.062-28.006.717-56.222 8.215-82.156 23.188-82.99 47.914-111.508 154.322-63.594 237.312 47.914 82.99 154.32 111.51 237.313 63.594 51.37-29.66 81.862-81.724 86.28-136.78-12.53 45.37-42.32 86.745-85.438 114.186-.02.013-.043.018-.062.03l-.344.22c-3.16 2.147-6.42 4.216-9.78 6.156-74.245 42.865-168.918 17.494-211.782-56.75-42.864-74.243-17.493-168.917 56.75-211.78 23.2-13.396 48.39-20.122 73.375-20.782 47.953-1.266 95.138 19.858 125.968 59.156l-39.844 28.156c-20.232-24.32-50.055-37.79-80.594-38.03-1.17-.01-2.33 0-3.5.03-17.035.432-34.176 4.995-49.938 14.094-50.435 29.12-67.806 93.877-38.687 144.313 29.12 50.434 93.908 67.806 144.344 38.686 21.245-12.267 36.623-30.85 45.124-52.03-18.815 21.064-44.364 36.888-73.938 44.155-.04.013-.084.02-.125.033-37.507 10.787-78.796-4.816-99.217-40.188-24.07-41.688-9.845-94.712 31.843-118.78 13.028-7.523 27.143-11.314 41.156-11.69 25.66-.685 50.898 10.098 68.188 30.25l-41 28.97c-5.497-4.796-12.664-7.72-20.53-7.72-17.277 0-31.283 14.007-31.283 31.282 0 17.276 14.004 31.282 31.282 31.282 17.277 0 31.28-14.007 31.28-31.283 0-1.187-.06-2.347-.188-3.5l120.094-57.312 4.03-1.75-.06-.156 62.25-29.72 9.25-4.438-5.282-8.812-19.97-33.375-5.155-8.625-8.25 5.813-8.095 5.718c-45.9-58.864-116.14-91.053-187.844-90.405z"
            />
          </Svg>
          <Text style={styles.placeholderText}>Escribí un nombre o aplicá filtros para buscar</Text>
        </View>
      ) : clientes.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="search" size={20} color={INDIGO} />
          </View>
          <Text style={styles.placeholderText}>No se encontraron trabajadores</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          <Text style={styles.resultCount}>
            {clientes.length} resultado{clientes.length !== 1 ? 's' : ''}
          </Text>
          {clientes.map((item) => (
            <ClienteCard
              key={item.id.toString()}
              item={item}
              onPressChat={(trabajador) =>
                navigation?.navigate('ChatCliente', {
                  usuario,
                  contacto: {
                    idTrabajador: trabajador.id,
                    nombre: `${trabajador.nombre} ${trabajador.apellido}`.trim(),
                    servicio: undefined,
                    foto: trabajador.foto,
                    online: false,
                  },
                })
              }
            />
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

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, height: 52, paddingHorizontal: 16, gap: 10,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_DARK },
  filterIconBtn: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: INDIGO,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: INDIGO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 3,
  },
  filterIconBtnActive: { backgroundColor: NAVY },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: AMBER, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: WHITE,
  },
  filterBadgeText: { color: NAVY, fontSize: 9, fontWeight: '800' },
  centerBox: { justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 20 },
  errorIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(229,62,62,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderText: { color: '#A0AEC0', fontSize: 15, textAlign: 'center' },
  loadingText: { color: INDIGO, fontSize: 14, marginTop: 8, fontWeight: '600' },
  errorText: { color: '#E53E3E', fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingTop: 18 },
  resultCount: { color: TEXT_GRAY, fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 18,
    marginBottom: 10, padding: 12, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: BG_SOFT },
  avatarFallback: { backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center' },
  avatarIniciales: { color: WHITE, fontWeight: '800', fontSize: 17 },
  cardBody: { flex: 1, gap: 4 },
  cardName: { color: TEXT_DARK, fontWeight: '800', fontSize: 15 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 1 },
  starsRowMini: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  ratingNumero: { fontSize: 11.5, fontWeight: '700', color: TEXT_GRAY, marginLeft: 4 },
  distPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: INDIGO_SOFT, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  distPillText: { color: INDIGO, fontSize: 10.5, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardContacto: { color: TEXT_GRAY, fontSize: 12, flexShrink: 1 },
  chatButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: INDIGO,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: INDIGO, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(9,13,35,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: NAVY_SOFT, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10, maxHeight: '90%',
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
  categoriaLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  starLabel: { color: '#c0ceff', fontSize: 12, marginLeft: 6 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  chipText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: WHITE, fontWeight: '700' },
  timePickers: { gap: 12, marginBottom: 6 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { color: WHITE, fontSize: 14, fontWeight: '600', width: 60 },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', color: WHITE, fontSize: 18, fontWeight: '700',
    textAlign: 'center', width: 54, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  timeSep: { color: WHITE, fontSize: 20, fontWeight: '800' },
  timeHint: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 },
  distanciaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
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