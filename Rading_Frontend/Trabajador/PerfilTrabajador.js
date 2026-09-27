import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Switch,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import Header from '../Header';
import BottomNavBarTrabajador from './Navegadortrabajador';
import API_URL from '../configS';
import { useTheme } from '../ThemeContext';

/* ==================================================================== */
/*  TOKENS                                                              */
/* ==================================================================== */
const RADIUS_MD = 14;
const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const NAVY = '#0A1230';
const AMBER = '#F5A623';
const DANGER = '#E5484D';
const TEAL = '#0EA5A0';
const TEAL_DEEP = '#0B8580';
const WHITE = '#FFFFFF';
const BG = '#F2F4FC';
const GRAY_TEXT = '#5C6478';
const GRAY_SOFT = '#8A90A6';
const CARD_BORDER = 'rgba(61,78,234,0.12)';
const CHIP_OFF_BG = '#EDEFF7';
const CHIP_OFF_BORDER = '#DFE3F2';
const TEAL_BG = 'rgba(14,165,160,0.10)';
const TEAL_BORDER = 'rgba(14,165,160,0.25)';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_NOMBRE = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function partirTituloDetalle(item) {
  const idx = item.indexOf(':');
  if (idx === -1) return { titulo: item, detalle: '' };
  return { titulo: item.slice(0, idx).trim(), detalle: item.slice(idx + 1).trim() };
}

const ICONOS_APTITUD = [
  { match: /fuga|ultrason/i, icon: 'search-outline' },
  { match: /termotanque|calefón|caldera|gas/i, icon: 'flame-outline' },
  { match: /griferí|canilla|grifer/i, icon: 'water-outline' },
  { match: /destape|cañer|desagü/i, icon: 'construct-outline' },
  { match: /eléctric|instalaci/i, icon: 'flash-outline' },
];
function iconoParaAptitud(texto) {
  const hit = ICONOS_APTITUD.find((r) => r.match.test(texto));
  return hit ? hit.icon : 'checkmark-circle-outline';
}

/* ------------------------------------------------------------------ */
/*  Pantalla principal                                                 */
/* ------------------------------------------------------------------ */

const PERFIL_VACIO = {
  categoria: '',
  nombre: '',
  ubicacion: '',
  foto: null,
  portada: null,

  identidadVerificada: false,
  antecedentesVerificados: false,
  matricula: '',
  matriculaVerificada: false,
  seguroVigente: false,

  tiempoRespuesta: '',
  tasaAceptacion: 0,
  añosExperiencia: 0,
  trabajosRealizados: 0,
  calificacion: 0,
  cantidadResenas: 0,

  tarifaDesde: '',

  descripcion: '',

  servicios: [],

  zonaCobertura: [],

  disponibilidad: [],
  horarioAtencion: '',
  atiendeEmergencias: false,

  idiomas: [],
  metodosPago: [],

  educacion: [],
  experiencia: [],
  aptitudes: [],

  portfolio: [],

  resenas: [],
};

function parsearJson(valor, fallback) {
  if (valor == null) return fallback;
  if (Array.isArray(valor)) return valor;
  try {
    const p = JSON.parse(valor);
    return Array.isArray(p) ? p : fallback;
  } catch {
    return fallback;
  }
}

function parsearLista(valor, separador) {
  if (!valor) return [];
  return String(valor)
    .split(separador)
    .map((x) => x.trim())
    .filter(Boolean);
}

