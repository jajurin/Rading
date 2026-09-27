import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../ThemeContext';
import Header from '../Header';
import BottomNavBar from './NavegadorCliente';
import API_URL from '../configS';
import { Video, ResizeMode, Audio } from 'expo-av';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d47a8';
const BLUE_LIGHT = '#3b7ff0';
const STATUS_BAR = '#0D4FD7';
const BG         = '#F3F5FA';
const ACCENT     = '#B45309';
const ACCENT_SOFT= '#FDF3E4';
const ACCENT_BORDER = '#D9822B';
const DANGER     = '#C0392B';
const API_BASE_URL = API_URL;

const OPCION_OTRO = '__otro__';
const MAX_IMAGENES_PROPUESTA = 5;

const obtenerIniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

const esUrlImagen = (url = '') =>
  /\.(jpg|jpeg|png|gif|webp|jfif|bmp|heic|heif)(\?.*)?$/i.test(url);

const mapearMensaje = (m, idUsuario) => {
  let tipo = 'texto';
  switch (m.tipo) {
    case 'PROPUESTA':
      tipo = 'servicio';
      break;
    case 'IMAGEN':
      tipo = 'imagen';
      break;
    case 'VIDEO':
      tipo = 'video';
      break;
    case 'AUDIO':
      tipo = 'audio';
      break;
    case 'ARCHIVO':
      tipo = 'archivo';
      break;
    default:
      tipo = esUrlImagen(m.contenido) ? 'imagen' : 'texto';
  }

  return {
    id: String(m.id),
    tipo,
    autor: m.enviador_id === idUsuario ? 'cliente' : 'trabajador',
    texto: m.contenido,
    servicio: m.servicio_nombre,
    precio: m.precio,
    estado: m.ESTADO_OFERTA,
    leido: !!m.leido,
    editado: !!m.edited_at,
    duracionAudio: m.duracion_audio,
    emergencia: !!m.emergencia,
    fechaRequerida: m.fecha_requerida ?? m.fechaRequerida ?? null,
    horarioRequerido: m.horario_requerido ?? m.horarioRequerido ?? null,
    direccion: m.direccion ?? null,
    imagenes: m.imagenes ?? [],
    hora: m.created_at
      ? new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : '',
  };
};

const mapearOferta = (o, idTrabajo, servicioNombreOverride = null) => ({
  id: o.id,
  idTrabajo,
  idTrabajador: o.idTrabajador,
  nombre: `${o.nombre ?? ''} ${o.apellido ?? ''}`.trim(),
  rating: Number(o.estrellas ?? 0),
  distancia: o.distancia ?? null,
  costoExtraMin: Number(o.costoExtraMin ?? 0),
  costoExtraMax: Number(o.costoExtraMax ?? 0),
  precio: Number(o.precio ?? o.precioSolicitud ?? 0),
  servicioNombre: servicioNombreOverride,
  fijo: Boolean(o.fijo),
  emergencia: Boolean(o.emergencia),
  subastaTermina: o.subastaTermina ?? null,
});

