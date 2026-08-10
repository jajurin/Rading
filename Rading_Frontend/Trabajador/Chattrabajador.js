import React, { useRef, useState, useEffect, useCallback } from 'react';
import Header from '../Header';
import API_URL from '../configS';
import { Video, ResizeMode } from 'expo-av';
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  FlatList, Image, StatusBar, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, Keyboard, // 👈 agregar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d47a8';
const BLUE_LIGHT = '#3b7ff0';
const STATUS_BAR = '#0D4FD7';
const BG         = '#F3F5FA';
const DANGER     = '#C0392B';
const API_BASE_URL = API_URL;

const obtenerIniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

// Detecta si el contenido de un mensaje de tipo archivo es una imagen,
// mirando la extensión de la URL.
const esUrlImagen = (url = '') =>
  /\.(jpg|jpeg|png|gif|webp|jfif|bmp|heic|heif)(\?.*)?$/i.test(url);

// Convierte una fila de "Mensajes" del backend a la forma que usa el render.
// Del lado del trabajador: "cliente" acá significa "el otro" (el cliente
// del chat), y "trabajador" es el usuario logueado (el trabajador).
const mapearMensaje = (m, idUsuario) => {
  let tipo = 'texto';
  switch (m.tipo) {
    case 'PROPUESTA':
      tipo = 'propuestaCliente';
      break;
      case 'AUDIO':          // 👈 agregar
  tipo = 'audio';       // 👈 agregar
  break;  
    case 'OFERTA_TRABAJADOR':
      tipo = 'oferta';
      break;
    case 'IMAGEN':
      tipo = 'imagen';
      break;
    case 'VIDEO':
      tipo = 'video';
      break;
    case 'ARCHIVO':
      tipo = 'archivo';
      break;
    default:
      // TEXTO u otros casos viejos: fallback por extensión
      tipo = esUrlImagen(m.contenido) ? 'imagen' : 'texto';
  }

  return {
  id: String(m.id),
  tipo,
  autor: m.enviador_id === idUsuario ? 'trabajador' : 'cliente',
  texto: m.contenido,
  servicio: m.servicio_nombre,
  precio: m.precio,
  precioOfertado: m.precio_ofertado,
  notaOferta: m.nota_oferta,
  estado: m.ESTADO_OFERTA,
  leido: !!m.leido,
  duracionAudio: m.duracion_audio,   // 👈 agregar
  hora: m.created_at
    ? new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '',
};
};
function formatearTiempoAudio(ms) {
  const total = Math.floor((ms || 0) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function BurbujaAudio({ item, esTrabajador, contacto }) {
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
    <View style={[styles.filaMensaje, { justifyContent: esTrabajador ? 'flex-end' : 'flex-start' }]}>
      {!esTrabajador && <AvatarMini contacto={contacto} />}
      <View
        style={[
          styles.burbujaAudio,
          esTrabajador ? styles.burbujaTrabajadorMio : styles.burbujaCliente,
          item.fallo && styles.burbujaFallo,
        ]}
      >
        <TouchableOpacity onPress={toggleReproducir} style={styles.audioPlayBtn} disabled={cargando}>
          {cargando ? (
            <ActivityIndicator size="small" color={esTrabajador ? '#fff' : BLUE_DARK} />
          ) : (
            <Ionicons name={reproduciendo ? 'pause' : 'play'} size={18} color={esTrabajador ? '#fff' : BLUE_DARK} />
          )}
        </TouchableOpacity>

        <View style={styles.audioOndaWrap}>
          <View
            style={[
              styles.audioOndaFondo,
              { backgroundColor: esTrabajador ? 'rgba(255,255,255,0.35)' : 'rgba(21,101,216,0.18)' },
            ]}
          />
          <View
            style={[
              styles.audioOndaProgreso,
              { width: `${progresoPct}%`, backgroundColor: esTrabajador ? '#fff' : BLUE_DARK },
            ]}
          />
        </View>

        <Text style={esTrabajador ? styles.horaTrabajadorMioTexto : styles.horaClienteTexto}>
          {formatearTiempoAudio(reproduciendo || posicion > 0 ? posicion : duracion)}
        </Text>

        {item.fallo && <Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />}
      </View>
    </View>
  );
}
export default function ChatTrabajador({ route, navigation }) {
  const insets = useSafeAreaInsets();
  // contacto acá es el CLIENTE con el que el trabajador está hablando.
  const contacto = route?.params?.contacto;
  const usuario = route?.params?.usuario;
const [grabando, setGrabando] = useState(false);
const [grabacion, setGrabacion] = useState(null);
const [segundosGrabando, setSegundosGrabando] = useState(0);
const intervaloGrabacionRef = useRef(null);

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

    // Reusa subirYEnviarArchivo, pasándole un objeto "archivo" compatible
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
  const listRef = useRef(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [chatId, setChatId] = useState(route?.params?.chatId ?? null);
  const [cargando, setCargando] = useState(!!route?.params?.chatId);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  // ── Overlay de "Ofertar precio" ─────────────────────────────────────
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [ofertaPrecio, setOfertaPrecio] = useState('');
  const [ofertaNota, setOfertaNota] = useState('');
  const [enviandoOferta, setEnviandoOferta] = useState(false);
  const [errorOferta, setErrorOferta] = useState(null);
const [alturaHeader, setAlturaHeader] = useState(0);
const [tecladoVisible, setTecladoVisible] = useState(false);

useEffect(() => {
  const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
  const ocultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
  return () => {
    mostrar.remove();
    ocultar.remove();
  };
}, []);
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
    if (!chatId || !usuario?.id) return;
    fetch(`${API_BASE_URL}/chat/${chatId}/leido`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: usuario.id }),
    }).catch((err) => console.error('Error al marcar como leído:', err));
  }, [chatId, usuario]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, [mensajes.length]);

  const enviarMensaje = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    if (!usuario?.id || (!chatId && (!usuario?.idTrabajador || !contacto?.idCliente))) {
      console.error('Faltan datos para enviar el mensaje (usuario o idCliente)');
      return;
    }

    const idTemp = `local-${Date.now()}`;
    const nuevoLocal = {
      id: idTemp,
      tipo: 'texto',
      autor: 'trabajador',
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
            idCliente: contacto.idCliente,
            idTrabajador: usuario.idTrabajador,
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

  // --- Opciones del botón "+" ---

  const subirYEnviarArchivo = async (archivo, extraForm = {}) => {
    if (!usuario?.id || (!chatId && (!usuario?.idTrabajador || !contacto?.idCliente))) {
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
        formData.append('idCliente', contacto.idCliente);
        formData.append('idTrabajador', usuario.idTrabajador);
      }
     formData.append('enviadorId', usuario.id);
Object.entries(extraForm).forEach(([k, v]) => formData.append(k, String(v))); // 👈 agregar
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

  // Abre el overlay de "Ofertar precio"
  const handleAbrirOferta = () => {
    setMostrarOpciones(false);
    setOfertaPrecio('');
    setOfertaNota('');
    setErrorOferta(null);
    setMostrarOferta(true);
  };

  const cerrarOferta = () => {
    if (enviandoOferta) return;
    setMostrarOferta(false);
  };

  const enviarOferta = async () => {
    if (enviandoOferta) return;

    const precioNum = Number(ofertaPrecio);
    if (!ofertaPrecio || isNaN(precioNum) || precioNum <= 0) {
      setErrorOferta('Ingresá un precio válido.');
      return;
    }
    if (!usuario?.id || (!chatId && (!usuario?.idTrabajador || !contacto?.idCliente))) {
      setErrorOferta('Faltan datos para enviar la oferta.');
      return;
    }

    const contenido = ofertaNota.trim() || `Oferta de ${usuario?.nombre ?? 'el trabajador'}`;
    const idTemp = `local-${Date.now()}`;
    const nuevoLocal = {
      id: idTemp,
      tipo: 'oferta',
      autor: 'trabajador',
      texto: contenido,
      precioOfertado: precioNum,
      notaOferta: ofertaNota.trim(),
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevoLocal]);
    setEnviandoOferta(true);
    setErrorOferta(null);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      const body = chatId
        ? {
            chatId,
            enviadorId: usuario.id,
            contenido,
            tipo: 'OFERTA_TRABAJADOR',
            precioOfertado: precioNum,
            notaOferta: ofertaNota.trim() || null,
          }
        : {
            idCliente: contacto.idCliente,
            idTrabajador: usuario.idTrabajador,
            enviadorId: usuario.id,
            contenido,
            tipo: 'OFERTA_TRABAJADOR',
            precioOfertado: precioNum,
            notaOferta: ofertaNota.trim() || null,
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
              }
            : m
        )
      );

      setMostrarOferta(false);
      setOfertaPrecio('');
      setOfertaNota('');
    } catch (err) {
      console.error('Error al enviar oferta:', err);
      setMensajes((prev) =>
        prev.map((m) => (m.id === idTemp ? { ...m, fallo: true } : m))
      );
      setErrorOferta('No se pudo enviar la oferta. Probá de nuevo.');
    } finally {
      setEnviandoOferta(false);
    }
  };

  const renderBurbujaTexto = (item) => {
    const esTrabajador = item.autor === 'trabajador';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esTrabajador ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esTrabajador && <AvatarMini contacto={contacto} />}
        <View
          style={[
            styles.burbuja,
            esTrabajador ? styles.burbujaTrabajadorMio : styles.burbujaCliente,
            item.fallo && styles.burbujaFallo,
          ]}
        >
          <Text style={esTrabajador ? styles.textoBurbujaTrabajadorMio : styles.textoBurbujaCliente}>
            {item.texto}
          </Text>
          <View style={styles.filaHora}>
            <Text style={esTrabajador ? styles.horaTrabajadorMioTexto : styles.horaClienteTexto}>
              {item.fallo ? 'No se pudo enviar' : item.hora}
            </Text>
            {esTrabajador && !item.fallo && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color="rgba(255,255,255,0.85)"
                style={{ marginLeft: 4 }}
              />
            )}
            {item.fallo && (
              <Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>
    );
  };