function mapearPerfilTrabajador(db) {
  if (!db) return PERFIL_VACIO;
  return {
    ...PERFIL_VACIO,
    categoria: db.categoria ?? '',
    nombre: `${db.nombre ?? ''} ${db.apellido ?? ''}`.trim(),
    ubicacion: db.direccion ?? '',
    foto: db.foto ?? null,
    portada: db.portada ?? null,

    identidadVerificada: db.identidadVerificada ?? false,
    antecedentesVerificados: db.antecedentesVerificados ?? false,
    matricula: db.matricula ?? '',
    matriculaVerificada: db.matriculaVerificada ?? false,
    seguroVigente: db.seguroVigente ?? false,

    tiempoRespuesta: db.tiempoRespuesta ?? '',
    tasaAceptacion: db.tasaAceptacion ?? 0,
    añosExperiencia: db.añosExperiencia ?? 0,
    trabajosRealizados: db.trabajosRealizados ?? 0,
    calificacion: db.estrellas ?? 0,
    cantidadResenas: db.reseñasRec ?? 0,

    tarifaDesde: db.tarifaDesde != null ? String(db.tarifaDesde) : '',

    descripcion: db.descripcion ?? '',

    servicios: (db.servicios ?? []).map((s) => ({
      id: s.id,
      nombre: s.nombre ?? '',
      precio: s.precio != null ? String(s.precio) : '',
    })),

    zonaCobertura: parsearLista(db.zonaTrabajo, ','),

    disponibilidad: parsearJson(db.disponibilidad, []),
    horarioAtencion:
      db.DispComienzo && db.DispFinal ? `${db.DispComienzo} a ${db.DispFinal} hs` : '',
    atiendeEmergencias: db.atiendeEmergencias ?? false,

    idiomas: parsearJson(db.idiomas, []),
    metodosPago: parsearJson(db.metodosPago, []),

    educacion: parsearJson(db.educacion, []),
    experiencia: parsearJson(db.experiencia, []),
    aptitudes: parsearJson(db.aptitudes, []),

    portfolio: parsearJson(db.portfolio, []),

    resenas: (db.resenas ?? []).map((r) => ({
      nombre: `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim(),
      comentario: r.descripcion ?? r.razon ?? '',
      estrellas: r.estrellas ?? 0,
    })),
  };
}

export default function PerfilTrabajador(props) {
  const { colors, isDark } = useTheme();
  const usuario = props.usuario ?? props.route?.params?.usuario;
  const navigation = props.navigation ?? null;
  const { perfilInicial, onGuardarPerfil } = props;
  const idTrabajador = usuario?.idTrabajador ?? usuario?.id ?? null;

  const irAEditarDatos = () =>
    navigation?.navigate?.('EditarDatosPersonales', { tipo: 'trabajador', usuario });

  const [perfil, setPerfil] = useState({ ...PERFIL_VACIO, ...perfilInicial });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [modal, setModal] = useState({ visible: false, campo: null, tipo: 'texto', titulo: '' });

  // ── Animación de rotación para el ícono de carga ──
  const spinValue = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    if (!cargando) return;
    spinValue.setValue(0);
    const animacion = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );
    animacion.start();
    return () => animacion.stop();
  }, [cargando]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    if (idTrabajador == null) {
      setPerfil({ ...PERFIL_VACIO, ...perfilInicial });
      setCargando(false);
      return;
    }
    try {
      const resp = await fetch(`${API_URL}/trabajador/perfil/${idTrabajador}`);
      if (!resp.ok) throw new Error(`No se pudo cargar el perfil (HTTP ${resp.status})`);
      const db = await resp.json();
      setPerfil({ ...perfilInicial, ...mapearPerfilTrabajador(db) });
    } catch (e) {
      setErrorCarga(e.message || 'No se pudo cargar el perfil');
    } finally {
      setCargando(false);
    }
  }, [idTrabajador]);

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [cargarPerfil])
  );

  const persistirPerfil = async (perfilActualizado) => {
    if (idTrabajador == null) return;
    const payload = {
      descripcion: perfilActualizado.descripcion,
      zonaCobertura: perfilActualizado.zonaCobertura,
      foto: perfilActualizado.foto,
      portada: perfilActualizado.portada,
      matricula: perfilActualizado.matricula,
      tarifaDesde: perfilActualizado.tarifaDesde,
      tiempoRespuesta: perfilActualizado.tiempoRespuesta,
      tasaAceptacion: perfilActualizado.tasaAceptacion,
      añosExperiencia: perfilActualizado.añosExperiencia,
      identidadVerificada: perfilActualizado.identidadVerificada,
      antecedentesVerificados: perfilActualizado.antecedentesVerificados,
      matriculaVerificada: perfilActualizado.matriculaVerificada,
      seguroVigente: perfilActualizado.seguroVigente,
      atiendeEmergencias: perfilActualizado.atiendeEmergencias,
      idiomas: perfilActualizado.idiomas,
      metodosPago: perfilActualizado.metodosPago,
      educacion: perfilActualizado.educacion,
      experiencia: perfilActualizado.experiencia,
      aptitudes: perfilActualizado.aptitudes,
      portfolio: perfilActualizado.portfolio,
      disponibilidad: perfilActualizado.disponibilidad,
      horarioAtencion: perfilActualizado.horarioAtencion,
      servicios: perfilActualizado.servicios.map((s) => ({ ...s })),
    };
    try {
      const resp = await fetch(`${API_URL}/trabajador/perfil/${idTrabajador}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || `Error ${resp.status} al guardar`);
      }
    } catch (e) {
      Alert.alert('No se pudo guardar el cambio', e.message);
    }
  };

  const abrirEdicion = (campo, tipo, titulo) => {
    setModal({ visible: true, campo, tipo, titulo });
  };

  const cerrarModal = () => setModal((m) => ({ ...m, visible: false }));

  const actualizarCampo = (campo, valorNuevo) => {
    const actualizado = { ...perfil, [campo]: valorNuevo };
    setPerfil(actualizado);
    onGuardarPerfil?.(actualizado, campo, valorNuevo);
    persistirPerfil(actualizado);
  };

  const guardarCampo = (valorNuevo) => {
    actualizarCampo(modal.campo, valorNuevo);
    cerrarModal();
  };

  /* ---------------- Fotos (avatar / portada) ---------------- */

  const elegirFoto = (destino) => {
    Alert.alert(
      destino === 'portada' ? 'Foto de portada' : 'Foto de perfil',
      'Elegí una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Elegir de galería', onPress: () => seleccionarDeGaleria(destino) },
        { text: 'Tomar foto', onPress: () => tomarFoto(destino) },
      ]
    );
  };

  const seleccionarDeGaleria = async (destino) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para continuar.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: destino === 'portfolio',
      allowsEditing: destino !== 'portfolio',
      aspect: destino === 'portada' ? [16, 9] : [1, 1],
      quality: 0.85,
    });
    if (resultado.canceled) return;

    if (destino === 'portfolio') {
      const nuevas = resultado.assets?.map((a) => a.uri) ?? [];
      actualizarCampo('portfolio', [...perfil.portfolio, ...nuevas]);
    } else if (resultado.assets?.[0]?.uri) {
      actualizarCampo(destino, resultado.assets[0].uri);
    }
  };

  const tomarFoto = async (destino) => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara para continuar.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: destino !== 'portfolio',
      aspect: destino === 'portada' ? [16, 9] : [1, 1],
      quality: 0.85,
    });
    if (!resultado.canceled && resultado.assets?.[0]?.uri) {
      if (destino === 'portfolio') {
        actualizarCampo('portfolio', [...perfil.portfolio, resultado.assets[0].uri]);
      } else {
        actualizarCampo(destino, resultado.assets[0].uri);
      }
    }
  };

  const quitarFotoPortfolio = (idx) => {
    actualizarCampo('portfolio', perfil.portfolio.filter((_, i) => i !== idx));
  };

  /* ---------------- valor actual para el modal abierto ---------------- */

  const valorInicialModal = (() => {
    switch (modal.campo) {
      case 'tarifaDesde':
        return perfil.tarifaDesde;
      case 'matricula':
        return perfil.matricula;
      case 'descripcion':
        return perfil.descripcion;
      case 'disponibilidad':
        return perfil.disponibilidad;
      case 'horarioAtencion':
        return perfil.horarioAtencion;
      case 'servicios':
        return perfil.servicios;
      case 'zonaCobertura':
        return perfil.zonaCobertura;
      case 'idiomas':
        return perfil.idiomas;
      case 'metodosPago':
        return perfil.metodosPago;
      case 'educacion':
        return perfil.educacion;
      case 'experiencia':
        return perfil.experiencia;
      case 'aptitudes':
        return perfil.aptitudes;
      default:
        return null;
    }
  })();

  const diasTexto = perfil.disponibilidad.length
    ? perfil.disponibilidad.map((d) => DIAS_NOMBRE[d]).join(' · ')
    : 'Sin días cargados';

  // Componentes movidos dentro del componente principal
  const EditButton = ({ onPress, size = 14, style }) => (
    <TouchableOpacity
      style={[styles.editBtn, style]}
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="pencil" size={size} color={INDIGO_DEEP} />
    </TouchableOpacity>
  );

  const Estrellas = ({ valor = 0, size = 16 }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= Math.round(valor) ? 'star' : 'star-outline'}
          size={size}
          color={AMBER}
        />
      ))}
    </View>
  );

  const SeccionCard = ({ titulo, onEditar, children, style, subtitulo }) => (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.cardSubtitulo}>{subtitulo}</Text> : null}
        </View>
        {onEditar && <EditButton onPress={onEditar} />}
      </View>
      {children}
    </View>
  );

  const ListaConDivisores = ({ items, vacio }) => {
    if (!items || items.length === 0) {
      return <Text style={styles.textoVacio}>{vacio}</Text>;
    }
    return items.map((item, i) => (
      <View
        key={i}
        style={[styles.itemFila, i === items.length - 1 && { borderBottomWidth: 0 }]}
      >
        <View style={styles.itemBullet} />
        <Text style={styles.itemTexto}>{item}</Text>
      </View>
    ));
  };

  const Chip = ({ label, tono = 'default' }) => {
    const activo = tono === 'teal';
    return (
      <View style={[styles.chip, activo && styles.chipTeal]}>
        <Text style={[styles.chipTexto, activo && styles.chipTextoTeal]}>{label}</Text>
      </View>
    );
  };

  const ConfianzaItem = ({ label, verificado, onPress }) => (
    <TouchableOpacity
      style={[styles.confianzaItem, verificado ? styles.confianzaItemOn : styles.confianzaItemOff]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.confianzaIconWrap, verificado ? styles.confianzaIconOn : styles.confianzaIconOff]}>
        <Ionicons
          name={verificado ? 'shield-checkmark' : 'time-outline'}
          size={15}
          color={verificado ? WHITE : GRAY_SOFT}
        />
      </View>
      <Text style={[styles.confianzaLabel, !verificado && styles.confianzaLabelOff]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const AptitudCard = ({ texto }) => (
    <View style={styles.aptitudCard}>
      <View style={styles.aptitudIconWrap}>
        <Ionicons name={iconoParaAptitud(texto)} size={15} color={INDIGO_DEEP} />
      </View>
      <Text style={styles.aptitudTexto}>{texto}</Text>
    </View>
  );

  const ExperienciaTimeline = ({ items, vacio }) => {
    if (!items || items.length === 0) {
      return <Text style={styles.textoVacio}>{vacio}</Text>;
    }
    return items.map((item, i) => {
      const { titulo, detalle } = partirTituloDetalle(item);
      const esUltimo = i === items.length - 1;
      return (
        <View key={i} style={styles.timelineFila}>
          <View style={styles.timelineRielWrap}>
            <View style={styles.timelineDot}>
              <Ionicons name="briefcase" size={11} color={WHITE} />
            </View>
            {!esUltimo && <View style={styles.timelineLinea} />}
          </View>
          <View style={[styles.timelineContenido, !esUltimo && { marginBottom: 16 }]}>
            <Text style={styles.timelineTitulo}>{titulo}</Text>
            {!!detalle && <Text style={styles.timelineDetalle}>{detalle}</Text>}
          </View>
        </View>
      );
    });
  };

  const EducacionLista = ({ items, vacio }) => {
    if (!items || items.length === 0) {
      return <Text style={styles.textoVacio}>{vacio}</Text>;
    }
    return items.map((item, i) => {
      const { titulo, detalle } = partirTituloDetalle(item);
      const esCertificacion = /certifica|curso|diploma/i.test(item);
      return (
        <View key={i} style={[styles.educacionFila, i === items.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.educacionIconWrap}>
            <Ionicons name="school-outline" size={16} color={INDIGO_DEEP} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.educacionTituloRow}>
              <Text style={styles.educacionTitulo}>{titulo}</Text>
              {esCertificacion && (
                <View style={styles.educacionBadge}>
                  <Text style={styles.educacionBadgeTexto}>Certificación</Text>
                </View>
              )}
            </View>
            {!!detalle && <Text style={styles.educacionDetalle}>{detalle}</Text>}
          </View>
        </View>
      );
    });
  };

  const EditModal = ({ visible, tipo, titulo, valorInicial, onCerrar, onGuardar }) => {
    const [texto, setTexto] = useState('');
    const [lista, setLista] = useState([]);
    const [nuevoItem, setNuevoItem] = useState('');
    const [dias, setDias] = useState([]);
    const [servicios, setServicios] = useState([]);

    useEffect(() => {
      if (!visible) return;
      if (tipo === 'lista') setLista(Array.isArray(valorInicial) ? [...valorInicial] : []);
      else if (tipo === 'dias') setDias(Array.isArray(valorInicial) ? [...valorInicial] : []);
      else if (tipo === 'servicios') setServicios(Array.isArray(valorInicial) ? valorInicial.map((s) => ({ ...s })) : []);
      else setTexto(valorInicial != null ? String(valorInicial) : '');
      setNuevoItem('');
    }, [visible, tipo, valorInicial]);

    const toggleDia = (d) => {
      setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    };

    const agregarItem = () => {
      const val = nuevoItem.trim();
      if (!val) return;
      setLista((prev) => [...prev, val]);
      setNuevoItem('');
    };

    const quitarItem = (idx) => {
      setLista((prev) => prev.filter((_, i) => i !== idx));
    };

    const actualizarPrecioServicio = (idx, val) => {
      setServicios((prev) => prev.map((item, i) => (i === idx ? { ...item, precio: val } : item)));
    };

    const handleGuardar = () => {
      if (tipo === 'lista') onGuardar(lista);
      else if (tipo === 'dias') onGuardar(dias);
      else if (tipo === 'servicios') onGuardar(servicios);
      else onGuardar(texto.trim());
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
        <Pressable style={styles.modalOverlay} onPress={onCerrar}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>{titulo}</Text>
                <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={GRAY_TEXT} />
                </TouchableOpacity>
              </View>

              {tipo === 'texto' && (
                <TextInput
                  style={styles.modalInput}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Escribí acá..."
                  placeholderTextColor={GRAY_SOFT}
                  autoFocus
                />
              )}

              {tipo === 'textarea' && (
                <TextInput
                  style={[styles.modalInput, styles.modalInputMultiline]}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Escribí acá..."
                  placeholderTextColor={GRAY_SOFT}
                  multiline
                  autoFocus
                />
              )}

              {tipo === 'dias' && (
                <View style={styles.modalDiasRow}>
                  {DIAS.map((d, idx) => {
                    const activo = dias.includes(d);
                    return (
                      <TouchableOpacity
                        key={`${d}-${idx}`}
                        style={[styles.diaChip, activo && styles.diaChipActivo]}
                        onPress={() => toggleDia(d)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.diaChipTexto, activo && styles.diaChipTextoActivo]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {tipo === 'lista' && (
                <View>
                  <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                    {lista.map((item, idx) => (
                      <View key={idx} style={styles.modalListaItem}>
                        <Text style={styles.modalListaItemTexto} numberOfLines={3}>
                          {item}
                        </Text>
                        <TouchableOpacity
                          onPress={() => quitarItem(idx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={18} color={DANGER} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {lista.length === 0 && (
                      <Text style={styles.textoVacio}>Todavía no agregaste nada.</Text>
                    )}
                  </ScrollView>

                  <View style={styles.modalAgregarRow}>
                    <TextInput
                      style={styles.modalAgregarInput}
                      value={nuevoItem}
                      onChangeText={setNuevoItem}
                      placeholder="Agregar ítem..."
                      placeholderTextColor={GRAY_SOFT}
                      onSubmitEditing={agregarItem}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.modalAgregarBtn} onPress={agregarItem} activeOpacity={0.85}>
                      <Ionicons name="add" size={20} color={WHITE} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {tipo === 'servicios' && (
                <View>
                  <Text style={styles.modalAyuda}>
                    Poné el precio de referencia para cada servicio que ofrecés. Los servicios se
                    definen al registrarte — si querés sumar uno nuevo, contactá a soporte.
                  </Text>
                  <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                    {servicios.map((s, idx) => (
                      <View key={s.id ?? idx} style={styles.modalServicioEditFila}>
                        <Text style={styles.modalListaItemTexto} numberOfLines={1}>
                          {s.nombre}
                        </Text>
                        <View style={styles.modalServicioPrecioInputWrap}>
                          <Text style={styles.modalServicioPrecioSigno}>$</Text>
                          <TextInput
                            style={styles.modalServicioPrecioInput}
                            value={s.precio}
                            onChangeText={(val) => actualizarPrecioServicio(idx, val)}
                            placeholder="0"
                            placeholderTextColor={GRAY_SOFT}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    ))}
                    {servicios.length === 0 && (
                      <Text style={styles.textoVacio}>
                        Todavía no tenés servicios cargados. Se agregan al registrarte como trabajador.
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelar} onPress={onCerrar} activeOpacity={0.8}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalGuardar} onPress={handleGuardar} activeOpacity={0.88}>
                  <Text style={styles.modalGuardarTexto}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.root}>
      <Header usuario={usuario} />

      {cargando ? (
        <View style={styles.estadoVacio}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync" size={34} color={INDIGO} />
          </Animated.View>
          <Text style={styles.estadoTexto}>Cargando tu perfil...</Text>
        </View>
      ) : errorCarga ? (
        <View style={styles.estadoVacio}>
          <Ionicons name="cloud-offline-outline" size={38} color={GRAY_SOFT} />
          <Text style={styles.estadoTexto}>{errorCarga}</Text>
          <TouchableOpacity style={styles.estadoBoton} onPress={cargarPerfil} activeOpacity={0.85}>
            <Text style={styles.estadoBotonTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* ---------- Portada + avatar flotante ---------- */}
        <TouchableOpacity
          style={styles.portada}
          onPress={() => elegirFoto('portada')}
          activeOpacity={0.9}
        >
          {perfil.portada ? (
            <Image source={{ uri: perfil.portada }} style={styles.portadaImg} />
          ) : (
            <View style={styles.portadaVacia} />
          )}
          <View style={styles.portadaOverlay} />
          <View style={styles.portadaEditBadge}>
            <Ionicons name="camera" size={13} color={WHITE} />
            <Text style={styles.portadaEditTexto}>Portada</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={() => elegirFoto('foto')} activeOpacity={0.85}>
            {perfil.foto ? (
              <Image source={{ uri: perfil.foto }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={30} color={INDIGO} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={11} color={WHITE} />
            </View>
          </TouchableOpacity>

          <View style={styles.nombreRow}>
            <Text style={styles.categoriaTexto}>{perfil.categoria}</Text>
            {perfil.identidadVerificada && (
              <View style={styles.verificadoPill}>
                <Ionicons name="checkmark-circle" size={12} color={TEAL_DEEP} />
                <Text style={styles.verificadoPillTexto}>Verificado</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={irAEditarDatos}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 'auto' }}
            >
              <Ionicons name="create-outline" size={17} color={INDIGO_DEEP} />
            </TouchableOpacity>
          </View>
          <Text style={styles.nombreTexto}>{perfil.nombre}</Text>

          <View style={styles.ubicacionRow}>
            <Ionicons name="location-sharp" size={13} color={GRAY_SOFT} />
            <Text style={styles.ubicacionTexto}>{perfil.ubicacion}</Text>
          </View>

          <View style={styles.calificacionRow}>
            <Estrellas valor={perfil.calificacion} size={15} />
            <Text style={styles.calificacionTexto}>
              {Number(perfil.calificacion).toFixed(1)} · {perfil.cantidadResenas} reseñas · {perfil.trabajosRealizados} trabajos
            </Text>
          </View>

          {/* Métricas rápidas */}
          <View style={styles.metricasRow}>
            <View style={styles.metricaBox}>
              <Text style={styles.metricaValor}>{perfil.añosExperiencia}</Text>
              <Text style={styles.metricaLabel}>Años exp.</Text>
            </View>
            <View style={styles.metricaDivisor} />
            <View style={styles.metricaBox}>
              <Text style={styles.metricaValor}>{perfil.tasaAceptacion}%</Text>
              <Text style={styles.metricaLabel}>Aceptación</Text>
            </View>
            <View style={styles.metricaDivisor} />
            <View style={styles.metricaBox}>
              <Text style={styles.metricaValorChico}>{perfil.tiempoRespuesta}</Text>
              <Text style={styles.metricaLabel}>Respuesta</Text>
            </View>
          </View>

          <View style={styles.tarifaRow}>
            <Text style={styles.tarifaLabel}>Tarifa desde</Text>
            <View style={styles.tarifaValorRow}>
              <Text style={styles.tarifaValor}>${perfil.tarifaDesde}/h</Text>
              <EditButton size={12} onPress={() => abrirEdicion('tarifaDesde', 'texto', 'Tarifa desde ($/h)')} />
            </View>
          </View>
        </View>

        {/* ---------- Panel de confianza ---------- */}
        <SeccionCard titulo="Verificación y confianza" subtitulo="Documentación validada por la plataforma">
          <View style={styles.confianzaGrid}>
            <ConfianzaItem
              label="Identidad verificada"
              verificado={perfil.identidadVerificada}
              onPress={() => actualizarCampo('identidadVerificada', !perfil.identidadVerificada)}
            />
            <ConfianzaItem
              label="Antecedentes verificados"
              verificado={perfil.antecedentesVerificados}
              onPress={() => actualizarCampo('antecedentesVerificados', !perfil.antecedentesVerificados)}
            />
            <ConfianzaItem
              label="Matrícula profesional"
              verificado={perfil.matriculaVerificada}
              onPress={() => actualizarCampo('matriculaVerificada', !perfil.matriculaVerificada)}
            />
            <ConfianzaItem
              label="Seguro de responsabilidad civil"
              verificado={perfil.seguroVigente}
              onPress={() => actualizarCampo('seguroVigente', !perfil.seguroVigente)}
            />
          </View>

          <View style={styles.matriculaRow}>
            <Ionicons name="ribbon-outline" size={16} color={INDIGO_DEEP} />
            <Text style={styles.matriculaTexto} numberOfLines={2}>{perfil.matricula}</Text>
            <EditButton size={12} onPress={() => abrirEdicion('matricula', 'texto', 'Matrícula profesional')} />
          </View>
        </SeccionCard>

        {/* ---------- Descripción ---------- */}
        <View style={styles.descBox}>
          <EditButton style={styles.descEditBtn} onPress={() => abrirEdicion('descripcion', 'textarea', 'Descripción')} />
          <Text style={styles.descTitulo}>Sobre mí</Text>
          <Text style={styles.descTexto}>{perfil.descripcion}</Text>
        </View>

        {/* ---------- Servicios y precios ---------- */}
        <SeccionCard
          titulo="Servicios y precios"
          subtitulo="Precio de referencia — puede variar según el trabajo"
          onEditar={() => abrirEdicion('servicios', 'servicios', 'Servicios y precios')}
        >
          {perfil.servicios.length === 0 ? (
            <Text style={styles.textoVacio}>Todavía no cargaste servicios.</Text>
          ) : (
            perfil.servicios.map((s, i) => (
              <View key={s.id ?? i} style={[styles.servicioFila, i === perfil.servicios.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.servicioNombre}>{s.nombre}</Text>
                <Text style={styles.servicioPrecio}>
                  {s.precio ? `desde $${s.precio}` : 'Sin precio cargado'}
                </Text>
              </View>
            ))
          )}
        </SeccionCard>

        {/* ---------- Zona de cobertura ---------- */}
        <SeccionCard
          titulo="Zona de cobertura"
          onEditar={() => abrirEdicion('zonaCobertura', 'lista', 'Zona de cobertura')}
        >
          <View style={styles.chipsWrap}>
            {perfil.zonaCobertura.length === 0 ? (
              <Text style={styles.textoVacio}>Todavía no cargaste tu zona de cobertura.</Text>
            ) : (
              perfil.zonaCobertura.map((z, i) => <Chip key={i} label={z} />)
            )}
          </View>
        </SeccionCard>

        {/* ---------- Disponibilidad ---------- */}
        <SeccionCard titulo="Disponibilidad" onEditar={() => abrirEdicion('disponibilidad', 'dias', 'Días disponibles')}>
          <View style={styles.diasRow}>
            {DIAS.map((d, idx) => {
              const activo = perfil.disponibilidad.includes(d);
              return (
                <View key={`${d}-${idx}`} style={[styles.diaChip, activo && styles.diaChipActivo]}>
                  <Text style={[styles.diaChipTexto, activo && styles.diaChipTextoActivo]}>{d}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.diasResumen}>{diasTexto}</Text>

          <View style={styles.horarioFila}>
            <Ionicons name="time-outline" size={15} color={GRAY_SOFT} />
            <Text style={styles.horarioTexto}>{perfil.horarioAtencion}</Text>
            <EditButton size={12} onPress={() => abrirEdicion('horarioAtencion', 'texto', 'Horario de atención')} />
          </View>

          <View style={styles.emergenciaFila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergenciaTitulo}>Atiendo emergencias</Text>
              <Text style={styles.emergenciaSub}>Disponible fuera del horario habitual ante urgencias</Text>
            </View>
            <Switch
              value={perfil.atiendeEmergencias}
              onValueChange={(v) => actualizarCampo('atiendeEmergencias', v)}
              trackColor={{ false: CHIP_OFF_BORDER, true: TEAL_BORDER }}
              thumbColor={perfil.atiendeEmergencias ? TEAL : WHITE}
            />
          </View>
        </SeccionCard>

        {/* ---------- Idiomas y métodos de pago ---------- */}
        <SeccionCard titulo="Idiomas" onEditar={() => abrirEdicion('idiomas', 'lista', 'Idiomas')}>
          <View style={styles.chipsWrap}>
            {perfil.idiomas.length === 0 ? (
              <Text style={styles.textoVacio}>Todavía no cargaste idiomas.</Text>
            ) : (
              perfil.idiomas.map((idi, i) => <Chip key={i} label={idi} />)
            )}
          </View>
        </SeccionCard>

        <SeccionCard titulo="Métodos de pago aceptados" onEditar={() => abrirEdicion('metodosPago', 'lista', 'Métodos de pago')}>
          <View style={styles.chipsWrap}>
            {perfil.metodosPago.length === 0 ? (
              <Text style={styles.textoVacio}>Todavía no cargaste métodos de pago.</Text>
            ) : (
              perfil.metodosPago.map((m, i) => <Chip key={i} label={m} tono="teal" />)
            )}
          </View>
        </SeccionCard>

        {/* ---------- Aptitudes ---------- */}
        <SeccionCard
          titulo="Aptitudes"
          subtitulo="Habilidades técnicas destacadas por el trabajador"
          onEditar={() => abrirEdicion('aptitudes', 'lista', 'Aptitudes')}
        >
          {perfil.aptitudes.length === 0 ? (
            <Text style={styles.textoVacio}>Todavía no cargaste tus aptitudes.</Text>
          ) : (
            <View style={styles.aptitudesGrid}>
              {perfil.aptitudes.map((a, i) => (
                <AptitudCard key={i} texto={a} />
              ))}
            </View>
          )}
        </SeccionCard>

        {/* ---------- Experiencia ---------- */}
        <SeccionCard
          titulo="Experiencia laboral"
          subtitulo={`${perfil.añosExperiencia} años en el oficio`}
          onEditar={() => abrirEdicion('experiencia', 'lista', 'Experiencia laboral')}
        >
          <ExperienciaTimeline items={perfil.experiencia} vacio="Todavía no cargaste tu experiencia." />
        </SeccionCard>

        {/* ---------- Educación ---------- */}
        <SeccionCard titulo="Educación y certificaciones" onEditar={() => abrirEdicion('educacion', 'lista', 'Educación y certificaciones')}>
          <EducacionLista items={perfil.educacion} vacio="Todavía no cargaste tu educación." />
        </SeccionCard>

        {/* ---------- Portfolio de trabajos ---------- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo}>Trabajos realizados</Text>
              <Text style={styles.cardSubtitulo}>Fotos de antes/después de tus últimos trabajos</Text>
            </View>
          </View>

          <View style={styles.portfolioGrid}>
            {perfil.portfolio.map((uri, i) => (
              <View key={i} style={styles.portfolioItem}>
                <Image source={{ uri }} style={styles.portfolioImg} />
                <TouchableOpacity
                  style={styles.portfolioQuitar}
                  onPress={() => quitarFotoPortfolio(i)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={13} color={WHITE} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.portfolioAgregar}
              onPress={() => seleccionarDeGaleria('portfolio')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={INDIGO} />
              <Text style={styles.portfolioAgregarTexto}>Agregar foto</Text>
            </TouchableOpacity>
          </View>

          {perfil.portfolio.length === 0 && (
            <Text style={[styles.textoVacio, { marginTop: 4 }]}>
              Mostrar fotos de trabajos anteriores aumenta la confianza de los clientes.
            </Text>
          )}
        </View>

        {/* ---------- Reseñas recientes ---------- */}
        <View style={[styles.card, { marginBottom: 8 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitulo}>Reseñas recientes</Text>
          </View>

          {perfil.resenas.map((r, i) => (
            <View key={i} style={[styles.resenaFila, i === perfil.resenas.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.resenaAvatar}>
                <Text style={styles.resenaAvatarTexto}>{r.nombre?.charAt(0) ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.resenaTopRow}>
                  <Text style={styles.resenaNombre}>{r.nombre}</Text>
                  <Estrellas valor={r.estrellas} size={11} />
                </View>
                <Text style={styles.resenaComentario} numberOfLines={2}>{r.comentario}</Text>
              </View>
            </View>
          ))}

          {perfil.resenas.length === 0 && <Text style={styles.textoVacio}>Todavía no tenés reseñas.</Text>}
        </View>
      </ScrollView>
      )}

      <BottomNavBarTrabajador usuario={usuario} pantallaActiva="perfil" />

      <EditModal
        visible={modal.visible}
        tipo={modal.tipo}
        titulo={modal.titulo}
        valorInicial={valorInicialModal}
        onCerrar={cerrarModal}
        onGuardar={guardarCampo}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Estilos                                                            */
/* ------------------------------------------------------------------ */

const createStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },

  /* Portada */
  portada: { width: '100%', height: 132 },
  portadaImg: { width: '100%', height: '100%' },
  portadaVacia: { width: '100%', height: '100%', backgroundColor: INDIGO_DEEP },
  portadaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,18,48,0.18)',
  },
  portadaEditBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,18,48,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  portadaEditTexto: { color: WHITE, fontSize: 11, fontWeight: '700' },

  /* Header card */
  headerCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -36,
    borderRadius: 20,
    padding: 16,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarWrap: { width: 78, height: 78, borderRadius: 20, marginBottom: 10 },
  avatarImg: { width: 78, height: 78, borderRadius: 20, borderWidth: 3, borderColor: colors.card },
  avatarPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: 'rgba(61,78,234,0.10)',
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: INDIGO,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  categoriaTexto: {
    fontSize: 12.5,
    fontWeight: '800',
    color: INDIGO,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  verificadoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: TEAL_BG,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verificadoPillTexto: { fontSize: 10, fontWeight: '800', color: TEAL_DEEP },
  nombreTexto: { fontSize: 21, fontWeight: '900', color: colors.text, letterSpacing: -0.3, marginBottom: 4 },
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ubicacionTexto: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
  calificacionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  calificacionTexto: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  metricasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  metricaBox: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  metricaValor: { fontSize: 16, fontWeight: '900', color: colors.text },
  metricaValorChico: { fontSize: 12, fontWeight: '800', color: colors.text, textAlign: 'center' },
  metricaLabel: { fontSize: 10, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricaDivisor: { width: 1, height: 30, backgroundColor: colors.border },

  tarifaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  tarifaLabel: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '700' },
  tarifaValorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tarifaValor: { fontSize: 17, fontWeight: '900', color: INDIGO_DEEP },

  /* Cards genéricas */
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardTitulo: { fontSize: 15.5, fontWeight: '800', color: INDIGO_DEEP, letterSpacing: -0.2 },
  cardSubtitulo: { fontSize: 11.5, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },

  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(61,78,234,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(61,78,234,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Panel de confianza */
  confianzaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  confianzaItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  confianzaItemOn: { backgroundColor: TEAL_BG, borderColor: TEAL_BORDER },
  confianzaItemOff: { backgroundColor: CHIP_OFF_BG, borderColor: CHIP_OFF_BORDER },
  confianzaIconWrap: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  confianzaIconOn: { backgroundColor: TEAL },
  confianzaIconOff: { backgroundColor: '#DCDFEB' },
  confianzaLabel: { flex: 1, fontSize: 11.5, fontWeight: '700', color: colors.text, lineHeight: 15 },
  confianzaLabelOff: { color: colors.textTertiary },
  matriculaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  matriculaTexto: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '600', lineHeight: 16 },

  /* Descripción */
  descBox: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    paddingRight: 40,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descEditBtn: { position: 'absolute', top: 12, right: 12 },
  descTitulo: { fontSize: 15.5, fontWeight: '800', color: INDIGO_DEEP, marginBottom: 6 },
  descTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  /* Servicios */
  servicioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  servicioNombre: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '700', paddingRight: 10 },
  servicioPrecio: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  /* Chips */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
  },
  chipTeal: { backgroundColor: TEAL_BG, borderColor: TEAL_BORDER },
  chipTexto: { fontSize: 12, fontWeight: '600', color: GRAY_TEXT },
  chipTextoTeal: { color: TEAL_DEEP },

  /* Disponibilidad */
  diasRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  diaChip: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaChipActivo: { backgroundColor: INDIGO, borderColor: INDIGO },
  diaChipTexto: { fontSize: 12, fontWeight: '700', color: GRAY_TEXT },
  diaChipTextoActivo: { color: WHITE },
  diasResumen: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  horarioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  horarioTexto: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  emergenciaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  emergenciaTitulo: { fontSize: 13, fontWeight: '700', color: colors.text },
  emergenciaSub: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },

  /* Aptitudes */
  aptitudesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aptitudCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aptitudIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(61,78,234,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptitudTexto: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text, lineHeight: 15 },

  /* Experiencia */
  timelineFila: { flexDirection: 'row', gap: 12 },
  timelineRielWrap: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLinea: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  timelineContenido: { flex: 1, paddingBottom: 0 },
  timelineTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  timelineDetalle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },

  /* Educación */
  educacionFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  educacionIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(61,78,234,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  educacionTituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  educacionTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.text, flex: 1 },
  educacionBadge: {
    backgroundColor: TEAL_BG,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  educacionBadgeTexto: { fontSize: 9.5, fontWeight: '700', color: TEAL_DEEP },
  educacionDetalle: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  /* Portfolio */
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portfolioItem: { position: 'relative' },
  portfolioImg: { width: 100, height: 100, borderRadius: RADIUS_MD },
  portfolioQuitar: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22,
    borderRadius: 11, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  portfolioAgregar: {
    width: 100, height: 100,
    borderRadius: RADIUS_MD,
    borderWidth: 1.5, borderColor: INDIGO, borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(61,78,234,0.06)',
  },
  portfolioAgregarTexto: { fontSize: 11, fontWeight: '700', color: INDIGO },

  /* Reseñas */
  resenaFila: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resenaAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resenaAvatarTexto: { color: WHITE, fontSize: 14, fontWeight: '800' },
  resenaTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  resenaNombre: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  resenaComentario: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  /* Estado vacío / carga */
  estadoVacio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  estadoTexto: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  estadoBoton: {
    marginTop: 8,
    backgroundColor: INDIGO,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS_MD,
  },
  estadoBotonTexto: { color: WHITE, fontSize: 13, fontWeight: '700' },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,18,48,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 18,
    paddingTop: 14,
  },
  modalCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CHIP_OFF_BG,
    alignItems: 'center',
  },
  modalCancelarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalGuardar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
  },
  modalGuardarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },
  modalInput: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    marginHorizontal: 18,
    marginTop: 14,
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalAyuda: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
    marginHorizontal: 18,
    marginTop: 14,
  },
  modalDiasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  modalListaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalListaItemTexto: { flex: 1, fontSize: 13.5, color: colors.text },
  modalAgregarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  modalAgregarInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
  },
  modalAgregarBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalServicioEditFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalServicioPrecioInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 10,
  },
  modalServicioPrecioSigno: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  modalServicioPrecioInput: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 6,
    minWidth: 60,
  },

  textoVacio: { fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' },
});
