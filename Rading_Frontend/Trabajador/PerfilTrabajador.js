import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import Header from '../Header';
import BottomNavBarTrabajador from './Navegadortrabajador';

/* ==================================================================== */
/*  TOKENS                                                              */
/*  Paleta pensada para un perfil de trabajador: la base sigue siendo   */
/*  el indigo/navy de la app, pero se suma un verde-azulado ("TEAL")    */
/*  reservado exclusivamente para todo lo que significa "verificado /   */
/*  confiable", así el usuario aprende a asociar ese color con          */
/*  seguridad en un vistazo, sin que compita con el resto de la UI.     */
/* ==================================================================== */

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
/*  Piezas de UI reutilizables                                        */
/* ------------------------------------------------------------------ */

function EditButton({ onPress, size = 14, style }) {
  return (
    <TouchableOpacity
      style={[styles.editBtn, style]}
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="pencil" size={size} color={INDIGO_DEEP} />
    </TouchableOpacity>
  );
}

function Estrellas({ valor = 0, size = 16 }) {
  return (
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
}

function SeccionCard({ titulo, onEditar, children, style, subtitulo }) {
  return (
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
}

function ListaConDivisores({ items, vacio }) {
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
}

function Chip({ label, tono = 'default' }) {
  const activo = tono === 'teal';
  return (
    <View style={[styles.chip, activo && styles.chipTeal]}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoTeal]}>{label}</Text>
    </View>
  );
}

/* Fila de un ítem del panel de confianza: check verde si está verificado,
   reloj gris si está pendiente. Esto es lo primero que un cliente mira
   antes de contratar, por eso va arriba de todo, antes que la bio. */