const renderBurbujaVideo = (item) => {
  const esTrabajador = item.autor === 'trabajador';
  return (
    <View
      style={[
        styles.filaMensaje,
        { justifyContent: esTrabajador ? 'flex-end' : 'flex-start' },
      ]}
    >
      {!esTrabajador && <AvatarMini contacto={contacto} />}
      <View
        style={[
          styles.burbujaImagenWrap,
          esTrabajador ? styles.burbujaImagenTrabajadorMio : styles.burbujaImagenCliente,
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
          <Text style={esTrabajador ? styles.horaTrabajadorMioTexto : styles.horaClienteTexto}>
            {item.fallo ? 'No se pudo enviar' : item.hora}
          </Text>
          {esTrabajador && !item.fallo && (
            <Ionicons
              name={item.leido ? 'checkmark-done' : 'checkmark'}
              size={14}
              color="rgba(255,255,255,0.85)"
              style={{ marginLeft: 4 }}
            />
          )}
          {item.fallo && (
            <Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>
    </View>
  );
};
  const renderBurbujaImagen = (item) => {
    const esTrabajador = item.autor === 'trabajador';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esTrabajador ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esTrabajador && <AvatarMini contacto={contacto} />}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.burbujaImagenWrap,
            esTrabajador ? styles.burbujaImagenTrabajadorMio : styles.burbujaImagenCliente,
            item.fallo && styles.burbujaFallo,
          ]}
        >
          <Image source={{ uri: item.texto }} style={styles.imagenChat} resizeMode="cover" />
          <View style={[styles.filaHora, { paddingHorizontal: 4, paddingTop: 4 }]}>
            <Text style={esTrabajador ? styles.horaTrabajadorMioTexto : styles.horaClienteTexto}>
              {item.fallo ? 'No se pudo enviar' : item.hora}
            </Text>
            {esTrabajador && !item.fallo && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color="rgba(255,255,255,0.85)"
                style={{ marginLeft: 4 }}
              />
            )}
            {item.fallo && (
              <Ionicons name="alert-circle" size={13} color="#FFD1D1" style={{ marginLeft: 4 }} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Tarjeta simple: precio ofertado + nota. Sin servicio ni estado de
  // aceptación (eso es cosa de la propuesta del cliente, no de esto).
  const renderTarjetaOferta = (item) => {
    const esTrabajador = item.autor === 'trabajador';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esTrabajador ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esTrabajador && <AvatarMini contacto={contacto} />}
        <View style={[styles.tarjetaOferta, item.fallo && styles.burbujaFallo]}>
          <View style={styles.tarjetaOfertaBadge}>
            <Ionicons name="pricetag" size={12} color={BLUE_DARK} />
            <Text style={styles.tarjetaOfertaBadgeText}>
              {esTrabajador ? 'Tu oferta' : 'Oferta recibida'}
            </Text>
          </View>

          <Text style={styles.tarjetaOfertaLabel}>Precio ofrecido</Text>
          <Text style={styles.tarjetaOfertaPrecio}>
            ${Number(item.precioOfertado).toLocaleString('es-AR')}
          </Text>

          {!!item.notaOferta && (
            <>
              <Text style={[styles.tarjetaOfertaLabel, { marginTop: 10 }]}>Nota</Text>
              <Text style={styles.tarjetaOfertaNota}>{item.notaOferta}</Text>
            </>
          )}

          <Text style={styles.horaClienteTexto}>
            {item.fallo ? 'No se pudo enviar' : item.hora}
          </Text>
        </View>
      </View>
    );
  };

  // Propuesta que mandó el CLIENTE: acá el trabajador solo la lee (por
  // ahora sin acciones de aceptar/rechazar — se puede sumar después).
  const renderTarjetaPropuestaCliente = (item) => {
    return (
      <View style={[styles.filaMensaje, { justifyContent: 'flex-start' }]}>
        <AvatarMini contacto={contacto} />
        <View style={[styles.tarjetaOferta, item.fallo && styles.burbujaFallo]}>
          <View style={styles.tarjetaOfertaBadge}>
            <Ionicons name="hammer" size={12} color={BLUE_DARK} />
            <Text style={styles.tarjetaOfertaBadgeText}>{item.estado ?? 'Propuesta del cliente'}</Text>
          </View>

          <Text style={styles.tarjetaOfertaLabel}>Servicio</Text>
          <Text style={styles.tarjetaOfertaValor}>{item.servicio ?? '—'}</Text>

          {!!item.texto && (
            <>
              <Text style={[styles.tarjetaOfertaLabel, { marginTop: 10 }]}>Detalle</Text>
              <Text style={styles.tarjetaOfertaNota}>{item.texto}</Text>
            </>
          )}

          <Text style={[styles.tarjetaOfertaLabel, { marginTop: 10 }]}>Precio propuesto</Text>
          <Text style={styles.tarjetaOfertaPrecio}>${Number(item.precio).toLocaleString('es-AR')}</Text>

          <Text style={[styles.horaClienteTexto, { marginTop: 8 }]}>{item.hora}</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
  if (item.tipo === 'oferta') return renderTarjetaOferta(item);
  if (item.tipo === 'propuestaCliente') return renderTarjetaPropuestaCliente(item);
  if (item.tipo === 'imagen') return renderBurbujaImagen(item);
  if (item.tipo === 'video') return renderBurbujaVideo(item);
  if (item.tipo === 'audio') return <BurbujaAudio item={item} esTrabajador={item.autor === 'trabajador'} contacto={contacto} />; // 👈 agregar
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

                <TouchableOpacity style={styles.opcionItem} activeOpacity={0.75} onPress={handleAbrirOferta}>
                  <View style={[styles.opcionIconoWrap, { backgroundColor: 'rgba(21,101,216,0.10)' }]}>
                    <Ionicons name="pricetag" size={20} color={BLUE_DARK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcionTitulo}>Ofertar precio</Text>
                    <Text style={styles.opcionSubtitulo}>Mandá cuánto cobrarías</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Overlay: ofertar precio (simple, sin IA ni servicio) */}
      <Modal visible={mostrarOferta} transparent animationType="slide" onRequestClose={cerrarOferta}>
        <KeyboardAvoidingView
          style={styles.propOverlay}
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}        >
          <TouchableWithoutFeedback onPress={cerrarOferta}>
            <View style={styles.propBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.propCard}>
            <View style={styles.propHandle} />

            <View style={styles.propHeaderRow}>
              <View style={styles.propHeaderIconWrap}>
                <Ionicons name="pricetag" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.propTitulo}>Ofertar precio</Text>
                <Text style={styles.propSubtitulo}>
                  Se envía como tarjeta a {contacto?.nombre ?? 'este chat'}
                </Text>
              </View>
              <TouchableOpacity onPress={cerrarOferta} hitSlop={10} style={styles.propCerrarBtn}>
                <Ionicons name="close" size={16} color="#5B6478" />
              </TouchableOpacity>
            </View>

            <Text style={styles.propLabel}>Precio</Text>
            <View style={styles.propPriceRow}>
              <Text style={styles.propPriceCurrency}>$</Text>
              <TextInput
                style={styles.propPriceInput}
                placeholder="0"
                placeholderTextColor="#9AA5B5"
                keyboardType="numeric"
                value={ofertaPrecio}
                onChangeText={(t) => { setOfertaPrecio(t.replace(/[^0-9]/g, '')); if (errorOferta) setErrorOferta(null); }}
                editable={!enviandoOferta}
              />
            </View>

            <Text style={styles.propLabel}>Nota (opcional)</Text>
            <TextInput
              style={styles.propTextArea}
              placeholder="Ej: incluye materiales, disponible desde el lunes..."
              placeholderTextColor="#9AA5B5"
              multiline
              numberOfLines={3}
              value={ofertaNota}
              onChangeText={setOfertaNota}
              editable={!enviandoOferta}
            />

            {errorOferta && <Text style={styles.propError}>{errorOferta}</Text>}

            <TouchableOpacity
              style={[styles.propEnviarBtn, enviandoOferta && styles.propEnviarBtnDisabled]}
              activeOpacity={0.85}
              onPress={enviarOferta}
              disabled={enviandoOferta}
            >
              {enviandoOferta ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.propEnviarBtnText}>Enviar oferta</Text>
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
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 2 },
  chatHeaderAvatarWrap: { position: 'relative' },
  chatHeaderAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  chatHeaderAvatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  chatHeaderAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: '#3ECF6E', borderWidth: 2, borderColor: BLUE_DARK },
  chatHeaderNombre: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chatHeaderEstado: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  headerIconButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },

  estadoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  estadoTexto: { marginTop: 10, color: '#8A94A6', fontSize: 13, textAlign: 'center' },
  reintentarBtn: { marginTop: 14, backgroundColor: BLUE, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  reintentarBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  listaContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18, flexGrow: 1 },
  diaDividerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  diaDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(21,101,216,0.12)' },
  diaDividerText: { color: '#8A94A6', fontSize: 11, fontWeight: '700', marginHorizontal: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  filaMensaje: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },

  avatarMini: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  avatarMiniPlaceholder: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
  avatarMiniTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },

  burbuja: { maxWidth: '74%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  // "Mío" = trabajador logueado; "cliente" = el otro
  burbujaTrabajadorMio: {
    backgroundColor: BLUE, borderBottomRightRadius: 4,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2,
  },
  burbujaCliente: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  burbujaFallo: { opacity: 0.6 },
  textoBurbujaTrabajadorMio: { color: '#fff', fontSize: 14, lineHeight: 20 },
  textoBurbujaCliente: { color: '#2D3748', fontSize: 14, lineHeight: 20 },
  filaHora: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  horaClienteTexto: { color: '#A0AEC0', fontSize: 10, marginTop: 6 },
  horaTrabajadorMioTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },

  burbujaImagenWrap: { maxWidth: '65%', borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', padding: 5 },
  burbujaImagenTrabajadorMio: {
    borderBottomRightRadius: 4,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 2,
  },
  burbujaImagenCliente: {
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  imagenChat: { width: 210, height: 210, borderRadius: 14, backgroundColor: '#E8ECF3' },

  // ---- Tarjeta de oferta (trabajador) / propuesta (cliente, solo lectura) ----
  tarjetaOferta: {
    maxWidth: '78%', backgroundColor: '#fff', borderRadius: 20, borderBottomLeftRadius: 4,
    padding: 16, borderWidth: 1, borderColor: 'rgba(21,101,216,0.10)',
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 3,
  },
  tarjetaOfertaBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: 'rgba(21,101,216,0.08)', paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 12, marginBottom: 10, gap: 5,
  },
  tarjetaOfertaBadgeText: { color: BLUE_DARK, fontSize: 10, fontWeight: '700' },
  tarjetaOfertaLabel: { color: '#8A94A6', fontSize: 11, fontWeight: '600', marginTop: 4 },
  tarjetaOfertaValor: { color: '#1A202C', fontSize: 16, fontWeight: '800', marginTop: 2 },
  tarjetaOfertaNota: { color: '#4A5568', fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  tarjetaOfertaPrecio: { color: BLUE_DARK, fontSize: 20, fontWeight: '800', marginTop: 2 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: 'rgba(21,101,216,0.08)', gap: 8,
  },
  adjuntarButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(21,101,216,0.10)', justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, minHeight: 38, maxHeight: 100, backgroundColor: BG, borderRadius: 19, paddingHorizontal: 16, paddingVertical: 9, fontSize: 14, color: '#1A202C' },
  enviarButton: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center',
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  enviarButtonDisabled: { backgroundColor: '#B9C6DB', shadowOpacity: 0 },
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
grabandoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: DANGER },
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
  overlay: { flex: 1, backgroundColor: 'rgba(13,26,48,0.35)', justifyContent: 'flex-end' },
  menuOpciones: {
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 84, borderRadius: 18, paddingVertical: 6,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
  },
  opcionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  opcionIconoWrap: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  opcionTitulo: { color: '#1A202C', fontSize: 14, fontWeight: '700' },
  opcionSubtitulo: { color: '#8A94A6', fontSize: 11.5, marginTop: 1 },
  opcionDivider: { height: 1, backgroundColor: 'rgba(21,101,216,0.08)', marginLeft: 14 + 38 + 12 },

  propOverlay: { flex: 1, justifyContent: 'flex-end' },
  propBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,23,53,0.55)' },
  propCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 18,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  propHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(21,101,216,0.16)', alignSelf: 'center', marginBottom: 14 },
  propHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  propHeaderIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center' },
  propTitulo: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  propSubtitulo: { fontSize: 12, color: '#8A94A6', marginTop: 2 },
  propCerrarBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F5FA', justifyContent: 'center', alignItems: 'center' },
  propLabel: { fontSize: 13, fontWeight: '700', color: '#1A202C', marginTop: 14, marginBottom: 6 },
  propPriceRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)', borderRadius: 14, paddingHorizontal: 14,
  },
  propPriceCurrency: { fontSize: 16, color: '#8A94A6', marginRight: 4, fontWeight: '700' },
  propPriceInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '800', color: '#1A202C' },
  propTextArea: {
    backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(21,101,216,0.10)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A202C', minHeight: 70, textAlignVertical: 'top',
  },
  propError: { color: DANGER, fontSize: 12.5, fontWeight: '600', marginTop: 12, backgroundColor: '#FBEAE8', padding: 10, borderRadius: 10 },
  propEnviarBtn: {
    flexDirection: 'row', marginTop: 16, backgroundColor: BLUE, borderRadius: 16, paddingVertical: 15,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  propEnviarBtnDisabled: { backgroundColor: '#B9C6DB', shadowOpacity: 0, elevation: 0 },
  propEnviarBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});