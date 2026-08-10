import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
    hora: m.created_at
      ? new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : '',
  };
};

// ── Burbuja de audio (componente separado: necesita su propio estado/hooks) ──
function formatearTiempoAudio(ms) {
  const total = Math.floor((ms || 0) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function BurbujaAudio({ item, esCliente, contacto }) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [posicion, setPosicion] = useState(0);
  const [duracion, setDuracion] = useState((item.duracionAudio || 0) * 1000);
  const sonidoRef = useRef(null);
useEffect(() => {
  // Precalentamos permiso + modo de audio para que la primera grabación
  // no falle por timing con el sistema operativo.
  (async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    } catch (e) {
      // Silencioso: si falla acá, se reintenta solo cuando el usuario grabe
    }
  })();
}, []);
  const onStatusUpdate = useCallback((status) => {
    if (!status.isLoaded) return;
    setPosicion(status.positionMillis || 0);
    if (status.durationMillis) setDuracion(status.durationMillis);
    setReproduciendo(status.isPlaying);
    if (status.didJustFinish) {
      setReproduciendo(false);
      setPosicion(0);
    }
  }, []);

  const toggleReproducir = async () => {
    try {
      if (!sonidoRef.current) {
        setCargando(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.texto },
          { progressUpdateIntervalMillis: 200 },
          onStatusUpdate
        );
        sonidoRef.current = sound;
        setCargando(false);
        await sound.playAsync();
        return;
      }

      const status = await sonidoRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await sonidoRef.current.pauseAsync();
      } else {
        if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0)) {
          await sonidoRef.current.setPositionAsync(0);
        }
        await sonidoRef.current.playAsync();
      }
    } catch (err) {
      console.error('Error al reproducir audio:', err);
      setCargando(false);
    }
  };

  useEffect(() => {
    return () => { sonidoRef.current?.unloadAsync(); };
  }, []);

  const progresoPct = duracion > 0 ? Math.min(100, (posicion / duracion) * 100) : 0;

  return (
    <View style={[styles.filaMensaje, { justifyContent: esCliente ? 'flex-end' : 'flex-start' }]}>
      {!esCliente && <AvatarMini contacto={contacto} />}
      <View
        style={[
          styles.burbujaAudio,
          esCliente ? styles.burbujaCliente : styles.burbujaTrabajador,
          item.fallo && styles.burbujaFallo,
        ]}
      >
        <TouchableOpacity onPress={toggleReproducir} style={styles.audioPlayBtn} disabled={cargando}>
          {cargando ? (
            <ActivityIndicator size="small" color={esCliente ? '#fff' : BLUE_DARK} />
          ) : (
            <Ionicons name={reproduciendo ? 'pause' : 'play'} size={18} color={esCliente ? '#fff' : BLUE_DARK} />
          )}
        </TouchableOpacity>

        <View style={styles.audioOndaWrap}>
          <View
            style={[
              styles.audioOndaFondo,
              { backgroundColor: esCliente ? 'rgba(255,255,255,0.35)' : 'rgba(21,101,216,0.18)' },
            ]}
          />
          <View
            style={[
              styles.audioOndaProgreso,
              { width: `${progresoPct}%`, backgroundColor: esCliente ? '#fff' : BLUE_DARK },
            ]}
          />
        </View>

        <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>
          {formatearTiempoAudio(reproduciendo || posicion > 0 ? posicion : duracion)}
        </Text>

        {item.fallo && <Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />}
      </View>
    </View>
  );
}