function ConfianzaItem({ label, verificado, onPress }) {
  return (
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
}

/* ------------------------------------------------------------------ */
/*  Helpers y piezas nuevas para "Trabajos y aptitudes"                */
/*  Muchos ítems de texto libre (educación / experiencia) vienen       */
/*  cargados como "Entidad: detalle" — separamos ese primer ":" para   */
/*  poder tratar la entidad como título y el resto como cuerpo, sin    */
/*  tener que tocar el modelo de datos ni el modal de edición.         */
/* ------------------------------------------------------------------ */

function partirTituloDetalle(item) {
  const idx = item.indexOf(':');
  if (idx === -1) return { titulo: item, detalle: '' };
  return { titulo: item.slice(0, idx).trim(), detalle: item.slice(idx + 1).trim() };
}

/* Ícono temático simple según palabras clave del rubro. Es un detalle
   pequeño, pero hace que la lista de aptitudes se sienta curada en vez
   de una tira de bullets genéricos. */
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

/* Aptitud como "credencial": ícono en pastilla indigo (autodeclarada,
   por eso NO usa el teal reservado a lo verificado por la plataforma)
   más el texto de la habilidad. Se agrupan en grilla de 2 columnas. */
function AptitudCard({ texto }) {
  return (
    <View style={styles.aptitudCard}>
      <View style={styles.aptitudIconWrap}>
        <Ionicons name={iconoParaAptitud(texto)} size={15} color={INDIGO_DEEP} />
      </View>
      <Text style={styles.aptitudTexto}>{texto}</Text>
    </View>
  );
}

/* Línea de tiempo de experiencia laboral: marcador + conector vertical,
   título en negrita (la empresa/rol) y el detalle debajo en gris. */
function ExperienciaTimeline({ items, vacio }) {
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
}

/* Educación y certificaciones como tarjetas: ícono de birrete, título de
   la institución y una pastilla "Certificación" cuando el texto lo sugiere. */
function EducacionLista({ items, vacio }) {
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
}

/* ------------------------------------------------------------------ */
/*  Modal genérico de edición                                         */
/*  Tipos: texto | textarea | lista | dias | servicios | switch       */
/* ------------------------------------------------------------------ */

function EditModal({ visible, tipo, titulo, valorInicial, onCerrar, onGuardar }) {
  const [texto, setTexto] = useState('');
  const [lista, setLista] = useState([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [dias, setDias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState('');
  const [nuevoServicioPrecio, setNuevoServicioPrecio] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (tipo === 'lista') setLista(Array.isArray(valorInicial) ? [...valorInicial] : []);
    else if (tipo === 'dias') setDias(Array.isArray(valorInicial) ? [...valorInicial] : []);
    else if (tipo === 'servicios') setServicios(Array.isArray(valorInicial) ? [...valorInicial] : []);
    else setTexto(valorInicial != null ? String(valorInicial) : '');
    setNuevoItem('');
    setNuevoServicioNombre('');
    setNuevoServicioPrecio('');
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

  const agregarServicio = () => {
    const nombre = nuevoServicioNombre.trim();
    const precio = nuevoServicioPrecio.trim();
    if (!nombre || !precio) return;
    setServicios((prev) => [...prev, { nombre, precio }]);
    setNuevoServicioNombre('');
    setNuevoServicioPrecio('');
  };

  const quitarServicio = (idx) => {
    setServicios((prev) => prev.filter((_, i) => i !== idx));
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
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {servicios.map((s, idx) => (
                    <View key={idx} style={styles.modalListaItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalListaItemTexto}>{s.nombre}</Text>
                        <Text style={styles.modalListaItemPrecio}>Desde ${s.precio}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => quitarServicio(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={DANGER} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {servicios.length === 0 && (
                    <Text style={styles.textoVacio}>Todavía no cargaste servicios.</Text>
                  )}
                </ScrollView>

                <View style={styles.modalServicioRow}>
                  <TextInput
                    style={[styles.modalAgregarInput, { flex: 1.4 }]}
                    value={nuevoServicioNombre}
                    onChangeText={setNuevoServicioNombre}
                    placeholder="Servicio (ej: Destape de cañería)"
                    placeholderTextColor={GRAY_SOFT}
                  />
                  <TextInput
                    style={[styles.modalAgregarInput, { flex: 0.7 }]}
                    value={nuevoServicioPrecio}
                    onChangeText={setNuevoServicioPrecio}
                    placeholder="Precio $"
                    placeholderTextColor={GRAY_SOFT}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.modalAgregarBtn} onPress={agregarServicio} activeOpacity={0.85}>
                    <Ionicons name="add" size={20} color={WHITE} />
                  </TouchableOpacity>
                </View>
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
}

/* ------------------------------------------------------------------ */
/*  Pantalla principal                                                */
/* ------------------------------------------------------------------ */

/**
 * Props:
 * - usuario: usuario logueado (se le pasa a Header y a BottomNavBarTrabajador).
 * - perfilInicial: opcional, para precargar datos reales del backend.
 * - onGuardarPerfil(perfilActualizado, campo, valor): opcional. Se llama cada
 *   vez que se guarda una edición, para que lo conectes a tu API cuando quieras.
 *
 * Nota: este componente NO hace fetch ni persiste nada por su cuenta —
 * todo vive en estado local (útil para maquetar / probar el diseño) hasta
 * que decidas conectar onGuardarPerfil a tu backend.
 */
export default function PerfilTrabajador({ usuario, perfilInicial, onGuardarPerfil }) {
  const [perfil, setPerfil] = useState({
    categoria: 'Plomero',
    nombre: 'Ricardo Caminante',
    ubicacion: 'Villa del Parque, CABA',
    foto: null,
    portada: null,

    // --- Confianza / verificación: lo primero que ve un cliente ---
    identidadVerificada: true,
    antecedentesVerificados: true,
    matricula: 'Matrícula N° 4821 — Colegio de Plomeros CABA',
    matriculaVerificada: true,
    seguroVigente: false,

    // --- Métricas de desempeño ---
    tiempoRespuesta: 'Responde en ~15 min',
    tasaAceptacion: 92,
    añosExperiencia: 8,
    trabajosRealizados: 230,
    calificacion: 4.8,
    cantidadResenas: 96,

    tarifaDesde: '7.500',

    descripcion:
      'Plomero con especialización en instalación y reparación de sistemas de agua, gas y desagües. Responsable, puntual y enfocado en soluciones rápidas y eficientes.',

    servicios: [
      { nombre: 'Destape de cañerías', precio: '6.000' },
      { nombre: 'Reparación de canillas y griferías', precio: '7.500' },
      { nombre: 'Instalación de termotanque', precio: '18.000' },
      { nombre: 'Detección de fugas', precio: '9.000' },
    ],

    zonaCobertura: ['Villa del Parque', 'Villa Devoto', 'Agronomía', 'Paternal'],

    disponibilidad: ['X', 'V', 'S'],
    horarioAtencion: '8:00 a 20:00 hs',
    atiendeEmergencias: true,

    idiomas: ['Español'],
    metodosPago: ['Efectivo', 'Transferencia', 'Tarjeta de débito/crédito'],

    educacion: [
      'Instituto Tecnológico Superior: Certificación Profesional en Instalaciones Sanitarias.',
      'Cámara de Plomeros: Curso avanzado de reparación de calderas y sistemas de gas.',
    ],
    experiencia: [
      'Mantenimiento Residencial Independiente: +5 años realizando reparaciones de urgencia, detección de filtraciones y mantenimiento preventivo.',
      'Constructora "Nueva Ciudad": Instalación integral de redes de agua y desagüe en edificios de departamentos (obras nuevas).',
    ],
    aptitudes: [
      'Detección de fugas con ultrasonido.',
      'Reparación de termotanques y calefones.',
      'Instalación de grifería de alta gama.',
      'Destape de cañerías con maquinaria.',
    ],

    portfolio: [],

    resenas: [
      { nombre: 'Lucas Rigoletti', comentario: 'Excelente trabajo, muy prolijo y puntual.', estrellas: 5 },
      { nombre: 'Marina Souza', comentario: 'Resolvió una urgencia un domingo, 100% recomendable.', estrellas: 5 },
    ],
    ...perfilInicial,
  });

  const [modal, setModal] = useState({ visible: false, campo: null, tipo: 'texto', titulo: '' });

  const abrirEdicion = (campo, tipo, titulo) => {
    setModal({ visible: true, campo, tipo, titulo });
  };

  const cerrarModal = () => setModal((m) => ({ ...m, visible: false }));

  const actualizarCampo = (campo, valorNuevo) => {
    setPerfil((prev) => {
      const actualizado = { ...prev, [campo]: valorNuevo };
      onGuardarPerfil?.(actualizado, campo, valorNuevo);
      return actualizado;
    });
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

  return (
    <View style={styles.root}>
      <Header usuario={usuario} />

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

          {/* Métricas rápidas: lo que un cliente compara entre perfiles */}
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

        {/* ---------- Panel de confianza: lo primero que decide una contratación ---------- */}
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
              <View key={i} style={[styles.servicioFila, i === perfil.servicios.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.servicioNombre}>{s.nombre}</Text>
                <Text style={styles.servicioPrecio}>desde ${s.precio}</Text>
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

        {/* ---------- Reseñas recientes (solo lectura) ---------- */}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
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

  /* Header card (avatar + nombre + métricas) */
  headerCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: -36,
    borderRadius: 20,
    padding: 16,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarWrap: { width: 78, height: 78, borderRadius: 20, marginBottom: 10 },
  avatarImg: { width: 78, height: 78, borderRadius: 20, borderWidth: 3, borderColor: WHITE },
  avatarPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: 'rgba(61,78,234,0.10)',
    borderWidth: 3,
    borderColor: WHITE,
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
    borderColor: WHITE,
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
  nombreTexto: { fontSize: 21, fontWeight: '900', color: NAVY, letterSpacing: -0.3, marginBottom: 4 },
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  ubicacionTexto: { fontSize: 12.5, color: GRAY_TEXT, fontWeight: '600' },
  calificacionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  calificacionTexto: { fontSize: 12, color: GRAY_TEXT, fontWeight: '600' },

  metricasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  metricaBox: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  metricaValor: { fontSize: 16, fontWeight: '900', color: NAVY },
  metricaValorChico: { fontSize: 12, fontWeight: '800', color: NAVY, textAlign: 'center' },
  metricaLabel: { fontSize: 10, color: GRAY_SOFT, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricaDivisor: { width: 1, height: 30, backgroundColor: CHIP_OFF_BORDER },

  tarifaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: CHIP_OFF_BORDER,
    paddingTop: 12,
  },
  tarifaLabel: { fontSize: 12.5, color: GRAY_TEXT, fontWeight: '700' },
  tarifaValorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tarifaValor: { fontSize: 17, fontWeight: '900', color: INDIGO_DEEP },

  /* Cards genéricas */
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardTitulo: { fontSize: 15.5, fontWeight: '800', color: INDIGO_DEEP, letterSpacing: -0.2 },
  cardSubtitulo: { fontSize: 11.5, color: GRAY_SOFT, fontWeight: '600', marginTop: 2 },

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
  confianzaLabel: { flex: 1, fontSize: 11.5, fontWeight: '700', color: NAVY, lineHeight: 15 },
  confianzaLabelOff: { color: GRAY_SOFT },
  matriculaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG,
    borderRadius: 12,
    padding: 10,
  },
  matriculaTexto: { flex: 1, fontSize: 12, color: GRAY_TEXT, fontWeight: '600', lineHeight: 16 },

  /* Descripción */
  descBox: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    paddingRight: 40,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  descEditBtn: { position: 'absolute', top: 12, right: 12 },
  descTitulo: { fontSize: 15.5, fontWeight: '800', color: INDIGO_DEEP, marginBottom: 6 },
  descTexto: { fontSize: 13, color: GRAY_TEXT, lineHeight: 19 },

  /* Servicios */
  servicioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_OFF_BORDER,
  },
  servicioNombre: { flex: 1, fontSize: 13, color: NAVY, fontWeight: '700', paddingRight: 10 },
  servicioPrecio: { fontSize: 13, color: INDIGO_DEEP, fontWeight: '800' },

  /* Chips */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipTeal: { backgroundColor: TEAL_BG, borderColor: TEAL_BORDER },
  chipTexto: { fontSize: 12, fontWeight: '700', color: GRAY_TEXT },
  chipTextoTeal: { color: TEAL_DEEP },

  /* Días */
  diasRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  diaChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaChipActivo: { backgroundColor: INDIGO_DEEP, borderColor: INDIGO_DEEP },
  diaChipTexto: { fontSize: 13, fontWeight: '800', color: GRAY_SOFT },
  diaChipTextoActivo: { color: WHITE },
  diasResumen: { fontSize: 11.5, color: GRAY_SOFT, fontWeight: '600', marginBottom: 12 },

  horarioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  horarioTexto: { flex: 1, fontSize: 12.5, color: NAVY, fontWeight: '700' },

  emergenciaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: CHIP_OFF_BORDER,
    paddingTop: 12,
  },
  emergenciaTitulo: { fontSize: 13, fontWeight: '800', color: NAVY, marginBottom: 2 },
  emergenciaSub: { fontSize: 11, color: GRAY_SOFT, fontWeight: '600', lineHeight: 15 },

  /* Listas con divisores (genérico, todavía usado en otros lados) */
  itemFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_OFF_BORDER,
  },
  itemBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: INDIGO, marginTop: 7 },
  itemTexto: { flex: 1, fontSize: 13, color: GRAY_TEXT, lineHeight: 19 },
  textoVacio: { fontSize: 13, color: GRAY_SOFT, fontStyle: 'italic', paddingVertical: 6 },

  /* Aptitudes: grilla de credenciales autodeclaradas (indigo, no teal) */
  aptitudesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aptitudCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  aptitudIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(61,78,234,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptitudTexto: { flex: 1, fontSize: 11.5, fontWeight: '700', color: NAVY, lineHeight: 15 },

  /* Experiencia laboral: línea de tiempo con marcador tipo "maletín" */
  timelineFila: { flexDirection: 'row' },
  timelineRielWrap: { width: 26, alignItems: 'center' },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: INDIGO_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLinea: { flex: 1, width: 2, backgroundColor: CHIP_OFF_BORDER, marginVertical: 4, borderRadius: 1 },
  timelineContenido: { flex: 1, paddingLeft: 12, paddingTop: 1 },
  timelineTitulo: { fontSize: 13.5, fontWeight: '800', color: NAVY, marginBottom: 3 },
  timelineDetalle: { fontSize: 12.5, color: GRAY_TEXT, lineHeight: 18 },

  /* Educación: tarjetas con ícono de institución + pastilla de certificación */
  educacionFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_OFF_BORDER,
  },
  educacionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(61,78,234,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  educacionTituloRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 },
  educacionTitulo: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  educacionBadge: {
    backgroundColor: TEAL_BG,
    borderWidth: 1,
    borderColor: TEAL_BORDER,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  educacionBadgeTexto: { fontSize: 9.5, fontWeight: '800', color: TEAL_DEEP, textTransform: 'uppercase', letterSpacing: 0.3 },
  educacionDetalle: { fontSize: 12.5, color: GRAY_TEXT, lineHeight: 18 },

  /* Portfolio */
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portfolioItem: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  portfolioImg: { width: '100%', height: '100%' },
  portfolioQuitar: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: 'rgba(10,18,48,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioAgregar: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: CHIP_OFF_BORDER,
    borderStyle: 'dashed',
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  portfolioAgregarTexto: { fontSize: 10, fontWeight: '700', color: INDIGO },

  /* Reseñas */
  resenaFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_OFF_BORDER,
  },
  resenaAvatar: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(61,78,234,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resenaAvatarTexto: { fontSize: 13, fontWeight: '800', color: INDIGO_DEEP },
  resenaTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  resenaNombre: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  resenaComentario: { fontSize: 12.5, color: GRAY_TEXT, lineHeight: 17 },

  /* Modal de edición */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,18,48,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitulo: { fontSize: 16.5, fontWeight: '900', color: NAVY },
  modalInput: {
    backgroundColor: CHIP_OFF_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: NAVY,
  },
  modalInputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  modalDiasRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalListaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_OFF_BORDER,
  },
  modalListaItemTexto: { flex: 1, fontSize: 13, color: GRAY_TEXT, lineHeight: 18 },
  modalListaItemPrecio: { fontSize: 12, color: INDIGO_DEEP, fontWeight: '800', marginTop: 2 },
  modalAgregarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  modalServicioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  modalAgregarInput: {
    flex: 1,
    backgroundColor: CHIP_OFF_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: NAVY,
  },
  modalAgregarBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: INDIGO, alignItems: 'center', justifyContent: 'center' },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancelar: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    backgroundColor: CHIP_OFF_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelarTexto: { fontSize: 14, fontWeight: '700', color: GRAY_TEXT },
  modalGuardar: { flex: 1, height: 46, borderRadius: 13, backgroundColor: INDIGO, alignItems: 'center', justifyContent: 'center' },
  modalGuardarTexto: { fontSize: 14, fontWeight: '800', color: WHITE },
});