const normalizar = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const calcularCategoriaUrgencia = (fechaLimite) => {
  if (!fechaLimite) return null;
  const ahora = new Date();
  const diffHoras = (fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  if (diffHoras <= 12) return 'Muy urgente, dentro de las próximas 12hs';
  if (diffHoras <= 24) return 'Urgente, dentro de las próximas 24hs';
  if (diffHoras <= 48) return 'Mañana o en las próximas 48hs';
  if (diffHoras <= 24 * 7) return 'Dentro de esta semana';
  return 'Sin apuro, más de una semana';
};

const formatearFechaHora = (fecha) => {
  if (!fecha) return '';
  const fechaStr = fecha.toLocaleDateString('es-AR');
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${fechaStr} ${horaStr}`;
};

export default function ChatCliente({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const contacto = route?.params?.contacto;
  const usuario = route?.params?.usuario;

  const listRef = useRef(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [alturaHeader, setAlturaHeader] = useState(0);
  const [tecladoVisible, setTecladoVisible] = useState(false);

  const [chatId, setChatId] = useState(route?.params?.chatId ?? null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  // ── Menú del header (⋮) y vaciar chat ──
  const [mostrarMenuHeader, setMostrarMenuHeader] = useState(false);
  const [mostrarConfirmVaciar, setMostrarConfirmVaciar] = useState(false);
  const [vaciandoChat, setVaciandoChat] = useState(false);

  // ── Grabación de audio ──
  const [grabando, setGrabando] = useState(false);
  const [grabacion, setGrabacion] = useState(null);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const intervaloGrabacionRef = useRef(null);

  // ── Edición de mensajes ──
  const [editandoMensaje, setEditandoMensaje] = useState(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // ── Overlay de "Enviar propuesta" ──
  const [mostrarPropuesta, setMostrarPropuesta] = useState(false);
  const [propServicio, setPropServicio] = useState('');
  const [propPrecio, setPropPrecio] = useState('');
  const [propDescripcion, setPropDescripcion] = useState('');
  const [enviandoPropuesta, setEnviandoPropuesta] = useState(false);
  const [errorPropuesta, setErrorPropuesta] = useState(null);

  // ── IA de propuesta ──
  const [propAnalizando, setPropAnalizando] = useState(false);
  const [propErrorIA, setPropErrorIA] = useState(null);
  const [propAnalisis, setPropAnalisis] = useState(null);
  const [propServicioId, setPropServicioId] = useState(null);
  const [propContexto, setPropContexto] = useState('');

  // ── Propuesta: emergencia, plazo, dirección, fotos ──
  const [propEmergencia, setPropEmergencia] = useState(false);
  const [propTienePlazo, setPropTienePlazo] = useState(false);
  const [propFechaLimite, setPropFechaLimite] = useState(null);
  const [propMostrarPickerFecha, setPropMostrarPickerFecha] = useState(false);
  const [propMostrarPickerHora, setPropMostrarPickerHora] = useState(false);

  const [propUsarOtraDireccion, setPropUsarOtraDireccion] = useState(false);
  const [propDireccion, setPropDireccion] = useState('');

  const [propImagenes, setPropImagenes] = useState([]);
  const [errorImagenesProp, setErrorImagenesProp] = useState(null);
  const [subiendoImagenesProp, setSubiendoImagenesProp] = useState(false);

  // ── Selector de servicio sugerido por IA ──
  const [propSelectorAbierto, setPropSelectorAbierto] = useState(false);

  // ── Detalle de una propuesta ya enviada ──
  const [servicioDetalle, setServicioDetalle] = useState(null);

  const propDescripcionValida = propDescripcion.trim().length >= 10;
  const propNecesitaAclaracion =
    propAnalisis !== null && propAnalisis?.necesitaAclaracion === true && !propAnalisis?.servicioId;
  const propPreguntasActuales = propNecesitaAclaracion ? (propAnalisis?.preguntas || []) : [];

  // ── Respuestas a las preguntas de aclaración de la IA ──
  const [propRespuestas, setPropRespuestas] = useState({});
  const [propTextosOtro, setPropTextosOtro] = useState({});

  const propTodasRespondidas = useMemo(() => {
    if (propPreguntasActuales.length === 0) return false;
    return propPreguntasActuales.every((p, idx) => {
      const r = propRespuestas[idx];
      if (!r) return false;
      if (r === OPCION_OTRO) return !!(propTextosOtro[idx] || '').trim();
      return true;
    });
  }, [propPreguntasActuales, propRespuestas, propTextosOtro]);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // ── Efectos ──
  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  // ── Cargar mensajes ──
  const cargarMensajes = useCallback(async () => {
    if (!chatId) {
      setCargando(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/chat/${chatId}/mensajes`);
      if (!res.ok) throw new Error('Respuesta no OK del servidor');
      const data = await res.json();
      setMensajes(data.map((m) => mapearMensaje(m, usuario?.id)));
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      setError('No pudimos cargar la conversación');
    } finally {
      setCargando(false);
    }
  }, [chatId, usuario]);

  useEffect(() => {
    cargarMensajes();
  }, [cargarMensajes]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [mensajes.length]);

  // ── Resolver chat si no viene ──
  useEffect(() => {
    if (route?.params?.chatId) return;
    if (!usuario?.idCliente || !contacto?.idTrabajador) {
      setCargando(false);
      return;
    }
    const resolverChatExistente = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/chat/buscar/${usuario.idCliente}/${contacto.idTrabajador}`
        );
        if (!res.ok) throw new Error('No se pudo resolver el chat existente');
        const data = await res.json();
        if (data.chatId) setChatId(data.chatId);
        else setCargando(false);
      } catch (err) {
        console.error('Error al resolver chat existente:', err);
        setCargando(false);
      }
    };
    resolverChatExistente();
    return () => {};
  }, [route?.params?.chatId, usuario?.idCliente, contacto?.idTrabajador]);

  // ── Marcar leído ──
  useEffect(() => {
    if (!chatId || !usuario?.id) return;
    fetch(`${API_BASE_URL}/chat/${chatId}/leido`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: usuario.id }),
    }).catch((err) => console.error('Error al marcar como leído:', err));
  }, [chatId, usuario]);

  // ── Vaciar chat ──
  const vaciarChat = async () => {
    if (!chatId || vaciandoChat) return;
    setVaciandoChat(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/${chatId}/vaciar`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo vaciar el chat');
      setMensajes([]);
      setMostrarConfirmVaciar(false);
    } catch (err) {
      console.error('Error al vaciar chat:', err);
      setError('No se pudo vaciar el chat. Probá de nuevo.');
    } finally {
      setVaciandoChat(false);
    }
  };

  // ── Enviar mensaje ──
  const enviarMensaje = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    if (!usuario?.id || (!chatId && (!usuario?.idCliente || !contacto?.idTrabajador))) {
      console.error('Faltan datos para enviar el mensaje (usuario o idTrabajador)');
      return;
    }
    const idTemp = `local-${Date.now()}`;
    const nuevoLocal = {
      id: idTemp,
      tipo: 'texto',
      autor: 'cliente',
      texto: contenido,
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMensajes((prev) => [...prev, nuevoLocal]);
    setTexto('');
    setEnviando(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    try {
      const body = chatId
        ? { chatId, enviadorId: usuario.id, contenido, tipo: 'TEXTO' }
        : {
            idCliente: usuario.idCliente,
            idTrabajador: contacto.idTrabajador,
            enviadorId: usuario.id,
            contenido,
            tipo: 'TEXTO',
          };
      const res = await fetch(`${API_BASE_URL}/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Respuesta no OK del servidor');
      const guardado = await res.json();
      if (!chatId && guardado.chat_id) setChatId(guardado.chat_id);
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === idTemp
            ? { ...m, id: String(guardado.id), hora: mapearMensaje(guardado, usuario.id).hora }
            : m
        )
      );
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setMensajes((prev) =>
        prev.map((m) => (m.id === idTemp ? { ...m, fallo: true } : m))
      );
    } finally {
      setEnviando(false);
    }
  };

  // ── Edición de mensajes ──
  const abrirEdicion = (item) => {
    if (item.tipo !== 'texto' || item.autor !== 'cliente' || item.fallo) return;
    setEditandoMensaje(item);
    setTextoEdicion(item.texto);
  };
  const guardarEdicion = async () => {
    if (!editandoMensaje || !textoEdicion.trim() || guardandoEdicion) return;
    const nuevoTexto = textoEdicion.trim();
    setGuardandoEdicion(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/mensaje/${editandoMensaje.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: nuevoTexto, userId: usuario.id }),
      });
      if (!res.ok) throw new Error('No se pudo editar el mensaje');
      setMensajes((prev) =>
        prev.map((m) => (m.id === editandoMensaje.id ? { ...m, texto: nuevoTexto, editado: true } : m))
      );
      setEditandoMensaje(null);
    } catch (err) {
      console.error('Error al editar mensaje:', err);
      setError('No se pudo editar el mensaje.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ── Subida de archivos ──
  const fetchConReintento = async (url, opciones, intentos = 2) => {
    let ultimoError;
    for (let i = 0; i < intentos; i++) {
      try { return await fetch(url, opciones); }
      catch (err) { ultimoError = err; if (i < intentos - 1) await new Promise((r) => setTimeout(r, 700)); }
    }
    throw ultimoError;
  };
  const subirYEnviarArchivo = async (archivo, extraForm = {}) => {
    if (!usuario?.id || (!chatId && (!usuario?.idCliente || !contacto?.idTrabajador))) { setError('Faltan datos para enviar el archivo.'); return; }
    setSubiendoArchivo(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const respuestaBlob = await fetch(archivo.uri);
        const blob = await respuestaBlob.blob();
        const nombre = archivo.name || archivo.fileName || `archivo_${Date.now()}`;
        formData.append('file', blob, nombre);
      } else {
        formData.append('file', { uri: archivo.uri, name: archivo.name || archivo.fileName || `archivo_${Date.now()}`, type: archivo.mimeType || archivo.type || 'application/octet-stream' });
      }
      if (chatId) formData.append('chatId', chatId);
      else { formData.append('idCliente', usuario.idCliente); formData.append('idTrabajador', contacto.idTrabajador); }
      formData.append('enviadorId', usuario.id);
      Object.entries(extraForm).forEach(([k, v]) => formData.append(k, String(v)));
      const res = await fetchConReintento(`${API_BASE_URL}/chat/mensaje/archivo`, { method: 'POST', body: formData });
      const textoBruto = await res.text();
      if (!res.ok) throw new Error(`Servidor respondió ${res.status}: ${textoBruto}`);
      const guardado = JSON.parse(textoBruto);
      if (!chatId && guardado.chat_id) setChatId(guardado.chat_id);
      setMensajes((prev) => [...prev, mapearMensaje(guardado, usuario.id)]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    } catch (err) { console.error('Error al subir archivo:', err); setError('No se pudo enviar el archivo.'); }
    finally { setSubiendoArchivo(false); }
  };

  const elegirDeGaleria = async () => {
    setMostrarOpciones(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Necesitamos permiso para acceder a tus fotos.'); return; }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!resultado.canceled && resultado.assets?.length) subirYEnviarArchivo(resultado.assets[0]);
  };
  const tomarFoto = async () => {
    setMostrarOpciones(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { setError('Necesitamos permiso para usar la cámara.'); return; }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!resultado.canceled && resultado.assets?.length) subirYEnviarArchivo(resultado.assets[0]);
  };
  const elegirDocumento = async () => {
    setMostrarOpciones(false);
    const resultado = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (resultado.canceled) return;
    const archivo = resultado.assets?.[0];
    if (archivo) subirYEnviarArchivo(archivo);
  };

  // ── Grabación de audio ──
  const iniciarGrabacion = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { setError('Necesitamos permiso para usar el micrófono.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setGrabacion(recording); setGrabando(true); setSegundosGrabando(0);
      intervaloGrabacionRef.current = setInterval(() => setSegundosGrabando((s) => s + 1), 1000);
    } catch (err) { console.error('Error al iniciar grabación:', err); setError('No se pudo iniciar la grabación.'); }
  };
  const cancelarGrabacion = async () => {
    clearInterval(intervaloGrabacionRef.current);
    if (grabacion) { try { await grabacion.stopAndUnloadAsync(); } catch {} }
    setGrabacion(null); setGrabando(false); setSegundosGrabando(0);
  };
  const detenerYEnviarGrabacion = async () => {
    clearInterval(intervaloGrabacionRef.current);
    if (!grabacion) return;
    try {
      await grabacion.stopAndUnloadAsync();
      const uri = grabacion.getURI();
      const duracion = segundosGrabando;
      setGrabacion(null); setGrabando(false); setSegundosGrabando(0);
      if (duracion < 1) return;
      await subirYEnviarArchivo({ uri, name: `audio_${Date.now()}.m4a`, mimeType: 'audio/m4a' }, { duracionAudio: duracion });
    } catch (err) { console.error('Error al detener grabación:', err); setError('No se pudo enviar el audio.'); }
  };

  // ── Propuesta ──
  const handleAgregarPropuesta = () => {
    setMostrarOpciones(false); setPropServicio(contacto?.servicio || ''); setPropPrecio(''); setPropDescripcion(''); setErrorPropuesta(null);
    setPropAnalizando(false); setPropErrorIA(null); setPropAnalisis(null); setPropServicioId(null); setPropContexto('');
    setPropRespuestas({}); setPropTextosOtro({}); setPropSelectorAbierto(false);
    setPropEmergencia(false); setPropTienePlazo(false); setPropFechaLimite(null);
    setPropMostrarPickerFecha(false); setPropMostrarPickerHora(false);
    setPropUsarOtraDireccion(false); setPropDireccion(''); setPropImagenes([]); setErrorImagenesProp(null); setMostrarPropuesta(true);
  };
  const cerrarPropuesta = () => { if (enviandoPropuesta || propAnalizando || subiendoImagenesProp) return; setMostrarPropuesta(false); };
  const invalidarAnalisisPropPrevio = useCallback(() => {
    if (propAnalisis) { setPropAnalisis(null); setPropServicioId(null); setPropContexto(''); setPropRespuestas({}); setPropTextosOtro({}); }
  }, [propAnalisis]);
  const seleccionarRespuestaProp = useCallback((idx, valor) => { setPropRespuestas((prev) => ({ ...prev, [idx]: valor })); }, []);
  const cambiarTextoOtroProp = useCallback((idx, txt) => { setPropTextosOtro((prev) => ({ ...prev, [idx]: txt })); }, []);
  const onCambiarPropEmergencia = useCallback((esEmergencia) => { setPropEmergencia(esEmergencia); if (esEmergencia) { setPropTienePlazo(true); setPropFechaLimite(new Date()); } }, []);
  const onCambiarPropFecha = useCallback((event, fechaSeleccionada) => { setPropMostrarPickerFecha(Platform.OS === 'ios'); if (event.type === 'dismissed' || !fechaSeleccionada) return; setPropFechaLimite((prev) => { const base = prev ? new Date(prev) : new Date(); base.setFullYear(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate()); return base; }); }, []);
  const onCambiarPropHora = useCallback((event, horaSeleccionada) => { setPropMostrarPickerHora(Platform.OS === 'ios'); if (event.type === 'dismissed' || !horaSeleccionada) return; setPropFechaLimite((prev) => { const base = prev ? new Date(prev) : new Date(); base.setHours(horaSeleccionada.getHours(), horaSeleccionada.getMinutes(), 0, 0); return base; }); }, []);

  // ── Fotos de la propuesta ──
  const agregarImagenesPropuestaGaleria = async () => {
    setErrorImagenesProp(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setErrorImagenesProp('Necesitamos permiso para acceder a tus fotos.'); return; }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsMultipleSelection: true, selectionLimit: MAX_IMAGENES_PROPUESTA });
    if (!resultado.canceled && resultado.assets?.length) setPropImagenes((prev) => [...prev, ...resultado.assets].slice(0, MAX_IMAGENES_PROPUESTA));
  };
  const tomarFotoPropuesta = async () => {
    setErrorImagenesProp(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { setErrorImagenesProp('Necesitamos permiso para usar la cámara.'); return; }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!resultado.canceled && resultado.assets?.length) setPropImagenes((prev) => [...prev, resultado.assets[0]].slice(0, MAX_IMAGENES_PROPUESTA));
  };
  const quitarImagenPropuesta = (idx) => { setPropImagenes((prev) => prev.filter((_, i) => i !== idx)); };

  // ── Subir imágenes de propuesta ──
  const subirImagenesPropuesta = async (idMensaje) => {
    if (propImagenes.length === 0) return [];
    setSubiendoImagenesProp(true);
    const urlsSubidas = [];
    try {
      for (let i = 0; i < propImagenes.length; i++) {
        const img = propImagenes[i];
        const formData = new FormData();
        if (Platform.OS === 'web') { const respuestaBlob = await fetch(img.uri); const blob = await respuestaBlob.blob(); formData.append('file', blob, img.fileName || `foto_${i}.jpg`); }
        else { formData.append('file', { uri: img.uri, name: img.fileName || `foto_${i}.jpg`, type: img.mimeType || 'image/jpeg' }); }
        formData.append('mensajeId', idMensaje); formData.append('orden', String(i));
        try {
          const resp = await fetch(`${API_BASE_URL}/chat/mensaje/propuesta-imagen`, { method: 'POST', body: formData });
          if (resp.ok) { const data = await resp.json(); if (data?.url) urlsSubidas.push(data.url); }
          else console.error(`No se pudo subir la imagen ${i + 1} de la propuesta`);
        } catch (e) { console.error('Error al subir una imagen de la propuesta:', e); }
      }
    } finally { setSubiendoImagenesProp(false); }
    return urlsSubidas;
  };

  // ── Enviar propuesta ──
  const enviarPropuesta = async () => {
    if (enviandoPropuesta || propAnalizando || propNecesitaAclaracion) return;
    const servicio = propServicio.trim();
    const precioNum = Number(propPrecio);
    if (!servicio) { setErrorPropuesta('Contá qué servicio le vas a proponer.'); return; }
    if (!propPrecio || isNaN(precioNum) || precioNum <= 0) { setErrorPropuesta('Ingresá un precio válido.'); return; }
    if (propUsarOtraDireccion && !propDireccion.trim()) { setErrorPropuesta('Ingresá la dirección del trabajo, o volvé a usar tu dirección predeterminada.'); return; }
    if (!usuario?.id || (!chatId && (!usuario?.idCliente || !contacto?.idTrabajador))) { setErrorPropuesta('Faltan datos para enviar la propuesta.'); return; }
    const datosExtra = {
      emergencia: propEmergencia,
      fechaRequerida: propTienePlazo && propFechaLimite ? propFechaLimite.toISOString().slice(0, 10) : null,
      horarioRequerido: propTienePlazo && propFechaLimite ? propFechaLimite.toTimeString().slice(0, 5) : null,
      direccion: propUsarOtraDireccion ? propDireccion.trim() : (usuario?.direccion ?? null),
    };
    const contenido = propDescripcion.trim() || `Propuesta de servicio: ${servicio}`;
    const idTemp = `local-${Date.now()}`;
    const nuevoLocal = { id: idTemp, tipo: 'servicio', autor: 'cliente', texto: contenido, servicio, precio: precioNum, estado: 'Pendiente', ...datosExtra, imagenes: [], hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) };
    setMensajes((prev) => [...prev, nuevoLocal]); setEnviandoPropuesta(true); setErrorPropuesta(null);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    try {
      const body = chatId
        ? { chatId, enviadorId: usuario.id, contenido, tipo: 'PROPUESTA', servicio_nombre: servicio, servicioId: propServicioId ?? undefined, precio: precioNum, ...datosExtra }
        : { idCliente: usuario.idCliente, idTrabajador: contacto.idTrabajador, enviadorId: usuario.id, contenido, tipo: 'PROPUESTA', servicio_nombre: servicio, servicioId: propServicioId ?? undefined, precio: precioNum, ...datosExtra };
      const res = await fetch(`${API_BASE_URL}/chat/mensaje`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Respuesta no OK del servidor');
      const guardado = await res.json();
      if (!chatId && guardado.chat_id) setChatId(guardado.chat_id);
      const idCreado = String(guardado.id);
      setMensajes((prev) => prev.map((m) => (m.id === idTemp ? { ...m, id: idCreado, hora: mapearMensaje(guardado, usuario.id).hora, estado: guardado.ESTADO_OFERTA ?? 'Pendiente' } : m)));
      if (propImagenes.length > 0) { const urls = await subirImagenesPropuesta(idCreado); setMensajes((prev) => prev.map((m) => (m.id === idCreado ? { ...m, imagenes: urls } : m))); }
      setMostrarPropuesta(false); setPropServicio(''); setPropPrecio(''); setPropDescripcion(''); setPropAnalisis(null); setPropServicioId(null); setPropContexto(''); setPropRespuestas({}); setPropTextosOtro({}); setPropEmergencia(false); setPropTienePlazo(false); setPropFechaLimite(null); setPropUsarOtraDireccion(false); setPropDireccion(''); setPropImagenes([]);
    } catch (err) { console.error('Error al enviar propuesta:', err); setMensajes((prev) => prev.map((m) => (m.id === idTemp ? { ...m, fallo: true } : m))); setErrorPropuesta('No se pudo enviar la propuesta. Probá de nuevo.'); }
    finally { setEnviandoPropuesta(false); }
  };

  // ── Analizar propuesta con IA ──
  const analizarPropuestaConIA = useCallback(async (descripcionExtra = '') => {
    if (!propDescripcionValida && !descripcionExtra) return;
    setPropAnalizando(true); setPropErrorIA(null);
    const base = descripcionExtra ? (propContexto || propDescripcion.trim()) : propDescripcion.trim();
    const textoFinal = descripcionExtra ? `${base} — Aclaración: ${descripcionExtra.trim()}` : base;
    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/analizar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descripcionOriginal: textoFinal }) });
      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.message || 'No se pudo analizar la propuesta');
      const data = json.data;
      setPropAnalisis(null); setPropRespuestas({}); setPropTextosOtro({}); setPropAnalisis(data); setPropServicioId(data.servicioId);
      setPropServicio((prev) => data.servicioId ? (data.servicios?.find((s) => s.id === data.servicioId)?.nombre ?? prev) : prev);
      if (data.descripcionMejorada) setPropDescripcion(data.descripcionMejorada);
      if (data.precioSugerido != null) setPropPrecio(String(data.precioSugerido));
      setPropContexto(textoFinal); setPropEmergencia((prev) => prev || !!data.emergencia);
    } catch (err) { setPropErrorIA(err.message || 'Ocurrió un error analizando la propuesta'); }
    finally { setPropAnalizando(false); }
  }, [propDescripcionValida, propDescripcion, propContexto]);

  const confirmarRespuestasProp = useCallback(() => {
    const txt = propPreguntasActuales.map((p, idx) => { const r = propRespuestas[idx]; const valor = r === OPCION_OTRO ? (propTextosOtro[idx] || '').trim() : r; return `${p.pregunta} → ${valor}`; }).join(' | ');
    if (!txt.trim()) return;
    analizarPropuestaConIA(txt);
  }, [propPreguntasActuales, propRespuestas, propTextosOtro, analizarPropuestaConIA]);

  // ── Detalle de propuesta ──
  const abrirDetalleServicio = (item) => setServicioDetalle(item);
  const cerrarDetalleServicio = () => setServicioDetalle(null);

  // ── Render ──
  const renderBurbujaTexto = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <TouchableOpacity activeOpacity={esCliente && !item.fallo ? 0.85 : 1} onLongPress={() => abrirEdicion(item)} style={[styles.filaMensaje, { justifyContent: esCliente ? 'flex-end' : 'flex-start' }]}>
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View style={[styles.burbuja, esCliente ? styles.burbujaCliente : styles.burbujaTrabajador, item.fallo && styles.burbujaFallo]}>
          <Text style={esCliente ? styles.textoBurbujaCliente : styles.textoBurbujaTrabajador}>{item.texto}</Text>
          <View style={styles.filaHora}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>{item.fallo ? 'No se pudo enviar' : item.hora}{item.editado ? ' · Editado' : ''}</Text>
            {esCliente && !item.fallo && (<Ionicons name={item.leido ? 'checkmark-done' : 'checkmark'} size={14} color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />)}
            {item.fallo && (<Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />)}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBurbujaVideo = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View style={[styles.filaMensaje, { justifyContent: esCliente ? 'flex-end' : 'flex-start' }]}>
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View style={[styles.burbujaImagenWrap, esCliente ? styles.burbujaImagenCliente : styles.burbujaImagenTrabajador, item.fallo && styles.burbujaFallo]}>
          <Video source={{ uri: item.texto }} style={styles.imagenChat} resizeMode={ResizeMode.COVER} useNativeControls isLooping={false} />
          <View style={[styles.filaHora, { paddingHorizontal: 4, paddingTop: 4 }]}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>{item.fallo ? 'No se pudo enviar' : item.hora}</Text>
            {esCliente && !item.fallo && (<Ionicons name={item.leido ? 'checkmark-done' : 'checkmark'} size={14} color={esCliente ? 'rgba(255,255,255,0.85)' : '#A0AEC0'} style={{ marginLeft: 4 }} />)}
            {item.fallo && (<Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />)}
          </View>
        </View>
      </View>
    );
  };

  const renderBurbujaImagen = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View style={[styles.filaMensaje, { justifyContent: esCliente ? 'flex-end' : 'flex-start' }]}>
        {!esCliente && <AvatarMini contacto={contacto} />}
        <TouchableOpacity activeOpacity={0.9} style={[styles.burbujaImagenWrap, esCliente ? styles.burbujaImagenCliente : styles.burbujaImagenTrabajador, item.fallo && styles.burbujaFallo]}>
          <Image source={{ uri: item.texto }} style={styles.imagenChat} resizeMode="cover" />
          <View style={[styles.filaHora, { paddingHorizontal: 4, paddingTop: 4 }]}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>{item.fallo ? 'No se pudo enviar' : item.hora}</Text>
            {esCliente && !item.fallo && (<Ionicons name={item.leido ? 'checkmark-done' : 'checkmark'} size={14} color={esCliente ? 'rgba(255,255,255,0.85)' : '#A0AEC0'} style={{ marginLeft: 4 }} />)}
            {item.fallo && (<Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />)}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTarjetaServicio = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View style={[styles.filaMensaje, { justifyContent: esCliente ? 'flex-end' : 'flex-start' }]}>
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View style={[styles.tarjetaServicio, item.fallo && styles.burbujaFallo]}>
          <View style={styles.tarjetaServicioBadgeRow}>
            <View style={styles.tarjetaServicioBadge}>
              <Ionicons name="hammer" size={12} color={BLUE_DARK} />
              <Text style={styles.tarjetaServicioBadgeText}>{item.estado ?? 'Propuesta'}</Text>
            </View>
            {item.emergencia && (
              <View style={styles.tarjetaEmergenciaBadge}>
                <Ionicons name="alert-circle" size={11} color="#fff" />
                <Text style={styles.tarjetaEmergenciaBadgeText}>Emergencia</Text>
              </View>
            )}
          </View>
          <Text style={styles.tarjetaServicioLabel}>Servicio</Text>
          <Text style={styles.tarjetaServicioValor}>{item.servicio ?? contacto?.servicio}</Text>
          {!!item.texto && item.texto !== `Propuesta de servicio: ${item.servicio}` && (<><Text style={[styles.tarjetaServicioLabel, { marginTop: 10 }]}>Detalle</Text><Text style={styles.tarjetaServicioDetalle}>{item.texto}</Text></>)}
          <View style={styles.tarjetaServicioDivider} />
          <Text style={styles.tarjetaServicioLabel}>Precio estimado</Text>
          <Text style={styles.tarjetaServicioPrecio}>${Number(item.precio).toLocaleString('es-AR')}</Text>
          <TouchableOpacity style={styles.tarjetaServicioBoton} activeOpacity={0.85} onPress={() => abrirDetalleServicio(item)}>
            <Text style={styles.tarjetaServicioBotonText}>Ver detalle</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.horaTrabajadorTexto}>{item.fallo ? 'No se pudo enviar' : item.hora}</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.tipo === 'servicio') return renderTarjetaServicio(item);
    if (item.tipo === 'imagen') return renderBurbujaImagen(item);
    if (item.tipo === 'video') return renderBurbujaVideo(item);
    if (item.tipo === 'audio') return <BurbujaAudio item={item} esCliente={item.autor === 'cliente'} contacto={contacto} />;
    return renderBurbujaTexto(item);
  };

  // Componentes movidos dentro del componente principal
  const Toggle2Opciones = ({ opciones, activo, onChange, colorActivo = BLUE_DARK }) => (
    <View style={styles.toggle2Track}>
      {opciones.map((opt, i) => {
        const seleccionado = activo === i;
        return (
          <TouchableOpacity key={opt} style={[styles.toggle2Btn, seleccionado && { backgroundColor: colorActivo }]} onPress={() => onChange(i)} activeOpacity={0.8}>
            <Text style={[styles.toggle2Text, seleccionado && styles.toggle2TextActivo]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const ImagenPropuestaThumb = ({ uri, onQuitar, deshabilitado }) => (
    <View style={styles.propImagenThumbWrap}>
      <Image source={{ uri }} style={styles.propImagenThumb} />
      <TouchableOpacity style={styles.propImagenThumbQuitar} onPress={onQuitar} disabled={deshabilitado} hitSlop={6}>
        <Ionicons name="close" size={12} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const BurbujaAudio = ({ item, esCliente, contacto }) => {
    const [reproduciendo, setReproduciendo] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [posicion, setPosicion] = useState(0);
    const [duracion, setDuracion] = useState((item.duracionAudio || 0) * 1000);
    const sonidoRef = useRef(null);

    useEffect(() => {
      (async () => {
        try {
          await Audio.requestPermissionsAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        } catch (e) {}
      })();
    }, []);

    const onStatusUpdate = useCallback((status) => {
      if (!status.isLoaded) return;
      setPosicion(status.positionMillis || 0);
      if (status.durationMillis) setDuracion(status.durationMillis);
      setReproduciendo(status.isPlaying);
      if (status.didJustFinish) { setReproduciendo(false); setPosicion(0); }
    }, []);

    const toggleReproducir = async () => {
      try {
        if (!sonidoRef.current) {
          setCargando(true);
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync({ uri: item.texto }, { progressUpdateIntervalMillis: 200 }, onStatusUpdate);
          sonidoRef.current = sound; setCargando(false); await sound.playAsync(); return;
        }
        const status = await sonidoRef.current.getStatusAsync();
        if (!status.isLoaded) return;
        if (status.isPlaying) { await sonidoRef.current.pauseAsync(); }
        else { if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0)) { await sonidoRef.current.setPositionAsync(0); } await sonidoRef.current.playAsync(); }
      } catch (err) { console.error('Error al reproducir audio:', err); setCargando(false); }
    };

    useEffect(() => { return () => { sonidoRef.current?.unloadAsync(); }; }, []);

    const progresoPct = duracion > 0 ? Math.min(100, (posicion / duracion) * 100) : 0;

    return (
      <View style={[styles.filaMensaje, { justifyContent: esCliente ? 'flex-end' : 'flex-start' }]}>
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View style={[styles.burbujaAudio, esCliente ? styles.burbujaCliente : styles.burbujaTrabajador, item.fallo && styles.burbujaFallo]}>
          <TouchableOpacity onPress={toggleReproducir} style={styles.audioPlayBtn} disabled={cargando}>
            {cargando ? (<ActivityIndicator size="small" color={esCliente ? '#fff' : BLUE_DARK} />) : (<Ionicons name={reproduciendo ? 'pause' : 'play'} size={18} color={esCliente ? '#fff' : BLUE_DARK} />)}
          </TouchableOpacity>
          <View style={styles.audioOndaWrap}>
            <View style={[styles.audioOndaFondo, { backgroundColor: esCliente ? 'rgba(255,255,255,0.35)' : 'rgba(21,101,216,0.18)' }]} />
            <View style={[styles.audioOndaProgreso, { width: `${progresoPct}%`, backgroundColor: esCliente ? '#fff' : BLUE_DARK }]} />
          </View>
          <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>{formatearTiempoAudio(reproduciendo || posicion > 0 ? posicion : duracion)}</Text>
          {item.fallo && <Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />}
        </View>
      </View>
    );
  };

  const AvatarMini = ({ contacto }) => {
    return contacto?.foto ? (
      <Image source={{ uri: contacto.foto }} style={styles.avatarMini} />
    ) : (
      <View style={styles.avatarMiniPlaceholder}>
        <Text style={styles.avatarMiniTexto}>{obtenerIniciales(contacto?.nombre)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={STATUS_BAR} />
      <Header />

      <View style={styles.chatHeader} onLayout={(e) => setAlturaHeader(e.nativeEvent.layout.height)}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatHeaderAvatarWrap}
          onPress={() => navigation.navigate('PerfilTrabajadorParaCliente', { idTrabajador: contacto.idTrabajador })}
          activeOpacity={0.7}
        >
          {contacto?.foto ? (
            <Image source={{ uri: contacto.foto }} style={styles.chatHeaderAvatar} />
          ) : (
            <View style={styles.chatHeaderAvatarPlaceholder}>
              <Text style={styles.chatHeaderAvatarText}>{obtenerIniciales(contacto?.nombre)}</Text>
            </View>
          )}
          {contacto?.online && <View style={styles.onlineDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, marginLeft: 10 }}
          onPress={() => navigation.navigate('PerfilTrabajadorParaCliente', { idTrabajador: contacto.idTrabajador })}
          activeOpacity={0.7}
        >
          <Text style={styles.chatHeaderNombre} numberOfLines={1}>{contacto?.nombre}</Text>
          <Text style={styles.chatHeaderEstado}>{contacto?.online ? 'En línea' : 'Desconectado'}{contacto?.servicio ? ` · ${contacto.servicio}` : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={() => setMostrarMenuHeader(true)}>
          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? alturaHeader : 0}>
        {cargando ? (
          <View style={styles.estadoWrap}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.estadoTexto}>Cargando conversación...</Text>
          </View>
        ) : error ? (
          <View style={styles.estadoWrap}>
            <Ionicons name="alert-circle-outline" size={38} color="#C7D2E3" />
            <Text style={styles.estadoTexto}>{error}</Text>
            <TouchableOpacity onPress={cargarMensajes} style={styles.reintentarBtn}>
              <Text style={styles.reintentarBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            onContentSizeChange={() => { if (mensajes.length > 0) { listRef.current?.scrollToEnd({ animated: false }); } }}
            ref={listRef}
            data={mensajes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listaContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.diaDividerWrap}>
                <View style={styles.diaDividerLine} />
                <Text style={styles.diaDividerText}>Hoy</Text>
                <View style={styles.diaDividerLine} />
              </View>
            }
            ListEmptyComponent={
              <View style={styles.estadoWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color="#C7D2E3" />
                <Text style={styles.estadoTexto}>Todavía no hay mensajes. ¡Escribí el primero!</Text>
              </View>
            }
          />
        )}

        <View style={[styles.inputBar, { paddingBottom: tecladoVisible ? 10 : Math.max(insets.bottom, 10) }]}>
          {grabando ? (
            <View style={styles.grabandoRow}>
              <View style={styles.grabandoDot} />
              <Text style={styles.grabandoTexto}>{Math.floor(segundosGrabando / 60)}:{String(segundosGrabando % 60).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={cancelarGrabacion} style={styles.grabandoCancelar}>
                <Ionicons name="trash" size={18} color={DANGER} />
              </TouchableOpacity>
              <TouchableOpacity onPress={detenerYEnviarGrabacion} style={styles.grabandoEnviar}>
                <Ionicons name="send" size={17} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.adjuntarButton} activeOpacity={0.8} onPress={() => setMostrarOpciones((v) => !v)}>
                {subiendoArchivo ? (<ActivityIndicator size="small" color={BLUE_DARK} />) : (<Ionicons name={mostrarOpciones ? 'close' : 'add'} size={22} color={BLUE_DARK} />)}
              </TouchableOpacity>
              <TextInput style={styles.textInput} placeholder="Escribí un mensaje..." placeholderTextColor="#9AA5B5" value={texto} onChangeText={setTexto} multiline />
              {texto.trim() ? (
                <TouchableOpacity style={styles.enviarButton} onPress={enviarMensaje} activeOpacity={0.85} disabled={enviando}>
                  {enviando ? (<ActivityIndicator size="small" color="#fff" />) : (<Ionicons name="send" size={17} color="#fff" />)}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.enviarButton} onPress={iniciarGrabacion} activeOpacity={0.85}>
                  <Ionicons name="mic" size={19} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Menú de opciones del botón "+" */}
      <Modal visible={mostrarOpciones} transparent animationType="fade" onRequestClose={() => setMostrarOpciones(false)}>
        <TouchableWithoutFeedback onPress={() => setMostrarOpciones(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuOpciones}>
                <TouchableOpacity style={styles.opcionItem} activeOpacity={0.75} onPress={elegirDeGaleria}>
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(21,101,216,0.10)' }]}>
                    <Ionicons name="images" size={20} color={BLUE_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Foto o video</Text>
                    <Text style={styles.opcionSubtitulo}>Desde tu galería</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
                </TouchableOpacity>
                <View style={styles.opcionDivider} />
                <TouchableOpacity style={styles.opcionItem} activeOpacity={0.75} onPress={tomarFoto}>
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(21,101,216,0.10)' }]}>
                    <Ionicons name="camera" size={20} color={BLUE_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Tomar foto</Text>
                    <Text style={styles.opcionSubtitulo}>Usar la cámara</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
                </TouchableOpacity>
                <View style={styles.opcionDivider} />
                <TouchableOpacity style={styles.opcionItem} activeOpacity={0.75} onPress={elegirDocumento}>
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(21,101,216,0.10)' }]}>
                    <Ionicons name="document-attach" size={20} color={BLUE_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Documento</Text>
                    <Text style={styles.opcionSubtitulo}>PDF, Word, etc.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
                </TouchableOpacity>
                <View style={styles.opcionDivider} />
                <TouchableOpacity style={styles.opcionItem} activeOpacity={0.75} onPress={handleAgregarPropuesta}>
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(21,101,216,0.10)' }]}>
                    <Ionicons name="pricetag" size={20} color={BLUE_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Enviar propuesta</Text>
                    <Text style={styles.opcionSubtitulo}>Mandá un presupuesto</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Menú del header (⋮) */}
      <Modal visible={mostrarMenuHeader} transparent animationType="fade" onRequestClose={() => setMostrarMenuHeader(false)}>
        <TouchableWithoutFeedback onPress={() => setMostrarMenuHeader(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuOpciones}>
                <TouchableOpacity style={styles.opcionItem} activeOpacity={0.75} onPress={() => { setMostrarMenuHeader(false); setMostrarConfirmVaciar(true); }}>
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(192,57,43,0.10)' }]}>
                    <Ionicons name="trash-outline" size={20} color={DANGER} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Vaciar chat</Text>
                    <Text style={styles.opcionSubtitulo}>Borrar todos los mensajes</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Confirmación de vaciar chat */}
      <Modal visible={mostrarConfirmVaciar} transparent animationType="fade" onRequestClose={() => setMostrarConfirmVaciar(false)}>
        <TouchableWithoutFeedback onPress={() => setMostrarConfirmVaciar(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuOpciones}>
                <View style={{ paddingVertical: 8 }}>
                  <Text style={styles.opcionTitulo}>¿Vaciar la conversación?</Text>
                  <Text style={styles.opcionSubtitulo}>Se borrarán todos los mensajes. Esta acción no se puede deshacer.</Text>
                </View>
                <View style={styles.opcionDivider} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.opcionItem, { flex: 1 }]} onPress={() => setMostrarConfirmVaciar(false)}>
                    <Text style={[styles.opcionTitulo, { color: BLUE_DARK }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.opcionItem, { flex: 1 }]} onPress={vaciarChat}>
                    <Text style={[styles.opcionTitulo, { color: DANGER }]}>Vaciar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Overlay: enviar propuesta */}
      <Modal visible={mostrarPropuesta} transparent animationType="slide" onRequestClose={cerrarPropuesta}>
        <KeyboardAvoidingView style={styles.propOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={cerrarPropuesta}>
            <View style={styles.propBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.propCard}>
            <View style={styles.propHandle} />

            <View style={styles.propHeaderRow}>
              <View style={styles.propHeaderIconWrap}>
                <Ionicons name="pricetag" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.propTitulo}>Enviar propuesta</Text>
                <Text style={styles.propSubtitulo}>Enviá un presupuesto a {contacto?.nombre ?? 'trabajador'}</Text>
              </View>
              <TouchableOpacity onPress={cerrarPropuesta} hitSlop={10} style={styles.propCerrarBtn}>
                <Ionicons name="close" size={16} color="#5B6478" />
              </TouchableOpacity>
            </View>

            <Text style={styles.propLabel}>Servicio</Text>
            <TextInput style={styles.propServicioInput} value={propServicio} onChangeText={setPropServicio} placeholder="Ej: Instalación de aire acondicionado" placeholderTextColor="#9AA5B5" />

            <Text style={styles.propLabel}>Descripción</Text>
            <TextInput style={styles.propTextArea} placeholder="Detalle el trabajo, materiales, garantía..." placeholderTextColor="#9AA5B5" multiline numberOfLines={3} value={propDescripcion} onChangeText={(t) => { setPropDescripcion(t); invalidarAnalisisPropPrevio(); }} />

            <Text style={styles.propLabel}>Fotos (opcional)</Text>
            <View style={styles.propImagenesRow}>
              {propImagenes.map((img, idx) => (
                <ImagenPropuestaThumb key={img.assetId ?? img.uri ?? idx} uri={img.uri} onQuitar={() => quitarImagenPropuesta(idx)} deshabilitado={subiendoImagenesProp} />
              ))}
              {propImagenes.length < MAX_IMAGENES_PROPUESTA && (
                <View style={styles.propImagenesBotonesWrap}>
                  <TouchableOpacity style={styles.propImagenAgregarBtn} onPress={agregarImagenesPropuestaGaleria} disabled={subiendoImagenesProp}>
                    <Ionicons name="images" size={18} color={BLUE} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.propImagenAgregarBtn} onPress={tomarFotoPropuesta} disabled={subiendoImagenesProp}>
                    <Ionicons name="camera" size={18} color={BLUE} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {errorImagenesProp && <Text style={styles.propError}>{errorImagenesProp}</Text>}

            <Text style={styles.propLabel}>¿Es una emergencia?</Text>
            <Toggle2Opciones opciones={['No', 'Sí, es urgente']} activo={propEmergencia ? 1 : 0} onChange={(i) => onCambiarPropEmergencia(i === 1)} />

            {!propEmergencia && (
              <>
                <Text style={styles.propLabel}>¿Tenés un plazo o fecha límite?</Text>
                <Toggle2Opciones opciones={['No, sin apuro', 'Sí, elegir fecha']} activo={propTienePlazo ? 1 : 0} onChange={(i) => { const activar = i === 1; setPropTienePlazo(activar); if (activar && !propFechaLimite) setPropFechaLimite(new Date()); invalidarAnalisisPropPrevio(); }} />
                {propTienePlazo && (
                  <View style={styles.propPlazoRow}>
                    <TouchableOpacity style={styles.propPlazoBox} onPress={() => setPropMostrarPickerFecha(true)}>
                      <Text style={styles.propPlazoBoxLabel}>Fecha</Text>
                      <Text style={styles.propPlazoBoxValue}>{propFechaLimite ? propFechaLimite.toLocaleDateString('es-AR') : 'Elegir'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.propPlazoBox} onPress={() => setPropMostrarPickerHora(true)}>
                      <Text style={styles.propPlazoBoxLabel}>Hora</Text>
                      <Text style={styles.propPlazoBoxValue}>{propFechaLimite ? propFechaLimite.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'Elegir'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {propTienePlazo && propMostrarPickerFecha && (
                  <DateTimePicker value={propFechaLimite || new Date()} mode="date" minimumDate={new Date()} display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onCambiarPropFecha} />
                )}
                {propTienePlazo && propMostrarPickerHora && (
                  <DateTimePicker value={propFechaLimite || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onCambiarPropHora} />
                )}
              </>
            )}

            <Text style={styles.propLabel}>Precio</Text>
            <View style={styles.propPriceRow}>
              <Text style={styles.propPriceCurrency}>$</Text>
              <TextInput style={styles.propPriceInput} placeholder="0" placeholderTextColor="#9AA5B5" keyboardType="numeric" value={propPrecio} onChangeText={setPropPrecio} editable={!enviandoPropuesta} />
            </View>

            {propAnalisis && !propNecesitaAclaracion && (
              <>
                <Text style={styles.propLabel}>Servicio sugerido por IA</Text>
                <TouchableOpacity style={styles.propSelectBox} onPress={() => setPropSelectorAbierto((v) => !v)}>
                  <Text style={styles.propSelectText}>{propAnalisis.servicios?.find((s) => s.id === propServicioId)?.nombre ?? 'Seleccionar servicio'}</Text>
                  <Ionicons name={propSelectorAbierto ? 'chevron-up' : 'chevron-down'} size={16} color="#5B6478" />
                </TouchableOpacity>
                {propSelectorAbierto && (
                  <View style={styles.propDropdown}>
                    {propAnalisis.servicios?.map((s) => (
                      <TouchableOpacity key={s.id} style={[styles.propDropdownItem, s.id === propServicioId && styles.propDropdownItemActivo]} onPress={() => { setPropServicioId(s.id); setPropSelectorAbierto(false); }}>
                        <View style={styles.propDropdownItemTextWrap}>
                          <Text style={styles.propDropdownItemCategoria}>{s.categoria}</Text>
                          <Text style={[styles.propDropdownItemText, s.id === propServicioId && styles.propDropdownItemTextActivo]}>{s.nombre}</Text>
                        </View>
                        {s.id === propServicioId && <Ionicons name="checkmark-circle" size={20} color={BLUE} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {propAnalisis.precioMin != null && propAnalisis.precioMax != null && (
                  <Text style={styles.propPriceRange}>Rango estimado: ${propAnalisis.precioMin.toLocaleString('es-AR')} – ${propAnalisis.precioMax.toLocaleString('es-AR')}</Text>
                )}
              </>
            )}

            {propAnalizando ? (
              <View style={styles.propAnalizandoRow}>
                <ActivityIndicator size="small" color={ACCENT} />
                <Text style={styles.propAnalizandoTexto}>Analizando con IA...</Text>
              </View>
            ) : propErrorIA ? (
              <Text style={styles.propError}>{propErrorIA}</Text>
            ) : null}

            {propNecesitaAclaracion && propPreguntasActuales.length > 0 && (
              <View style={styles.propAclaracionBox}>
                <View style={styles.propAclaracionIconRow}>
                  <View style={styles.propAclaracionIconWrap}>
                    <Ionicons name="help" size={16} color="#fff" />
                  </View>
                  <Text style={styles.propAclaracionTitulo}>{propPreguntasActuales.length > 1 ? 'Necesitamos un poco más de info' : 'Necesitamos un dato más'}</Text>
                </View>
                {propPreguntasActuales.map((p, idx) => (
                  <View key={idx} style={styles.propPreguntaItem}>
                    <Text style={styles.propPreguntaTexto}>{p.pregunta}</Text>
                    <View style={styles.propChipsRow}>
                      {p.opciones.map((opcion) => {
                        const activo = propRespuestas[idx] === opcion;
                        return (
                          <TouchableOpacity key={opcion} style={[styles.propChip, activo && styles.propChipActivo]} onPress={() => seleccionarRespuestaProp(idx, opcion)} disabled={propAnalizando}>
                            <Text style={[styles.propChipText, activo && styles.propChipTextActivo]}>{opcion}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity style={[styles.propChip, styles.propChipOtro, propRespuestas[idx] === OPCION_OTRO && styles.propChipActivo]} onPress={() => seleccionarRespuestaProp(idx, OPCION_OTRO)} disabled={propAnalizando}>
                        <Ionicons name="create-outline" size={14} color={propRespuestas[idx] === OPCION_OTRO ? '#fff' : '#5B6478'} style={styles.propChipIcon} />
                        <Text style={[styles.propChipText, propRespuestas[idx] === OPCION_OTRO && styles.propChipTextActivo]}>Otro</Text>
                      </TouchableOpacity>
                    </View>
                    {propRespuestas[idx] === OPCION_OTRO && (
                      <TextInput style={styles.propOtroInput} placeholder="Escribí tu respuesta..." placeholderTextColor="#98A2B3" value={propTextosOtro[idx] || ''} onChangeText={(t) => cambiarTextoOtroProp(idx, t)} editable={!propAnalizando} />
                    )}
                  </View>
                ))}
                <TouchableOpacity style={[styles.propAiButton, (!propTodasRespondidas || propAnalizando) && styles.propAiButtonDisabled]} onPress={confirmarRespuestasProp} disabled={!propTodasRespondidas || propAnalizando}>
                  {propAnalizando ? (<ActivityIndicator color="#fff" />) : (<><Ionicons name="arrow-forward-circle" size={18} color="#fff" style={styles.propAiButtonIcon} /><Text style={styles.propAiButtonText}>Continuar con esta info</Text></>)}
                </TouchableOpacity>
              </View>
            )}

            {errorPropuesta && <Text style={styles.propError}>{errorPropuesta}</Text>}

            <TouchableOpacity style={[styles.propEnviarBtn, enviandoPropuesta && styles.propEnviarBtnDisabled]} activeOpacity={0.85} onPress={enviarPropuesta} disabled={enviandoPropuesta}>
              {enviandoPropuesta ? (<ActivityIndicator color="#fff" />) : (<><Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.propEnviarBtnText}>Enviar propuesta</Text></>)}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detalle de propuesta */}
      <Modal visible={!!servicioDetalle} transparent animationType="slide" onRequestClose={cerrarDetalleServicio}>
        <TouchableWithoutFeedback onPress={cerrarDetalleServicio}>
          <View style={styles.propOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.propCard}>
                <View style={styles.propHandle} />
                <View style={styles.propHeaderRow}>
                  <View style={styles.propHeaderIconWrap}>
                    <Ionicons name="hammer" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.propTitulo}>Detalle de propuesta</Text>
                    <Text style={styles.propSubtitulo}>{servicioDetalle?.servicio}</Text>
                  </View>
                  <TouchableOpacity onPress={cerrarDetalleServicio} hitSlop={10} style={styles.propCerrarBtn}>
                    <Ionicons name="close" size={16} color="#5B6478" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.propLabel}>Precio</Text>
                <Text style={styles.propDetallePrecio}>${Number(servicioDetalle?.precio ?? 0).toLocaleString('es-AR')}</Text>
                <Text style={styles.propLabel}>Descripción</Text>
                <Text style={styles.propDetalleTexto}>{servicioDetalle?.texto}</Text>
                {servicioDetalle?.emergencia && (<><Text style={styles.propLabel}>Emergencia</Text><Text style={styles.propDetalleEmergencia}>Sí</Text></>)}
                {servicioDetalle?.fechaRequerida && (<><Text style={styles.propLabel}>Fecha requerida</Text><Text style={styles.propDetalleTexto}>{servicioDetalle.fechaRequerida}</Text></>)}
                {servicioDetalle?.horarioRequerido && (<><Text style={styles.propLabel}>Horario requerido</Text><Text style={styles.propDetalleTexto}>{servicioDetalle.horarioRequerido}</Text></>)}
                {servicioDetalle?.direccion && (<><Text style={styles.propLabel}>Dirección</Text><Text style={styles.propDetalleTexto}>{servicioDetalle.direccion}</Text></>)}
                {!!servicioDetalle?.imagenes?.length && (<><Text style={styles.propLabel}>Fotos</Text><View style={styles.propDetalleImagenesRow}>{servicioDetalle.imagenes.map((img, idx) => (<Image key={idx} source={{ uri: img }} style={styles.propDetalleImagen} />))}</View></>)}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE_DARK, paddingHorizontal: 12, paddingVertical: 10, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 2 },
  chatHeaderAvatarWrap: { position: 'relative' },
  chatHeaderAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  chatHeaderAvatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: BLUE_LIGHT, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  chatHeaderAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: '#3ECF6E', borderWidth: 2, borderColor: BLUE_DARK },
  chatHeaderNombre: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chatHeaderEstado: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  headerIconButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  estadoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  estadoTexto: { marginTop: 10, color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  reintentarBtn: { marginTop: 14, backgroundColor: BLUE, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  reintentarBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  listaContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18, flexGrow: 1 },
  diaDividerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  diaDividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  diaDividerText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginHorizontal: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  filaMensaje: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  avatarMini: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  avatarMiniPlaceholder: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
  avatarMiniTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },
  burbuja: { maxWidth: '74%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  burbujaCliente: { backgroundColor: BLUE, borderBottomRightRadius: 4, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2 },
  burbujaTrabajador: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  burbujaFallo: { opacity: 0.6 },
  textoBurbujaCliente: { color: '#fff', fontSize: 14, lineHeight: 20 },
  textoBurbujaTrabajador: { color: colors.text, fontSize: 14, lineHeight: 20 },
  filaHora: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  horaClienteTexto: { color: colors.textTertiary, fontSize: 10, marginTop: 6 },
  horaTrabajadorTexto: { color: colors.textTertiary, fontSize: 10 },
  burbujaImagenWrap: { maxWidth: '65%', borderRadius: 18, overflow: 'hidden', backgroundColor: colors.card, padding: 5 },
  burbujaImagenCliente: { borderBottomRightRadius: 4, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2 },
  burbujaImagenTrabajador: { borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  imagenChat: { width: 210, height: 210, borderRadius: 14, backgroundColor: colors.inputBg },
  tarjetaServicio: { maxWidth: '78%', backgroundColor: colors.card, borderRadius: 20, borderBottomLeftRadius: 4, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3 },
  tarjetaServicioBadgeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(21,101,216,0.08)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, marginBottom: 10, gap: 5 },
  tarjetaServicioBadgeText: { color: BLUE_DARK, fontSize: 10, fontWeight: '700' },
  tarjetaEmergenciaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(226,55,68,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tarjetaEmergenciaBadgeText: { color: '#E23744', fontSize: 10, fontWeight: '700' },
  tarjetaServicioLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 4 },
  tarjetaServicioValor: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  tarjetaServicioDetalle: { color: colors.text, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  tarjetaServicioDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  tarjetaServicioPrecio: { color: BLUE_DARK, fontSize: 20, fontWeight: '800', marginTop: 2 },
  tarjetaServicioBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE, borderRadius: 14, paddingVertical: 10, marginTop: 14, gap: 6 },
  tarjetaServicioBotonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  adjuntarButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(21,101,216,0.10)', justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, minHeight: 38, maxHeight: 100, backgroundColor: colors.inputBg, borderRadius: 19, paddingHorizontal: 16, paddingVertical: 9, fontSize: 14, color: colors.text },
  enviarButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center', shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  enviarButtonDisabled: { backgroundColor: '#B9C6DB', shadowOpacity: 0 },
  grabandoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 19, paddingHorizontal: 14, paddingVertical: 9, gap: 10 },
  grabandoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: DANGER },
  grabandoTexto: { color: colors.text, fontWeight: '700', fontSize: 14 },
  grabandoCancelar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(192,57,43,0.10)', justifyContent: 'center', alignItems: 'center' },
  grabandoEnviar: { width: 34, height: 34, borderRadius: 17, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  menuOpciones: { backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 84, borderRadius: 18, paddingVertical: 6, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
  opcionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  opcionIconoWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  opcionTitulo: { color: colors.text, fontSize: 14, fontWeight: '700' },
  opcionSubtitulo: { color: colors.textSecondary, fontSize: 11.5, marginTop: 1 },
  opcionDivider: { height: 1, backgroundColor: colors.border, marginLeft: 14 + 38 + 12 },
  propOverlay: { flex: 1, justifyContent: 'flex-end' },
  propBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  propCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 18, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  propHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 },
  propHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  propHeaderIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
  propTitulo: { fontSize: 16, fontWeight: '800', color: colors.text },
  propSubtitulo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  propCerrarBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' },
  propLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  propServicioInput: { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text },
  propTextArea: { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, minHeight: 70, textAlignVertical: 'top' },
  propImagenesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  propImagenThumbWrap: { position: 'relative' },
  propImagenThumb: { width: 64, height: 64, borderRadius: 10 },
  propImagenThumbQuitar: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: DANGER, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  propImagenesBotonesWrap: { flexDirection: 'row', gap: 8 },
  propImagenAgregarBtn: { width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderColor: BLUE, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(21,101,216,0.06)' },
  toggle2Track: { backgroundColor: colors.inputBg, borderRadius: 999, height: 40, flexDirection: 'row', padding: 3 },
  toggle2Btn: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  toggle2Text: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  toggle2TextActivo: { color: '#fff' },
  propPlazoRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  propPlazoBox: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  propPlazoBoxLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  propPlazoBoxValue: { fontSize: 13.5, fontWeight: '700', color: colors.text, marginTop: 2 },
  propPriceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14 },
  propPriceCurrency: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginRight: 4 },
  propPriceInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12 },
  propSelectBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  propSelectText: { fontSize: 14, color: colors.text },
  propDropdown: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' },
  propDropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  propDropdownItemActivo: { backgroundColor: 'rgba(21,101,216,0.08)' },
  propDropdownItemTextWrap: { flex: 1 },
  propDropdownItemCategoria: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  propDropdownItemText: { fontSize: 14, fontWeight: '600', color: colors.text },
  propDropdownItemTextActivo: { color: BLUE, fontWeight: '800' },
  propPriceRange: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  propAnalizandoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  propAnalizandoTexto: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  propError: { color: DANGER, fontSize: 12.5, marginTop: 8 },
  propAclaracionBox: { backgroundColor: colors.surfaceVariant, borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: ACCENT_BORDER },
  propAclaracionIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  propAclaracionIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center' },
  propAclaracionTitulo: { fontSize: 14, fontWeight: '800', color: ACCENT },
  propPreguntaItem: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  propPreguntaTexto: { fontSize: 13.5, fontWeight: '700', color: colors.text, marginBottom: 10 },
  propChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  propChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
  propChipActivo: { backgroundColor: BLUE, borderColor: BLUE },
  propChipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  propChipTextActivo: { color: '#fff' },
  propChipOtro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  propChipIcon: { marginRight: 0 },
  propOtroInput: { backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, color: colors.text, marginTop: 10 },
  propAiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, marginTop: 16, shadowColor: ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  propAiButtonDisabled: { opacity: 0.5, shadowOpacity: 0 },
  propAiButtonIcon: { marginRight: 2 },
  propAiButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  propEnviarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, marginTop: 20, shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  propEnviarBtnDisabled: { opacity: 0.6 },
  propEnviarBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  propDetallePrecio: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  propDetalleTexto: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 4 },
  propDetalleEmergencia: { fontSize: 14, fontWeight: '700', color: DANGER, marginTop: 4 },
  propDetalleImagenesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  propDetalleImagen: { width: 80, height: 80, borderRadius: 10 },
  burbujaAudio: { maxWidth: '74%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioPlayBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center' },
  audioOndaWrap: { flex: 1, height: 24, justifyContent: 'center', position: 'relative' },
  audioOndaFondo: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2 },
  audioOndaProgreso: { position: 'absolute', left: 0, height: 3, borderRadius: 2 },
});