export default function ChatCliente({ route, navigation }) {
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

  // ── Grabación de audio ──────────────────────────────────────────────
  const [grabando, setGrabando] = useState(false);
  const [grabacion, setGrabacion] = useState(null);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const intervaloGrabacionRef = useRef(null);

  // ── Edición de mensajes ──────────────────────────────────────────────
  const [editandoMensaje, setEditandoMensaje] = useState(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // ── Overlay de "Enviar propuesta" ──────────────────────────────────
  const [mostrarPropuesta, setMostrarPropuesta] = useState(false);
  const [propServicio, setPropServicio] = useState('');
  const [propPrecio, setPropPrecio] = useState('');
  const [propDescripcion, setPropDescripcion] = useState('');
  const [enviandoPropuesta, setEnviandoPropuesta] = useState(false);
  const [errorPropuesta, setErrorPropuesta] = useState(null);

  const [propAnalizando, setPropAnalizando] = useState(false);
  const [propErrorIA, setPropErrorIA] = useState(null);
  const [propAnalisis, setPropAnalisis] = useState(null);
  const [propServicioId, setPropServicioId] = useState(null);
  const [propContexto, setPropContexto] = useState('');
  const [propRespuestas, setPropRespuestas] = useState({});
  const [propTextosOtro, setPropTextosOtro] = useState({});
  const [propSelectorAbierto, setPropSelectorAbierto] = useState(false);

  const propDescripcionValida = propDescripcion.trim().length >= 10;
  const propNecesitaAclaracion =
    propAnalisis !== null && propAnalisis?.necesitaAclaracion === true && !propAnalisis?.servicioId;
  const propPreguntasActuales = propNecesitaAclaracion ? (propAnalisis?.preguntas || []) : [];

  const propTodasRespondidas = useMemo(() => {
    if (propPreguntasActuales.length === 0) return false;
    return propPreguntasActuales.every((_, idx) => {
      const r = propRespuestas[idx];
      if (!r) return false;
      if (r === OPCION_OTRO) return !!(propTextosOtro[idx] && propTextosOtro[idx].trim());
      return true;
    });
  }, [propPreguntasActuales, propRespuestas, propTextosOtro]);

  const propServicioElegido = propAnalisis?.servicios?.find((s) => s.id === propServicioId);

  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
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
        if (cancelado) return;

        if (data.chatId) {
          setChatId(data.chatId);
        } else {
          setCargando(false);
        }
      } catch (err) {
        console.error('Error al resolver chat existente:', err);
        if (!cancelado) setCargando(false);
      }
    };

    resolverChatExistente();
    return () => { cancelado = true; };
  }, [route?.params?.chatId, usuario?.idCliente, contacto?.idTrabajador]);

  useEffect(() => {
    if (!chatId || !usuario?.id) return;
    fetch(`${API_BASE_URL}/chat/${chatId}/leido`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: usuario.id }),
    }).catch((err) => console.error('Error al marcar como leído:', err));
  }, [chatId, usuario]);

  const cargarMensajes = useCallback(async () => {
    if (!chatId) return;
    try {
      setCargando(true);
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
    if (chatId) cargarMensajes();
  }, [chatId, cargarMensajes]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [mensajes.length]);

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

      if (!chatId && guardado.chat_id) {
        setChatId(guardado.chat_id);
      }

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

  // --- Edición de mensajes de texto propios ---
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
const fetchConReintento = async (url, opciones, intentos = 2) => {
  let ultimoError;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fetch(url, opciones);
    } catch (err) {
      ultimoError = err;
      if (i < intentos - 1) {
        await new Promise((r) => setTimeout(r, 700));
      }
    }
  }
  throw ultimoError;
};
  // --- Subida de archivos (fotos, docs, audios) ---
  const subirYEnviarArchivo = async (archivo, extraForm = {}) => {
    if (!usuario?.id || (!chatId && (!usuario?.idCliente || !contacto?.idTrabajador))) {
      setError('Faltan datos para enviar el archivo.');
      return;
    }

    setSubiendoArchivo(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const respuestaBlob = await fetch(archivo.uri);
        const blob = await respuestaBlob.blob();
        const nombre = archivo.name || archivo.fileName || `archivo_${Date.now()}`;
        formData.append('file', blob, nombre);
      } else {
        formData.append('file', {
          uri: archivo.uri,
          name: archivo.name || archivo.fileName || `archivo_${Date.now()}`,
          type: archivo.mimeType || archivo.type || 'application/octet-stream',
        });
      }

      if (chatId) {
        formData.append('chatId', chatId);
      } else {
        formData.append('idCliente', usuario.idCliente);
        formData.append('idTrabajador', contacto.idTrabajador);
      }
      formData.append('enviadorId', usuario.id);
      Object.entries(extraForm).forEach(([k, v]) => formData.append(k, String(v)));

      const res = await fetchConReintento(`${API_BASE_URL}/chat/mensaje/archivo`, {
  method: 'POST',
  body: formData,
});

      const textoBruto = await res.text();
      if (!res.ok) throw new Error(`Servidor respondió ${res.status}: ${textoBruto}`);
      const guardado = JSON.parse(textoBruto);

      if (!chatId && guardado.chat_id) {
        setChatId(guardado.chat_id);
      }

      setMensajes((prev) => [...prev, mapearMensaje(guardado, usuario.id)]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError('No se pudo enviar el archivo.');
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const elegirDeGaleria = async () => {
    setMostrarOpciones(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!resultado.canceled && resultado.assets?.length) {
      subirYEnviarArchivo(resultado.assets[0]);
    }
  };

  const tomarFoto = async () => {
    setMostrarOpciones(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Necesitamos permiso para usar la cámara.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!resultado.canceled && resultado.assets?.length) {
      subirYEnviarArchivo(resultado.assets[0]);
    }
  };

  const elegirDocumento = async () => {
    setMostrarOpciones(false);
    const resultado = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (resultado.canceled) return;
    const archivo = resultado.assets?.[0];
    if (archivo) subirYEnviarArchivo(archivo);
  };

  // --- Grabación de audio ---
  const iniciarGrabacion = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Necesitamos permiso para usar el micrófono.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setGrabacion(recording);
      setGrabando(true);
      setSegundosGrabando(0);
      intervaloGrabacionRef.current = setInterval(() => {
        setSegundosGrabando((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      setError('No se pudo iniciar la grabación.');
    }
  };

  const cancelarGrabacion = async () => {
    clearInterval(intervaloGrabacionRef.current);
    if (grabacion) {
      try { await grabacion.stopAndUnloadAsync(); } catch {}
    }
    setGrabacion(null);
    setGrabando(false);
    setSegundosGrabando(0);
  };

  const detenerYEnviarGrabacion = async () => {
    clearInterval(intervaloGrabacionRef.current);
    if (!grabacion) return;
    try {
      await grabacion.stopAndUnloadAsync();
      const uri = grabacion.getURI();
      const duracion = segundosGrabando;
      setGrabacion(null);
      setGrabando(false);
      setSegundosGrabando(0);

      if (duracion < 1) return; // grabación muy corta, la ignoramos

      await subirYEnviarArchivo(
        { uri, name: `audio_${Date.now()}.m4a`, mimeType: 'audio/m4a' },
        { duracionAudio: duracion }
      );
    } catch (err) {
      console.error('Error al detener grabación:', err);
      setError('No se pudo enviar el audio.');
    }
  };

  // --- Propuesta ---
  const handleAgregarPropuesta = () => {
    setMostrarOpciones(false);
    setPropServicio(contacto?.servicio || '');
    setPropPrecio('');
    setPropDescripcion('');
    setErrorPropuesta(null);
    setPropAnalizando(false);
    setPropErrorIA(null);
    setPropAnalisis(null);
    setPropServicioId(null);
    setPropContexto('');
    setPropRespuestas({});
    setPropTextosOtro({});
    setPropSelectorAbierto(false);
    setMostrarPropuesta(true);
  };

  const cerrarPropuesta = () => {
    if (enviandoPropuesta || propAnalizando) return;
    setMostrarPropuesta(false);
  };

  const invalidarAnalisisPropPrevio = useCallback(() => {
    if (propAnalisis) {
      setPropAnalisis(null);
      setPropServicioId(null);
      setPropContexto('');
      setPropRespuestas({});
      setPropTextosOtro({});
    }
  }, [propAnalisis]);

  const seleccionarRespuestaProp = useCallback((idx, valor) => {
    setPropRespuestas((prev) => ({ ...prev, [idx]: valor }));
  }, []);

  const cambiarTextoOtroProp = useCallback((idx, txt) => {
    setPropTextosOtro((prev) => ({ ...prev, [idx]: txt }));
  }, []);

  const analizarPropuestaConIA = useCallback(async (descripcionExtra = '') => {
    if (!propDescripcionValida && !descripcionExtra) return;
    setPropAnalizando(true);
    setPropErrorIA(null);

    const base = descripcionExtra ? (propContexto || propDescripcion.trim()) : propDescripcion.trim();
    const textoFinal = descripcionExtra ? `${base} — Aclaración: ${descripcionExtra.trim()}` : base;

    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcionOriginal: textoFinal }),
      });

      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.message || 'No se pudo analizar la propuesta');

      const data = json.data;
      setPropAnalisis(null);
      setPropRespuestas({});
      setPropTextosOtro({});
      setPropAnalisis(data);
      setPropServicioId(data.servicioId);
      setPropServicio((prev) => data.servicioId ? (data.servicios?.find((s) => s.id === data.servicioId)?.nombre ?? prev) : prev);
      if (data.descripcionMejorada) setPropDescripcion(data.descripcionMejorada);
      if (data.precioSugerido != null) setPropPrecio(String(data.precioSugerido));
      setPropContexto(textoFinal);
    } catch (err) {
      setPropErrorIA(err.message || 'Ocurrió un error analizando la propuesta');
    } finally {
      setPropAnalizando(false);
    }
  }, [propDescripcionValida, propDescripcion, propContexto]);

  const confirmarRespuestasProp = useCallback(() => {
    const txt = propPreguntasActuales
      .map((p, idx) => {
        const r = propRespuestas[idx];
        const valor = r === OPCION_OTRO ? (propTextosOtro[idx] || '').trim() : r;
        return `${p.pregunta} → ${valor}`;
      })
      .join(' | ');
    if (!txt.trim()) return;
    analizarPropuestaConIA(txt);
  }, [propPreguntasActuales, propRespuestas, propTextosOtro, analizarPropuestaConIA]);

  const enviarPropuesta = async () => {
    if (enviandoPropuesta || propAnalizando || propNecesitaAclaracion) return;

    const servicio = propServicio.trim();
    const precioNum = Number(propPrecio);

    if (!servicio) {
      setErrorPropuesta('Contá qué servicio le vas a proponer.');
      return;
    }
    if (!propPrecio || isNaN(precioNum) || precioNum <= 0) {
      setErrorPropuesta('Ingresá un precio válido.');
      return;
    }
    if (!usuario?.id || (!chatId && (!usuario?.idCliente || !contacto?.idTrabajador))) {
      setErrorPropuesta('Faltan datos para enviar la propuesta.');
      return;
    }

    const contenido = propDescripcion.trim() || `Propuesta de servicio: ${servicio}`;
    const idTemp = `local-${Date.now()}`;
    const nuevoLocal = {
      id: idTemp,
      tipo: 'servicio',
      autor: 'cliente',
      texto: contenido,
      servicio,
      precio: precioNum,
      estado: 'Pendiente',
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoLocal]);
    setEnviandoPropuesta(true);
    setErrorPropuesta(null);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      const body = chatId
        ? {
            chatId,
            enviadorId: usuario.id,
            contenido,
            tipo: 'PROPUESTA',
            servicio_nombre: servicio,
            servicioId: propServicioId ?? undefined,
            precio: precioNum,
          }
        : {
            idCliente: usuario.idCliente,
            idTrabajador: contacto.idTrabajador,
            enviadorId: usuario.id,
            contenido,
            tipo: 'PROPUESTA',
            servicio_nombre: servicio,
            servicioId: propServicioId ?? undefined,
            precio: precioNum,
          };

      const res = await fetch(`${API_BASE_URL}/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Respuesta no OK del servidor');
      const guardado = await res.json();

      if (!chatId && guardado.chat_id) {
        setChatId(guardado.chat_id);
      }

      setMensajes((prev) =>
        prev.map((m) =>
          m.id === idTemp
            ? {
                ...m,
                id: String(guardado.id),
                hora: mapearMensaje(guardado, usuario.id).hora,
                estado: guardado.ESTADO_OFERTA ?? 'Pendiente',
              }
            : m
        )
      );

      setMostrarPropuesta(false);
      setPropServicio('');
      setPropPrecio('');
      setPropDescripcion('');
      setPropAnalisis(null);
      setPropServicioId(null);
      setPropContexto('');
      setPropRespuestas({});
      setPropTextosOtro({});
    } catch (err) {
      console.error('Error al enviar propuesta:', err);
      setMensajes((prev) =>
        prev.map((m) => (m.id === idTemp ? { ...m, fallo: true } : m))
      );
      setErrorPropuesta('No se pudo enviar la propuesta. Probá de nuevo.');
    } finally {
      setEnviandoPropuesta(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  const renderBurbujaTexto = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <TouchableOpacity
        activeOpacity={esCliente && !item.fallo ? 0.85 : 1}
        onLongPress={() => abrirEdicion(item)}
        style={[
          styles.filaMensaje,
          { justifyContent: esCliente ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View
          style={[
            styles.burbuja,
            esCliente ? styles.burbujaCliente : styles.burbujaTrabajador,
            item.fallo && styles.burbujaFallo,
          ]}
        >
          <Text style={esCliente ? styles.textoBurbujaCliente : styles.textoBurbujaTrabajador}>
            {item.texto}
          </Text>
          <View style={styles.filaHora}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>
              {item.fallo ? 'No se pudo enviar' : item.hora}{item.editado ? ' · Editado' : ''}
            </Text>
            {esCliente && !item.fallo && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color="rgba(255,255,255,0.85)"
                style={{ marginLeft: 4 }}
              />
            )}
            {item.fallo && (
              <Ionicons
                name="alert-circle"
                size={13}
                color="#FFD1D1"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBurbujaVideo = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esCliente ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View
          style={[
            styles.burbujaImagenWrap,
            esCliente ? styles.burbujaImagenCliente : styles.burbujaImagenTrabajador,
            item.fallo && styles.burbujaFallo,
          ]}
        >
          <Video
            source={{ uri: item.texto }}
            style={styles.imagenChat}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            isLooping={false}
          />
          <View style={[styles.filaHora, { paddingHorizontal: 4, paddingTop: 4 }]}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>
              {item.fallo ? 'No se pudo enviar' : item.hora}
            </Text>
            {esCliente && !item.fallo && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={esCliente ? 'rgba(255,255,255,0.85)' : '#A0AEC0'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderBurbujaImagen = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esCliente ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esCliente && <AvatarMini contacto={contacto} />}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.burbujaImagenWrap,
            esCliente ? styles.burbujaImagenCliente : styles.burbujaImagenTrabajador,
            item.fallo && styles.burbujaFallo,
          ]}
        >
          <Image
            source={{ uri: item.texto }}
            style={styles.imagenChat}
            resizeMode="cover"
          />
          <View style={[styles.filaHora, { paddingHorizontal: 4, paddingTop: 4 }]}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>
              {item.fallo ? 'No se pudo enviar' : item.hora}
            </Text>
            {esCliente && !item.fallo && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={esCliente ? 'rgba(255,255,255,0.85)' : '#A0AEC0'}
                style={{ marginLeft: 4 }}
              />
            )}
            {item.fallo && (
              <Ionicons
                name="alert-circle"
                size={13}
                color="#FFD1D1"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTarjetaServicio = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esCliente ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View style={[styles.tarjetaServicio, item.fallo && styles.burbujaFallo]}>
          <View style={styles.tarjetaServicioBadge}>
            <Ionicons name="hammer" size={12} color={BLUE_DARK} />
            <Text style={styles.tarjetaServicioBadgeText}>{item.estado ?? 'Propuesta'}</Text>
          </View>

          <Text style={styles.tarjetaServicioLabel}>Servicio</Text>
          <Text style={styles.tarjetaServicioValor}>{item.servicio ?? contacto?.servicio}</Text>

          {!!item.texto && item.texto !== `Propuesta de servicio: ${item.servicio}` && (
            <>
              <Text style={[styles.tarjetaServicioLabel, { marginTop: 10 }]}>Detalle</Text>
              <Text style={styles.tarjetaServicioDetalle}>{item.texto}</Text>
            </>
          )}

          <View style={styles.tarjetaServicioDivider} />

          <Text style={styles.tarjetaServicioLabel}>Precio estimado</Text>
          <Text style={styles.tarjetaServicioPrecio}>${Number(item.precio).toLocaleString('es-AR')}</Text>

          <TouchableOpacity style={styles.tarjetaServicioBoton} activeOpacity={0.85}>
            <Text style={styles.tarjetaServicioBotonText}>Ver detalle</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.horaTrabajadorTexto}>
            {item.fallo ? 'No se pudo enviar' : item.hora}
          </Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={STATUS_BAR} />
      <Header />

      <View
        style={styles.chatHeader}
        onLayout={(e) => setAlturaHeader(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.chatHeaderAvatarWrap}>
          {contacto?.foto ? (
            <Image source={{ uri: contacto.foto }} style={styles.chatHeaderAvatar} />
          ) : (
            <View style={styles.chatHeaderAvatarPlaceholder}>
              <Text style={styles.chatHeaderAvatarText}>{obtenerIniciales(contacto?.nombre)}</Text>
            </View>
          )}
          {contacto?.online && <View style={styles.onlineDot} />}
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.chatHeaderNombre} numberOfLines={1}>{contacto?.nombre}</Text>
          <Text style={styles.chatHeaderEstado}>
            {contacto?.online ? 'En línea' : 'Desconectado'}
            {contacto?.servicio ? ` · ${contacto.servicio}` : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? alturaHeader : 0}
      >
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
            onContentSizeChange={() => {
              if (mensajes.length > 0) {
                listRef.current?.scrollToEnd({ animated: false });
              }
            }}
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

        {/* Barra de entrada */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: tecladoVisible ? 10 : Math.max(insets.bottom, 10) },
          ]}
        >
          {grabando ? (
            <View style={styles.grabandoRow}>
              <View style={styles.grabandoDot} />
              <Text style={styles.grabandoTexto}>
                {Math.floor(segundosGrabando / 60)}:{String(segundosGrabando % 60).padStart(2, '0')}
              </Text>
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
              <TouchableOpacity
                style={styles.adjuntarButton}
                activeOpacity={0.8}
                onPress={() => setMostrarOpciones((v) => !v)}
                disabled={subiendoArchivo}
              >
                {subiendoArchivo ? (
                  <ActivityIndicator size="small" color={BLUE_DARK} />
                ) : (
                  <Ionicons name={mostrarOpciones ? 'close' : 'add'} size={22} color={BLUE_DARK} />
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder="Escribí un mensaje..."
                placeholderTextColor="#9AA5B5"
                value={texto}
                onChangeText={setTexto}
                multiline
              />

              {texto.trim() ? (
                <TouchableOpacity
                  style={styles.enviarButton}
                  onPress={enviarMensaje}
                  activeOpacity={0.85}
                  disabled={enviando}
                >
                  {enviando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={17} color="#fff" />
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.enviarButton}
                  onPress={iniciarGrabacion}
                  activeOpacity={0.85}
                >
                  <Ionicons name="mic" size={19} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Menú de opciones del botón "+" */}
      <Modal
        visible={mostrarOpciones}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarOpciones(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMostrarOpciones(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuOpciones}>
                <TouchableOpacity
                  style={styles.opcionItem}
                  activeOpacity={0.75}
                  onPress={elegirDeGaleria}
                >
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

                <TouchableOpacity
                  style={styles.opcionItem}
                  activeOpacity={0.75}
                  onPress={tomarFoto}
                >
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

                <TouchableOpacity
                  style={styles.opcionItem}
                  activeOpacity={0.75}
                  onPress={elegirDocumento}
                >
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

                <TouchableOpacity
                  style={styles.opcionItem}
                  activeOpacity={0.75}
                  onPress={handleAgregarPropuesta}
                >
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(21,101,216,0.10)' }]}>
                    <Ionicons name="hammer" size={20} color={BLUE_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Enviar propuesta</Text>
                    <Text style={styles.opcionSubtitulo}>Servicio y precio estimado</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal: editar mensaje */}
      <Modal
        visible={!!editandoMensaje}
        transparent
        animationType="fade"
        onRequestClose={() => !guardandoEdicion && setEditandoMensaje(null)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={() => !guardandoEdicion && setEditandoMensaje(null)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
          <View style={styles.editarCard}>
            <Text style={styles.propTitulo}>Editar mensaje</Text>
            <TextInput
              style={[styles.propInput, { marginTop: 12, minHeight: 60, textAlignVertical: 'top' }]}
              value={textoEdicion}
              onChangeText={setTextoEdicion}
              multiline
              autoFocus
              editable={!guardandoEdicion}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setEditandoMensaje(null)}
                style={[styles.reintentarBtn, { flex: 1, backgroundColor: '#E9EDF5' }]}
                disabled={guardandoEdicion}
              >
                <Text style={[styles.reintentarBtnText, { color: '#5B6478' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={guardarEdicion}
                style={[styles.reintentarBtn, { flex: 1, backgroundColor: BLUE_DARK }]}
                disabled={guardandoEdicion || !textoEdicion.trim()}
              >
                {guardandoEdicion ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.reintentarBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Overlay: armar y enviar una propuesta (con IA) */}
      <Modal
        visible={mostrarPropuesta}
        transparent
        animationType="slide"
        onRequestClose={cerrarPropuesta}
      >
        <KeyboardAvoidingView
          style={styles.propOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={cerrarPropuesta}>
            <View style={styles.propBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.propCard}>
            <View style={styles.propHandle} />

            <View style={styles.propHeaderRow}>
              <View style={styles.propHeaderIconWrap}>
                <Ionicons name="hammer" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.propTitulo}>Nueva propuesta</Text>
                <Text style={styles.propSubtitulo}>
                  Se envía como tarjeta a {contacto?.nombre ?? 'este chat'}
                </Text>
              </View>
              <TouchableOpacity onPress={cerrarPropuesta} hitSlop={10} style={styles.propCerrarBtn}>
                <Ionicons name="close" size={16} color="#5B6478" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.propScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.propLabel}>Contanos el trabajo</Text>
              <TextInput
                style={styles.propTextArea}
                placeholder="Ej: reparación de cañería en la cocina, pérdida activa..."
                placeholderTextColor="#9AA5B5"
                multiline
                numberOfLines={3}
                value={propDescripcion}
                onChangeText={(t) => {
                  setPropDescripcion(t);
                  if (errorPropuesta) setErrorPropuesta(null);
                  invalidarAnalisisPropPrevio();
                }}
                editable={!enviandoPropuesta && !propAnalizando}
              />

              <TouchableOpacity
                style={[
                  styles.propIaBtn,
                  (!propDescripcionValida || propAnalizando || enviandoPropuesta) && styles.propIaBtnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => analizarPropuestaConIA()}
                disabled={!propDescripcionValida || propAnalizando || enviandoPropuesta}
              >
                {propAnalizando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={15} color="#fff" style={{ marginRight: 7 }} />
                    <Text style={styles.propIaBtnText}>
                      {propAnalisis ? 'Volver a analizar' : 'Analizar con IA'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {!propDescripcionValida && propDescripcion.length > 0 && (
                <Text style={styles.propError}>Contá un poco más (mínimo 10 caracteres).</Text>
              )}
              {propErrorIA && <Text style={styles.propError}>{propErrorIA}</Text>}

              {propAnalisis && propNecesitaAclaracion && propPreguntasActuales.length > 0 && (
                <View style={styles.propAclaracionBox}>
                  <View style={styles.propAclaracionHeaderRow}>
                    <Ionicons name="help-circle" size={16} color={ACCENT} />
                    <Text style={styles.propAclaracionTitulo}>Necesitamos un dato más</Text>
                  </View>

                  {propPreguntasActuales.map((p, idx) => {
                    const seleccion = propRespuestas[idx];
                    const eligioOtro = seleccion === OPCION_OTRO;
                    return (
                      <View key={idx} style={styles.propPreguntaItem}>
                        <Text style={styles.propPreguntaTexto}>{p.pregunta}</Text>
                        <View style={styles.propChipsRow}>
                          {(p.opciones || []).map((opcion) => {
                            const activo = seleccion === opcion;
                            return (
                              <TouchableOpacity
                                key={opcion}
                                style={[styles.propChip, activo && styles.propChipActivo]}
                                onPress={() => seleccionarRespuestaProp(idx, opcion)}
                                disabled={propAnalizando}
                              >
                                <Text style={[styles.propChipText, activo && styles.propChipTextActivo]}>
                                  {opcion}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          <TouchableOpacity
                            style={[styles.propChip, styles.propChipOtro, eligioOtro && styles.propChipActivo]}
                            onPress={() => seleccionarRespuestaProp(idx, OPCION_OTRO)}
                            disabled={propAnalizando}
                          >
                            <Text style={[styles.propChipText, eligioOtro && styles.propChipTextActivo]}>Otro</Text>
                          </TouchableOpacity>
                        </View>
                        {eligioOtro && (
                          <TextInput
                            style={styles.propOtroInput}
                            placeholder="Escribí tu respuesta..."
                            placeholderTextColor="#9AA5B5"
                            value={propTextosOtro[idx] || ''}
                            onChangeText={(t) => cambiarTextoOtroProp(idx, t)}
                            editable={!propAnalizando}
                          />
                        )}
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    style={[styles.propIaBtn, (!propTodasRespondidas || propAnalizando) && styles.propIaBtnDisabled]}
                    onPress={confirmarRespuestasProp}
                    disabled={!propTodasRespondidas || propAnalizando}
                  >
                    {propAnalizando ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="arrow-forward-circle" size={15} color="#fff" style={{ marginRight: 7 }} />
                        <Text style={styles.propIaBtnText}>Continuar con esta info</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {propAnalisis && !propNecesitaAclaracion && propAnalisis.servicios?.length > 0 && (
                <>
                  <View style={styles.propBadgeIa}>
                    <Ionicons name="sparkles" size={11} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.propBadgeIaText}>Sugerido por IA · editable</Text>
                  </View>
                  <Text style={styles.propLabel}>Servicio</Text>
                  <TouchableOpacity
                    style={styles.propSelectBox}
                    onPress={() => setPropSelectorAbierto((v) => !v)}
                  >
                    <Text style={styles.propSelectText}>
                      {propServicioElegido?.nombre ?? propServicio ?? 'Seleccionar servicio'}
                    </Text>
                    <Ionicons name={propSelectorAbierto ? 'chevron-up' : 'chevron-down'} size={16} color="#8A94A6" />
                  </TouchableOpacity>

                  {propSelectorAbierto && (
                    <View style={styles.propDropdown}>
                      {propAnalisis.servicios.map((s) => {
                        const activo = s.id === propServicioId;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={[styles.propDropdownItem, activo && styles.propDropdownItemActivo]}
                            onPress={() => {
                              setPropServicioId(s.id);
                              setPropServicio(s.nombre);
                              setPropSelectorAbierto(false);
                            }}
                          >
                            <Text style={[styles.propDropdownItemText, activo && styles.propDropdownItemTextActivo]}>
                              {s.nombre}
                            </Text>
                            {activo && <Ionicons name="checkmark-circle" size={18} color={BLUE} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {(propAnalisis.precioMin != null && propAnalisis.precioMax != null) && (
                    <Text style={styles.propRangoTexto}>
                      Rango estimado: ${propAnalisis.precioMin?.toLocaleString('es-AR')} – ${propAnalisis.precioMax?.toLocaleString('es-AR')}
                    </Text>
                  )}
                  {!!propAnalisis.notas && (
                    <Text style={styles.propNotaTexto}>{propAnalisis.notas} Es una estimación, puede no ser exacta.</Text>
                  )}
                </>
              )}

              {!(propAnalisis && !propNecesitaAclaracion && propAnalisis.servicios?.length > 0) && (
                <>
                  <Text style={styles.propLabel}>Servicio</Text>
                  <TextInput
                    style={styles.propInput}
                    placeholder="Ej: Reparación de cañería"
                    placeholderTextColor="#9AA5B5"
                    value={propServicio}
                    onChangeText={(t) => { setPropServicio(t); if (errorPropuesta) setErrorPropuesta(null); }}
                    editable={!enviandoPropuesta}
                  />
                </>
              )}

              <Text style={styles.propLabel}>Precio estimado</Text>
              <View style={styles.propPriceRow}>
                <Text style={styles.propPriceCurrency}>$</Text>
                <TextInput
                  style={styles.propPriceInput}
                  placeholder="0"
                  placeholderTextColor="#9AA5B5"
                  keyboardType="numeric"
                  value={propPrecio}
                  onChangeText={(t) => { setPropPrecio(t.replace(/[^0-9]/g, '')); if (errorPropuesta) setErrorPropuesta(null); }}
                  editable={!enviandoPropuesta}
                />
              </View>

              {(propServicio.trim() || propPrecio) && !propNecesitaAclaracion && (
                <View style={styles.propPreviewWrap}>
                  <Text style={styles.propPreviewLabel}>Vista previa</Text>
                  <View style={styles.propPreviewCard}>
                    <View style={styles.tarjetaServicioBadge}>
                      <Ionicons name="hammer" size={12} color={BLUE_DARK} />
                      <Text style={styles.tarjetaServicioBadgeText}>Pendiente</Text>
                    </View>
                    <Text style={styles.tarjetaServicioLabel}>Servicio</Text>
                    <Text style={styles.tarjetaServicioValor}>
                      {propServicio.trim() || 'Sin especificar'}
                    </Text>
                    <View style={styles.tarjetaServicioDivider} />
                    <Text style={styles.tarjetaServicioLabel}>Precio estimado</Text>
                    <Text style={styles.tarjetaServicioPrecio}>
                      ${propPrecio ? Number(propPrecio).toLocaleString('es-AR') : '0'}
                    </Text>
                  </View>
                </View>
              )}

              {errorPropuesta && <Text style={styles.propError}>{errorPropuesta}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.propEnviarBtn,
                (enviandoPropuesta || propNecesitaAclaracion) && styles.propEnviarBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={enviarPropuesta}
              disabled={enviandoPropuesta || propNecesitaAclaracion}
            >
              {enviandoPropuesta ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.propEnviarBtnText}>
                    {propNecesitaAclaracion ? 'Respondé las preguntas primero' : 'Enviar propuesta'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

function AvatarMini({ contacto }) {
  return contacto?.foto ? (
    <Image source={{ uri: contacto.foto }} style={styles.avatarMini} />
  ) : (
    <View style={styles.avatarMiniPlaceholder}>
      <Text style={styles.avatarMiniTexto}>{obtenerIniciales(contacto?.nombre)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 2,
  },
  chatHeaderAvatarWrap: { position: 'relative' },
  chatHeaderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  chatHeaderAvatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  chatHeaderAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#3ECF6E',
    borderWidth: 2, borderColor: BLUE_DARK,
  },
  chatHeaderNombre: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chatHeaderEstado: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  headerIconButton: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  estadoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  estadoTexto: { marginTop: 10, color: '#8A94A6', fontSize: 13, textAlign: 'center' },
  reintentarBtn: {
    marginTop: 14,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reintentarBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  listaContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18, flexGrow: 1 },
  diaDividerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  diaDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(21,101,216,0.12)' },
  diaDividerText: {
    color: '#8A94A6', fontSize: 11, fontWeight: '700',
    marginHorizontal: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  filaMensaje: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },

  avatarMini: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  avatarMiniPlaceholder: {
    width: 28, height: 28, borderRadius: 14, marginRight: 8,
    backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center',
  },
  avatarMiniTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },

  burbuja: {
    maxWidth: '74%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  burbujaCliente: {
    backgroundColor: BLUE,
    borderBottomRightRadius: 4,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  burbujaTrabajador: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  burbujaFallo: {
    opacity: 0.6,
  },
  textoBurbujaCliente: { color: '#fff', fontSize: 14, lineHeight: 20 },
  textoBurbujaTrabajador: { color: '#2D3748', fontSize: 14, lineHeight: 20 },
  filaHora: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  horaClienteTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  horaTrabajadorTexto: { color: '#A0AEC0', fontSize: 10, marginTop: 6 },

  burbujaImagenWrap: {
    maxWidth: '65%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    padding: 5,
  },
  burbujaImagenCliente: {
    borderBottomRightRadius: 4,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  burbujaImagenTrabajador: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  imagenChat: {
    width: 210,
    height: 210,
    borderRadius: 14,
    backgroundColor: '#E8ECF3',
  },

  // ---- Burbuja de audio ----
  burbujaAudio: {
    maxWidth: '74%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioPlayBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
audioOndaWrap: { flex: 1, height: 24, justifyContent: 'center', position: 'relative' },
audioOndaFondo: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2 },
audioOndaProgreso: { position: 'absolute', left: 0, height: 3, borderRadius: 2 },

  // ---- Tarjeta de servicio (presupuesto) ----
  tarjetaServicio: {
    maxWidth: '78%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  tarjetaServicioBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: 'rgba(21,101,216,0.08)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 12, marginBottom: 10, gap: 5,
  },
  tarjetaServicioBadgeText: { color: BLUE_DARK, fontSize: 10, fontWeight: '700' },
  tarjetaServicioLabel: { color: '#8A94A6', fontSize: 11, fontWeight: '600', marginTop: 4 },
  tarjetaServicioValor: { color: '#1A202C', fontSize: 16, fontWeight: '800', marginTop: 2 },
  tarjetaServicioDetalle: { color: '#4A5568', fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  tarjetaServicioDivider: { height: 1, backgroundColor: 'rgba(21,101,216,0.10)', marginVertical: 10 },
  tarjetaServicioPrecio: { color: BLUE_DARK, fontSize: 20, fontWeight: '800', marginTop: 2 },
  tarjetaServicioBoton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BLUE, borderRadius: 14,
    paddingVertical: 10, marginTop: 14, gap: 6,
  },
  tarjetaServicioBotonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ---- Barra de entrada ----
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(21,101,216,0.08)',
    gap: 8,
  },
  adjuntarButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(21,101,216,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: BG,
    borderRadius: 19,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1A202C',
  },
  enviarButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  enviarButtonDisabled: { backgroundColor: '#B9C6DB', shadowOpacity: 0 },

  // ---- Grabación de audio ----
  grabandoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 10,
  },
  grabandoDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: DANGER,
  },
  grabandoTexto: { color: '#1A202C', fontWeight: '700', fontSize: 14 },
  grabandoCancelar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(192,57,43,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  grabandoEnviar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
  },

  // ---- Menú de opciones (archivo / propuesta) ----
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,26,48,0.35)',
    justifyContent: 'flex-end',
  },
  menuOpciones: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 84,
    borderRadius: 18,
    paddingVertical: 6,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  opcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  opcionIconoWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  opcionTitulo: { color: '#1A202C', fontSize: 14, fontWeight: '700' },
  opcionSubtitulo: { color: '#8A94A6', fontSize: 11.5, marginTop: 1 },
  opcionDivider: { height: 1, backgroundColor: 'rgba(21,101,216,0.08)', marginLeft: 14 + 38 + 12 },

  // ---- Modal: editar mensaje ----
  editarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    alignSelf: 'center',
    width: '86%',
  },

  // ---- Overlay: crear/enviar propuesta ----
  propOverlay: { flex: 1, justifyContent: 'flex-end' },
  propBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,23,53,0.55)',
  },
  propCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '86%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 18,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  propHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(21,101,216,0.16)',
    alignSelf: 'center', marginBottom: 14,
  },
  propHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10,
  },
  propHeaderIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: ACCENT,
    justifyContent: 'center', alignItems: 'center',
  },
  propTitulo: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  propSubtitulo: { fontSize: 12, color: '#8A94A6', marginTop: 2 },
  propCerrarBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F3F5FA',
    justifyContent: 'center', alignItems: 'center',
  },
  propScroll: { flexGrow: 0 },
  propLabel: { fontSize: 13, fontWeight: '700', color: '#1A202C', marginTop: 14, marginBottom: 6 },
  propInput: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A202C',
  },
  propPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  propPriceCurrency: { fontSize: 16, color: '#8A94A6', marginRight: 4, fontWeight: '700' },
  propPriceInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '800', color: '#1A202C' },
  propTextArea: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A202C',
    minHeight: 84,
    textAlignVertical: 'top',
  },
  propPreviewWrap: { marginTop: 18 },
  propPreviewLabel: {
    fontSize: 11, color: '#8A94A6', fontWeight: '800',
    letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8,
  },
  propPreviewCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  propError: {
    color: DANGER, fontSize: 12.5, fontWeight: '600',
    marginTop: 12, backgroundColor: '#FBEAE8', padding: 10, borderRadius: 10,
  },
  propEnviarBtn: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  propEnviarBtnDisabled: { backgroundColor: '#B9C6DB', shadowOpacity: 0, elevation: 0 },
  propEnviarBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  propIaBtn: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propIaBtnDisabled: { backgroundColor: '#D8C1A3' },
  propIaBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },

  propBadgeIa: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: BLUE_DARK, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 16,
  },
  propBadgeIaText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },

  propAclaracionBox: {
    marginTop: 14,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(217,130,43,0.35)',
    borderRadius: 16,
    padding: 14,
  },
  propAclaracionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  propAclaracionTitulo: { color: ACCENT, fontWeight: '800', fontSize: 13.5 },
  propPreguntaItem: { marginBottom: 12 },
  propPreguntaTexto: { fontSize: 13, color: '#1A202C', fontWeight: '700', marginBottom: 8, lineHeight: 18 },
  propChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  propChip: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: BLUE,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  propChipActivo: { backgroundColor: BLUE, borderColor: BLUE },
  propChipOtro: { borderColor: '#C7D2E3' },
  propChipText: { fontSize: 12, fontWeight: '700', color: BLUE },
  propChipTextActivo: { color: '#fff' },
  propOtroInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(217,130,43,0.5)',
    borderRadius: 10, padding: 10, fontSize: 13, color: '#1A202C', marginTop: 8,
  },

  propSelectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(21,101,216,0.10)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  propSelectText: { fontSize: 14, color: '#1A202C', fontWeight: '700' },
  propDropdown: {
    marginTop: 6, backgroundColor: '#fff', borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)', borderRadius: 14, overflow: 'hidden',
  },
  propDropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(21,101,216,0.08)',
  },
  propDropdownItemActivo: { backgroundColor: 'rgba(21,101,216,0.06)' },
  propDropdownItemText: { fontSize: 13.5, color: '#1A202C', fontWeight: '600' },
  propDropdownItemTextActivo: { color: BLUE, fontWeight: '800' },
  propRangoTexto: { fontSize: 12, color: '#8A94A6', marginTop: 6 },
  propNotaTexto: { fontSize: 12, color: ACCENT, marginTop: 4, lineHeight: 16, fontWeight: '600' },
});