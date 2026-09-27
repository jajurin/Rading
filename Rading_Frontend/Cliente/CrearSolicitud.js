// Cliente/CrearSolicitud.js
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Platform, Animated, KeyboardAvoidingView, Modal,
  Image,
} from "react-native";
import { useTheme } from "../ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import Header from "../Header";
import BottomNavBar from "./NavegadorCliente";
import API_URL from "../configS";

const API_BASE_URL = API_URL;

// Valor especial usado internamente para representar "el cliente prefiere
// escribir su propia respuesta" en vez de tocar uno de los chips de la IA.
const OPCION_OTRO = "__otro__";

// Cuántas fotos como máximo se pueden adjuntar a una solicitud.
const MAX_IMAGENES = 5;

const COLORS = {
  bg: "#EEF1F7",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F6FB",
  border: "rgba(15,23,42,0.09)",
  borderStrong: "rgba(15,23,42,0.16)",

  ink: "#101828",
  inkSoft: "#5B6478",
  inkFaint: "#98A2B3",

  primary: "#1554C7",
  primaryDark: "#0B3B91",
  primarySoft: "#E8EFFC",

  accent: "#B45309",
  accentBorder: "#D9822B",
  accentSoft: "#FDF3E4",

  danger: "#C0392B",
  dangerSoft: "#FBEAE8",

  success: "#1E9E6B",

  overlay: "rgba(11,23,53,0.55)",
};

const RADIUS = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

const shadow = (color, opacity, radius, y) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Math.max(2, Math.round(radius / 3)),
});

/* ── Sistema de diseño ────────────────────────────────────────────────
   Paleta profesional tipo "fintech de confianza": azul profundo como
   color de marca, ámbar reservado ÚNICA Y EXCLUSIVAMENTE para urgencia
   real (emergencia / aclaración pendiente), y una escala de grises fría
   y consistente para todo lo demás. Nada de colores "de más". ── */

function calcularCategoriaUrgencia(fechaLimite) {
  if (!fechaLimite) return null;
  const ahora = new Date();
  const diffHoras = (fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  if (diffHoras <= 12) return "Muy urgente, dentro de las próximas 12hs";
  if (diffHoras <= 24) return "Urgente, dentro de las próximas 24hs";
  if (diffHoras <= 48) return "Mañana o en las próximas 48hs";
  if (diffHoras <= 24 * 7) return "Dentro de esta semana";
  return "Sin apuro, más de una semana";
}

function formatearFechaHora(fecha) {
  if (!fecha) return "";
  const fechaStr = fecha.toLocaleDateString("es-AR");
  const horaStr = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${fechaStr} ${horaStr}`;
}

export default function CrearSolicitud({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const usuario = route?.params?.usuario;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // 👇 react-hook-form SOLO para el campo de descripción
  const {
    control: controlDescripcion,
    watch: watchDescripcion,
    formState: { errors: erroresDescripcion },
  } = useForm({
    defaultValues: { descripcion: "" },
    mode: "onChange",
  });
  const descripcionOriginal = watchDescripcion("descripcion") || "";

  const [tienePlazo, setTienePlazo] = useState(false);
  const [fechaLimite, setFechaLimite] = useState(null);
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  const [contextoActual, setContextoActual] = useState("");

  const [analizando,  setAnalizando]  = useState(false);
  const [errorIA,     setErrorIA]     = useState(null);
  const [analisis,    setAnalisis]    = useState(null);

  const [respuestas,  setRespuestas]  = useState({});
  const [textosOtro,  setTextosOtro]  = useState({});

  const [descripcionFinal, setDescripcionFinal] = useState("");
  const [servicioId,       setServicioId]       = useState(null);
  const [precioFinal,      setPrecioFinal]      = useState("");
  const [fijo,             setFijo]             = useState(true);

  const [emergencia,       setEmergencia]       = useState(false);
  const [selectorAbierto,  setSelectorAbierto]  = useState(false);

  const [usarOtraDireccion, setUsarOtraDireccion] = useState(false);
  const [direccionTrabajo, setDireccionTrabajo] = useState("");
  const [latTrabajo, setLatTrabajo] = useState(null);
  const [lngTrabajo, setLngTrabajo] = useState(null);
  const [direccionValidada, setDireccionValidada] = useState(false);
  const [sugerenciasDireccion, setSugerenciasDireccion] = useState([]);
  const [mostrarSugerenciasDireccion, setMostrarSugerenciasDireccion] = useState(false);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const debounceDireccionRef = useRef(null);

  const [imagenes, setImagenes] = useState([]);
  const [errorImagenes, setErrorImagenes] = useState(null);
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);

  const [enviando,    setEnviando]    = useState(false);
  const [errorEnvio,  setErrorEnvio]  = useState(null);

  const descripcionValida = descripcionOriginal.trim().length >= 10;
  const necesitaAclaracion = analisis !== null && analisis?.necesitaAclaracion === true && !analisis?.servicioId;
  const preguntasActuales = necesitaAclaracion ? (analisis?.preguntas || []) : [];

  const todasRespondidas = useMemo(() => {
    if (preguntasActuales.length === 0) return false;
    return preguntasActuales.every((_, idx) => {
      const r = respuestas[idx];
      if (!r) return false;
      if (r === OPCION_OTRO) return !!(textosOtro[idx] && textosOtro[idx].trim());
      return true;
    });
  }, [preguntasActuales, respuestas, textosOtro]);

  const invalidarAnalisisPrevio = useCallback(() => {
    if (analisis) {
      setAnalisis(null);
      setRespuestas({});
      setTextosOtro({});
      setContextoActual("");
    }
  }, [analisis]);

  const seleccionarRespuesta = useCallback((idx, valor) => {
    setRespuestas((prev) => ({ ...prev, [idx]: valor }));
  }, []);

  const cambiarTextoOtro = useCallback((idx, texto) => {
    setTextosOtro((prev) => ({ ...prev, [idx]: texto }));
  }, []);

  const onCambiarEmergencia = useCallback((esEmergencia) => {
    setEmergencia(esEmergencia);
    if (esEmergencia) {
      setTienePlazo(true);
      setFechaLimite(new Date());
    }
    invalidarAnalisisPrevio();
  }, [invalidarAnalisisPrevio]);

  const onCambiarFecha = useCallback((event, fechaSeleccionada) => {
    setMostrarPickerFecha(Platform.OS === "ios");
    if (event.type === "dismissed" || !fechaSeleccionada) return;
    setFechaLimite((prev) => {
      const base = prev ? new Date(prev) : new Date();
      base.setFullYear(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate());
      return base;
    });
    invalidarAnalisisPrevio();
  }, [invalidarAnalisisPrevio]);

  const onCambiarHora = useCallback((event, horaSeleccionada) => {
    setMostrarPickerHora(Platform.OS === "ios");
    if (event.type === "dismissed" || !horaSeleccionada) return;
    setFechaLimite((prev) => {
      const base = prev ? new Date(prev) : new Date();
      base.setHours(horaSeleccionada.getHours(), horaSeleccionada.getMinutes(), 0, 0);
      return base;
    });
    invalidarAnalisisPrevio();
  }, [invalidarAnalisisPrevio]);

  const buscarDireccionTrabajo = useCallback((texto) => {
    setDireccionTrabajo(texto);
    setDireccionValidada(false);
    setLatTrabajo(null);
    setLngTrabajo(null);

    if (texto.length < 4) {
      setSugerenciasDireccion([]);
      return;
    }

    if (debounceDireccionRef.current) clearTimeout(debounceDireccionRef.current);
    debounceDireccionRef.current = setTimeout(async () => {
      setBuscandoDireccion(true);
      try {
        const res = await axios.get("https://nominatim.openstreetmap.org/search", {
          params: { q: texto, format: "json", addressdetails: 1, limit: 5, countrycodes: "ar" },
          headers: { "Accept-Language": "es", "User-Agent": "RadingApp/1.0" },
        });
        setSugerenciasDireccion(res.data);
        setMostrarSugerenciasDireccion(true);
      } catch (e) {
        console.error("Error buscando dirección:", e);
      } finally {
        setBuscandoDireccion(false);
      }
    }, 600);
  }, []);

  const elegirDireccionTrabajo = useCallback((item) => {
    setDireccionTrabajo(item.display_name);
    setLatTrabajo(parseFloat(item.lat));
    setLngTrabajo(parseFloat(item.lon));
    setDireccionValidada(true);
    setSugerenciasDireccion([]);
    setMostrarSugerenciasDireccion(false);
  }, []);

  const onCambiarUsarOtraDireccion = useCallback((usarOtra) => {
    setUsarOtraDireccion(usarOtra);
    if (!usarOtra) {
      setDireccionTrabajo("");
      setLatTrabajo(null);
      setLngTrabajo(null);
      setDireccionValidada(false);
      setSugerenciasDireccion([]);
      setMostrarSugerenciasDireccion(false);
    }
    if (errorEnvio) setErrorEnvio(null);
  }, [errorEnvio]);

  const agregarImagenesDeGaleria = useCallback(async () => {
    setErrorImagenes(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrorImagenes("Necesitamos permiso para acceder a tus fotos.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGENES,
    });
    if (!resultado.canceled && resultado.assets?.length) {
      setImagenes((prev) => [...prev, ...resultado.assets].slice(0, MAX_IMAGENES));
    }
  }, []);

  const tomarFotoTrabajo = useCallback(async () => {
    setErrorImagenes(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setErrorImagenes("Necesitamos permiso para usar la cámara.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!resultado.canceled && resultado.assets?.length) {
      setImagenes((prev) => [...prev, ...resultado.assets[0]].slice(0, MAX_IMAGENES));
    }
  }, []);

  const quitarImagen = useCallback((idx) => {
    setImagenes((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const subirImagenes = useCallback(async (idTrabajo) => {
    if (imagenes.length === 0) return;
    setSubiendoImagenes(true);
    try {
      for (let i = 0; i < imagenes.length; i++) {
        const img = imagenes[i];
        const formData = new FormData();

        if (Platform.OS === "web") {
          const respuestaBlob = await fetch(img.uri);
          const blob = await respuestaBlob.blob();
          formData.append("file", blob, img.fileName || `foto_${i}.jpg`);
        } else {
          formData.append("file", {
            uri: img.uri,
            name: img.fileName || `foto_${i}.jpg`,
            type: img.mimeType || "image/jpeg",
          });
        }
        formData.append("idTrabajo", idTrabajo);
        formData.append("orden", String(i));
        if (usuario?.idCliente) formData.append("idCliente", usuario.idCliente);

        const resp = await fetch(`${API_BASE_URL}/solicitud/imagen`, {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) {
          console.error(`No se pudo subir la imagen ${i + 1}`);
        }
      }
    } catch (err) {
      console.error("Error subiendo imágenes de la solicitud:", err);
    } finally {
      setSubiendoImagenes(false);
    }
  }, [imagenes]);

  const construirTextoBase = useCallback(() => {
    const desc = descripcionOriginal.trim();
    let texto = desc;

    if (tienePlazo && fechaLimite) {
      const categoria = calcularCategoriaUrgencia(fechaLimite);
      texto += ` — Urgencia según plazo elegido: ${categoria} (fecha y hora elegida: ${formatearFechaHora(fechaLimite)})`;
    }

    if (emergencia) {
      texto += ` — Emergencia: el cliente marcó explícitamente, con un botón en la pantalla y antes de cualquier análisis, que este pedido es una emergencia`;
    }

    return texto;
  }, [descripcionOriginal, tienePlazo, fechaLimite, emergencia]);

  const construirTextoAclaracion = useCallback(() => {
    return preguntasActuales
      .map((p, idx) => {
        const r = respuestas[idx];
        const valor = r === OPCION_OTRO ? (textosOtro[idx] || "").trim() : r;
        return `${p.pregunta} → ${valor}`;
      })
      .join(" | ");
  }, [preguntasActuales, respuestas, textosOtro]);

  const analizarConIA = useCallback(async (descripcionExtra = "") => {
    if (!descripcionValida) return;
    setAnalizando(true);
    setErrorIA(null);

    const base = descripcionExtra
      ? (contextoActual || construirTextoBase())
      : construirTextoBase();

    const textoFinal = descripcionExtra
      ? `${base} — Aclaración: ${descripcionExtra.trim()}`
      : base;

    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionOriginal: textoFinal }),
      });

      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.message || "No se pudo analizar la solicitud");

      const data = json.data;
      setAnalisis(null);
      setRespuestas({});
      setTextosOtro({});
      setAnalisis(data);
      setDescripcionFinal(data.descripcionMejorada);
      setServicioId(data.servicioId);
      setPrecioFinal(String(data.precioSugerido));
      setEmergencia((prev) => prev || !!data.emergencia);
      setContextoActual(textoFinal);
    } catch (err) {
      setErrorIA(err.message || "Ocurrió un error analizando tu solicitud");
    } finally {
      setAnalizando(false);
    }
  }, [descripcionValida, contextoActual, construirTextoBase]);

  const confirmarRespuestas = useCallback(() => {
    const texto = construirTextoAclaracion();
    if (!texto.trim()) return;
    analizarConIA(texto);
  }, [construirTextoAclaracion, analizarConIA]);

  const enviarSolicitud = useCallback(async () => {
    if (!analisis || !servicioId || necesitaAclaracion) return;

    if (usarOtraDireccion && !direccionValidada) {
      setErrorEnvio("Elegí una dirección de la lista de sugerencias, o volvé a usar tu dirección predeterminada.");
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    const direccionEfectiva = usarOtraDireccion && direccionValidada
      ? direccionTrabajo
      : (usuario?.direccion ?? null);
    const latEfectiva = usarOtraDireccion && direccionValidada
      ? latTrabajo
      : (usuario?.lat ?? null);
    const lngEfectiva = usarOtraDireccion && direccionValidada
      ? lngTrabajo
      : (usuario?.lng ?? null);

    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente: usuario?.idCliente,
          servicioId,
          descripcion: descripcionFinal,
          descripcionOriginal: contextoActual || descripcionOriginal,
          precio: Number(precioFinal),
          fijo,
          emergencia,
          fechaRequerida: tienePlazo && fechaLimite
            ? fechaLimite.toISOString().slice(0, 10)
            : null,
          horarioRequerido: tienePlazo && fechaLimite
            ? fechaLimite.toTimeString().slice(0, 5)
            : null,
          direccion: direccionEfectiva,
          lat: latEfectiva,
          lng: lngEfectiva,
        }),
      });

      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.message || "No se pudo crear la solicitud");

      const idTrabajoCreado = json?.data?.id ?? json?.id ?? null;
      if (idTrabajoCreado && imagenes.length > 0) {
        await subirImagenes(idTrabajoCreado);
      }

      navigation?.goBack?.();
    } catch (err) {
      setErrorEnvio(err.message || "Ocurrió un error al enviar la solicitud");
    } finally {
      setEnviando(false);
    }
  }, [
    analisis, servicioId, necesitaAclaracion, descripcionFinal, descripcionOriginal,
    contextoActual, precioFinal, fijo, emergencia, tienePlazo, fechaLimite, usuario,
    navigation, usarOtraDireccion, direccionValidada, direccionTrabajo, latTrabajo,
    lngTrabajo, imagenes, subirImagenes,
  ]);

  const servicioElegido = analisis?.servicios?.find((s) => s.id === servicioId);

  // Componentes movidos dentro del componente principal
  const SegmentedToggle = ({ options, selectedIndex, onChange }) => {
    const anim = useRef(new Animated.Value(selectedIndex)).current;

    useEffect(() => {
      Animated.spring(anim, { toValue: selectedIndex, useNativeDriver: false, bounciness: 0 }).start();
    }, [selectedIndex, anim]);

    const left = anim.interpolate({
      inputRange: options.map((_, i) => i),
      outputRange: options.map((_, i) => `${(i * 100) / options.length}%`),
    });

    return (
      <View style={styles.segmentedTrack}>
        <View style={styles.segmentedRelative}>
          <Animated.View style={[styles.segmentedBubble, { width: `${100 / options.length}%`, left }]} />
          {options.map((opt, i) => (
            <Pressable key={opt} style={styles.segmentedButton} onPress={() => onChange(i)} hitSlop={6}>
              <Text style={[styles.segmentedText, selectedIndex === i && styles.segmentedTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const SectionHeader = ({ label }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );

  const PreguntaItem = ({ pregunta, opciones, seleccion, textoOtro, onSeleccionar, onCambiarTexto, deshabilitado }) => {
    const eligioOtro = seleccion === OPCION_OTRO;

    return (
      <View style={styles.preguntaItem}>
        <Text style={styles.preguntaTexto}>{pregunta}</Text>
        <View style={styles.chipsRow}>
          {opciones.map((opcion) => {
            const activo = seleccion === opcion;
            return (
              <Pressable
                key={opcion}
                style={[styles.chip, activo && styles.chipActivo]}
                onPress={() => onSeleccionar(opcion)}
                disabled={deshabilitado}
              >
                <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{opcion}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.chip, styles.chipOtro, eligioOtro && styles.chipActivo]}
            onPress={() => onSeleccionar(OPCION_OTRO)}
            disabled={deshabilitado}
          >
            <Ionicons
              name="create-outline"
              size={14}
              color={eligioOtro ? "#fff" : COLORS.inkSoft}
              style={styles.chipIcon}
            />
            <Text style={[styles.chipText, eligioOtro && styles.chipTextActivo]}>Otro</Text>
          </Pressable>
        </View>

        {eligioOtro && (
          <TextInput
            style={styles.otroInput}
            placeholder="Escribí tu respuesta..."
            placeholderTextColor={COLORS.inkFaint}
            value={textoOtro}
            onChangeText={onCambiarTexto}
            editable={!deshabilitado}
          />
        )}
      </View>
    );
  };

  const AclaracionBox = ({ preguntas, respuestas, textosOtro, onSeleccionar, onCambiarTexto, onConfirmar, todasRespondidas, analizando }) => (
    <View style={styles.aclaracionBox}>
      <View style={styles.aclaracionIconRow}>
        <View style={styles.aclaracionIconWrap}>
          <Ionicons name="help" size={16} color="#fff" />
        </View>
        <Text style={styles.aclaracionTitulo}>
          {preguntas.length > 1 ? "Necesitamos un poco más de info" : "Necesitamos un dato más"}
        </Text>
      </View>

      {preguntas.map((p, idx) => (
        <PreguntaItem
          key={idx}
          pregunta={p.pregunta}
          opciones={p.opciones}
          seleccion={respuestas[idx]}
          textoOtro={textosOtro[idx] || ""}
          onSeleccionar={(valor) => onSeleccionar(idx, valor)}
          onCambiarTexto={(texto) => onCambiarTexto(idx, texto)}
          deshabilitado={analizando}
        />
      ))}

      <Pressable
        style={[styles.aiButton, styles.aiButtonWarn, (!todasRespondidas || analizando) && styles.aiButtonDisabled]}
        onPress={onConfirmar}
        disabled={!todasRespondidas || analizando}
      >
        {analizando
          ? <ActivityIndicator color="#fff" />
          : (
            <>
              <Ionicons name="arrow-forward-circle" size={18} color="#fff" style={styles.aiButtonIcon} />
              <Text style={styles.aiButtonText}>Continuar con esta info</Text>
            </>
          )
        }
      </Pressable>
    </View>
  );

  const ImagenAdjuntaThumb = ({ uri, onQuitar, deshabilitado }) => (
    <View style={styles.imagenThumbWrap}>
      <Image source={{ uri }} style={styles.imagenThumb} />
      <Pressable
        style={styles.imagenThumbQuitar}
        onPress={onQuitar}
        disabled={deshabilitado}
        hitSlop={6}
      >
        <Ionicons name="close" size={12} color="#fff" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.flex1} edges={["top"]}>
      <Header usuario={usuario} navigation={navigation} />

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner de la pantalla */}
          <View style={styles.banner}>
            <View style={styles.bannerGlowTop} />
            <View style={styles.bannerGlowBottom} />

            <Pressable onPress={() => navigation?.goBack?.()} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>

            <Text style={styles.eyebrow}>NUEVA SOLICITUD</Text>
            <Text style={styles.tagline}>Contanos qué necesitás</Text>
            <Text style={styles.subtitle}>La IA te ayuda a redactar el pedido y a estimar un precio justo</Text>
          </View>

          {/* Tarjeta: descripción original */}
          <View style={styles.card}>
            <SectionHeader label="Tu pedido" />
            <Text style={styles.label}>Descripción</Text>
            <Text style={styles.helperText}>
              Contá el problema con tus palabras. La IA va a sugerirte el servicio y un precio estimado.
            </Text>
            <Controller
              control={controlDescripcion}
              name="descripcion"
              rules={{
                required: "Contá qué necesitás.",
                minLength: { value: 10, message: "Contá un poco más (mínimo 10 caracteres)." },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Ej: el grifo de mi cocina pierde agua desde ayer..."
                  placeholderTextColor={COLORS.inkFaint}
                  value={value}
                  onChangeText={(t) => {
                    onChange(t);
                    invalidarAnalisisPrevio();
                  }}
                  onBlur={onBlur}
                  editable={!analizando}
                />
              )}
            />
            {erroresDescripcion.descripcion && (
              <Text style={styles.errorText}>{erroresDescripcion.descripcion.message}</Text>
            )}

            <Text style={styles.label}>Fotos (opcional)</Text>
            <Text style={styles.helperText}>
              Ayudan a que el trabajador entienda mejor el problema antes de ofertar.
            </Text>
            <View style={styles.imagenesRow}>
              {imagenes.map((img, idx) => (
                <ImagenAdjuntaThumb
                  key={img.assetId ?? img.uri ?? idx}
                  uri={img.uri}
                  onQuitar={() => quitarImagen(idx)}
                  deshabilitado={subiendoImagenes}
                />
              ))}
              {imagenes.length < MAX_IMAGENES && (
                <View style={styles.imagenesBotonesWrap}>
                  <Pressable
                    style={styles.imagenAgregarBtn}
                    onPress={agregarImagenesDeGaleria}
                    disabled={subiendoImagenes}
                  >
                    <Ionicons name="images" size={18} color={COLORS.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.imagenAgregarBtn}
                    onPress={tomarFotoTrabajo}
                    disabled={subiendoImagenes}
                  >
                    <Ionicons name="camera" size={18} color={COLORS.primary} />
                  </Pressable>
                </View>
              )}
            </View>
            {errorImagenes && <Text style={styles.errorText}>{errorImagenes}</Text>}

            <Text style={styles.label}>¿Es una emergencia?</Text>
            <Text style={styles.helperText}>
              Pérdida de agua activa, corte de luz total, olor a gas, riesgo estructural, etc.
            </Text>
            <SegmentedToggle
              options={["No", "Sí, es urgente"]}
              selectedIndex={emergencia ? 1 : 0}
              onChange={(i) => onCambiarEmergencia(i === 1)}
            />

            {emergencia ? (
              <View style={styles.emergenciaAviso}>
                <Ionicons name="alert-circle" size={18} color={COLORS.danger} style={styles.emergenciaAvisoIcon} />
                <Text style={styles.emergenciaAvisoText}>
                  Como marcaste que es una emergencia, el plazo se toma como "hoy mismo" y la IA va a
                  aplicar el recargo correspondiente al cotizar.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>¿Tenés un plazo o fecha límite para este trabajo?</Text>
                <SegmentedToggle
                  options={["No, sin apuro", "Sí, elegir fecha"]}
                  selectedIndex={tienePlazo ? 1 : 0}
                  onChange={(i) => {
                    const activar = i === 1;
                    setTienePlazo(activar);
                    if (activar && !fechaLimite) setFechaLimite(new Date());
                    invalidarAnalisisPrevio();
                  }}
                />

                {tienePlazo && (
                  <View style={styles.plazoRow}>
                    <Pressable style={styles.plazoBox} onPress={() => setMostrarPickerFecha(true)}>
                      <Text style={styles.plazoBoxLabel}>Fecha</Text>
                      <Text style={styles.plazoBoxValue}>
                        {fechaLimite ? fechaLimite.toLocaleDateString("es-AR") : "Elegir"}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.plazoBox} onPress={() => setMostrarPickerHora(true)}>
                      <Text style={styles.plazoBoxLabel}>Hora</Text>
                      <Text style={styles.plazoBoxValue}>
                        {fechaLimite ? fechaLimite.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "Elegir"}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {tienePlazo && mostrarPickerFecha && (
                  <DateTimePicker
                    value={fechaLimite || new Date()}
                    mode="date"
                    minimumDate={new Date()}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onCambiarFecha}
                  />
                )}

                {tienePlazo && mostrarPickerHora && (
                  <DateTimePicker
                    value={fechaLimite || new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onCambiarHora}
                  />
                )}
              </>
            )}

            <Pressable
              style={[styles.aiButton, (!descripcionValida || analizando) && styles.aiButtonDisabled]}
              onPress={() => analizarConIA()}
              disabled={!descripcionValida || analizando}
            >
              {analizando
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="sparkles" size={17} color="#fff" style={styles.aiButtonIcon} />
                    <Text style={styles.aiButtonText}>{analisis ? "Volver a analizar" : "Analizar con IA"}</Text>
                  </>
                )
              }
            </Pressable>

            {errorIA && <Text style={styles.errorText}>{errorIA}</Text>}
          </View>

          {/* ── Bloque de aclaración ── */}
          {analisis && necesitaAclaracion && preguntasActuales.length > 0 && (
            <AclaracionBox
              preguntas={preguntasActuales}
              respuestas={respuestas}
              textosOtro={textosOtro}
              onSeleccionar={seleccionarRespuesta}
              onCambiarTexto={cambiarTextoOtro}
              onConfirmar={confirmarRespuestas}
              todasRespondidas={todasRespondidas}
              analizando={analizando}
            />
          )}

          {/* ── Resultado del análisis ── */}
          {analisis && !necesitaAclaracion && (
            <View style={styles.card}>
              <View style={styles.resultBadgeRow}>
                <View style={styles.resultBadge}>
                  <Ionicons name="sparkles" size={11} color="#fff" style={styles.resultBadgeIcon} />
                  <Text style={styles.resultBadgeText}>Sugerido por IA · editable</Text>
                </View>
                {emergencia && (
                  <View style={styles.emergenciaBadge}>
                    <Ionicons name="alert-circle" size={11} color="#fff" style={styles.resultBadgeIcon} />
                    <Text style={styles.emergenciaBadgeText}>Emergencia</Text>
                  </View>
                )}
              </View>
              <SectionHeader label="Revisá la propuesta" />

              <Text style={styles.label}>Descripción mejorada</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={descripcionFinal}
                onChangeText={setDescripcionFinal}
              />

              <Text style={styles.label}>Servicio</Text>
              <Pressable style={styles.selectBox} onPress={() => setSelectorAbierto((v) => !v)}>
                <Text style={styles.selectText}>{servicioElegido?.nombre ?? "Seleccionar servicio"}</Text>
                <Ionicons
                  name={selectorAbierto ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.inkSoft}
                />
              </Pressable>

              <Modal
                visible={selectorAbierto}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectorAbierto(false)}
              >
                <Pressable style={styles.modalBackdrop} onPress={() => setSelectorAbierto(false)}>
                  <Pressable style={styles.modalCard} onPress={() => {}}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitulo}>Elegí el servicio</Text>
                      <Pressable onPress={() => setSelectorAbierto(false)} hitSlop={10} style={styles.modalCerrarBtn}>
                        <Ionicons name="close" size={16} color={COLORS.inkSoft} />
                      </Pressable>
                    </View>
                    <ScrollView
                      style={styles.modalScroll}
                      showsVerticalScrollIndicator
                      keyboardShouldPersistTaps="handled"
                    >
                      {analisis.servicios?.map((s) => {
                        const activo = s.id === servicioId;
                        return (
                          <Pressable
                            key={s.id}
                            style={[styles.dropdownItem, activo && styles.dropdownItemActivo]}
                            onPress={() => { setServicioId(s.id); setSelectorAbierto(false); }}
                          >
                            <View style={styles.dropdownItemTextWrap}>
                              <Text style={styles.dropdownItemCategoria}>{s.categoria}</Text>
                              <Text style={[styles.dropdownItemText, activo && styles.dropdownItemTextActivo]}>
                                {s.nombre}
                              </Text>
                            </View>
                            {activo && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>

              {tienePlazo && fechaLimite && (
                <>
                  <Text style={styles.label}>Plazo elegido</Text>
                  <Text style={styles.plazoResumen}>
                    {emergencia ? "Hoy mismo (emergencia)" : formatearFechaHora(fechaLimite)}
                  </Text>
                </>
              )}

              {/* ── Dirección del trabajo ── */}
              <Text style={styles.label}>Dirección del trabajo</Text>
              <Text style={styles.helperText}>
                Se usa para calcular la distancia con los trabajadores disponibles.
              </Text>
              <SegmentedToggle
                options={["Mi dirección", "Otra dirección"]}
                selectedIndex={usarOtraDireccion ? 1 : 0}
                onChange={(i) => onCambiarUsarOtraDireccion(i === 1)}
              />

              {!usarOtraDireccion ? (
                <View style={styles.direccionActualBox}>
                  <Ionicons name="location" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.direccionActualTexto} numberOfLines={2}>
                    {usuario?.direccion || "No tenés una dirección cargada en tu perfil"}
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <View style={[styles.direccionInputBox, direccionValidada && styles.direccionInputBoxOk]}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={direccionValidada ? COLORS.success : COLORS.inkSoft}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={styles.direccionInput}
                      placeholder="Av. Siempre Viva 123"
                      placeholderTextColor={COLORS.inkFaint}
                      value={direccionTrabajo}
                      onChangeText={buscarDireccionTrabajo}
                      autoCapitalize="none"
                    />
                    {buscandoDireccion && <ActivityIndicator size="small" color={COLORS.primary} />}
                    {direccionValidada && !buscandoDireccion && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    )}
                  </View>

                  {mostrarSugerenciasDireccion && sugerenciasDireccion.length > 0 && (
                    <View style={styles.sugerenciasContainer}>
                      {sugerenciasDireccion.map((item, idx) => (
                        <Pressable
                          key={item.place_id}
                          style={[
                            styles.sugerenciaItem,
                            idx === sugerenciasDireccion.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => elegirDireccionTrabajo(item)}
                        >
                          <Ionicons name="location" size={14} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
                          <Text style={styles.sugerenciaTexto} numberOfLines={2}>{item.display_name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {!direccionValidada && direccionTrabajo.length > 0 && !buscandoDireccion && (
                    <Text style={styles.errorText}>Elegí una dirección de la lista de sugerencias.</Text>
                  )}
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.label}>Modalidad</Text>
              <SegmentedToggle
                options={["Precio fijo", "A subasta"]}
                selectedIndex={fijo ? 0 : 1}
                onChange={(i) => setFijo(i === 0)}
              />

              <Text style={styles.label}>{fijo ? "Precio" : "Precio base para la subasta"}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  value={precioFinal}
                  onChangeText={setPrecioFinal}
                />
              </View>
              <Text style={styles.priceRange}>
                Rango estimado: ${analisis.precioMin?.toLocaleString("es-AR")} – ${analisis.precioMax?.toLocaleString("es-AR")}
              </Text>
              {analisis.notas ? (
                <Text style={styles.priceNote}>{analisis.notas} Es una estimación, puede no ser exacta.</Text>
              ) : null}
            </View>
          )}

          {errorEnvio && <Text style={[styles.errorText, styles.errorTextOutside]}>{errorEnvio}</Text>}

          {/* Botón enviar */}
          <Pressable
            style={[
              styles.submitButton,
              (!analisis || !servicioId || enviando || necesitaAclaracion) && styles.submitButtonDisabled,
            ]}
            disabled={!analisis || !servicioId || enviando || necesitaAclaracion}
            onPress={enviarSolicitud}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitButtonText}>
                  {!analisis
                    ? "Analizá la descripción primero"
                    : necesitaAclaracion
                    ? "Respondé las preguntas primero"
                    : "Enviar solicitud"}
                </Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar usuario={usuario} />
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  flex1: { flex: 1, backgroundColor: isDark ? colors.background : COLORS.bg },
  scrollContent: { flexGrow: 1, paddingBottom: 180 },

  /* ── Banner de la pantalla ── */
  banner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bannerGlowTop: {
    position: 'absolute', top: -40, right: -40, width: 150, height: 150,
    borderRadius: 75, backgroundColor: '#fff', opacity: 0.12,
  },
  bannerGlowBottom: {
    position: 'absolute', bottom: -55, left: -30, width: 130, height: 130,
    borderRadius: 65, backgroundColor: '#fff', opacity: 0.08,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, width: 32, height: 32,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  eyebrow: { color: 'rgba(255,255,255,0.62)', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  tagline: { color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: '500' },

  /* ── Cards ── */
  card: {
    backgroundColor: isDark ? colors.card : COLORS.surface,
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: isDark ? colors.border : COLORS.border,
    ...shadow(colors.shadow, 0.05, 12, 4),
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: isDark ? colors.text : COLORS.ink },

  label: { fontSize: 12, fontWeight: '700', color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  helperText: { fontSize: 12.5, color: COLORS.inkFaint, marginBottom: 10, lineHeight: 17 },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 6 },
  errorTextOutside: { marginHorizontal: 16, marginTop: 12 },

  /* ── TextArea ── */
  textArea: {
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? colors.inputBorder : COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: isDark ? colors.text : COLORS.ink,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  /* ── Segmented Toggle ── */
  segmentedTrack: {
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.pill,
    height: 44,
    flexDirection: 'row',
    padding: 3,
  },
  segmentedRelative: { flex: 1, flexDirection: 'row', position: 'relative' },
  segmentedBubble: {
    position: 'absolute', top: 3, bottom: 3,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    ...shadow(COLORS.primary, 0.25, 6, 2),
  },
  segmentedButton: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  segmentedText: { fontSize: 12.5, fontWeight: '700', color: COLORS.inkSoft },
  segmentedTextActive: { color: '#fff' },

  /* ── Fotos ── */
  imagenesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  imagenThumbWrap: { position: 'relative' },
  imagenThumb: { width: 72, height: 72, borderRadius: RADIUS.md },
  imagenThumbQuitar: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22,
    borderRadius: 11, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  imagenesBotonesWrap: { flexDirection: 'row', gap: 10 },
  imagenAgregarBtn: {
    width: 72, height: 72, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },

  /* ── Emergencia ── */
  emergenciaAviso: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: COLORS.dangerSoft, borderRadius: RADIUS.md,
    padding: 12, marginTop: 12,
  },
  emergenciaAvisoIcon: { marginTop: 1 },
  emergenciaAvisoText: { flex: 1, fontSize: 12.5, color: COLORS.danger, lineHeight: 17 },

  /* ── IA Button ── */
  aiButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
    paddingVertical: 14, marginTop: 16,
    ...shadow(COLORS.accent, 0.3, 8, 3),
  },
  aiButtonWarn: { backgroundColor: COLORS.accent },
  aiButtonDisabled: { opacity: 0.5, ...shadow('transparent', 0, 0, 0) },
  aiButtonIcon: { marginRight: 2 },
  aiButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* ── Aclaración ── */
  aclaracionBox: {
    backgroundColor: isDark ? colors.surfaceVariant : COLORS.accentSoft,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  aclaracionIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  aclaracionIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  aclaracionTitulo: { fontSize: 14, fontWeight: '800', color: COLORS.accent },

  preguntaItem: {
    backgroundColor: isDark ? colors.card : COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? colors.border : COLORS.border,
  },
  preguntaTexto: { fontSize: 13.5, fontWeight: '700', color: isDark ? colors.text : COLORS.ink, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: isDark ? colors.border : COLORS.border,
  },
  chipActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: COLORS.inkSoft },
  chipTextActivo: { color: '#fff' },
  chipOtro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipIcon: { marginRight: 0 },

  otroInput: {
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? colors.inputBorder : COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13.5,
    color: isDark ? colors.text : COLORS.ink,
    marginTop: 10,
  },

  /* ── Resultado IA ── */
  resultBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  resultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  resultBadgeIcon: { marginRight: 0 },
  resultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emergenciaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  emergenciaBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  selectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? colors.inputBorder : COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 4,
  },
  selectText: { fontSize: 14, color: isDark ? colors.text : COLORS.ink },

  modalBackdrop: {
    flex: 1, backgroundColor: COLORS.overlay,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: isDark ? colors.card : COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    ...shadow('#000', 0.2, 24, 8),
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: isDark ? colors.border : COLORS.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: isDark ? colors.text : COLORS.ink, flex: 1 },
  modalCerrarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? colors.surfaceVariant : COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { maxHeight: 300 },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.divider : COLORS.border,
  },
  dropdownItemActivo: { backgroundColor: COLORS.primarySoft },
  dropdownItemTextWrap: { flex: 1 },
  dropdownItemCategoria: { fontSize: 10.5, fontWeight: '700', color: COLORS.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: isDark ? colors.text : COLORS.ink },
  dropdownItemTextActivo: { color: COLORS.primary, fontWeight: '800' },

  plazoResumen: { fontSize: 14, fontWeight: '600', color: isDark ? colors.text : COLORS.ink },

  /* ── Dirección ── */
  direccionActualBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 12, marginTop: 10,
  },
  direccionActualTexto: { flex: 1, fontSize: 13.5, color: isDark ? colors.text : COLORS.ink, lineHeight: 18 },

  direccionInputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? colors.inputBorder : COLORS.border,
    paddingHorizontal: 12,
  },
  direccionInputBoxOk: { borderColor: COLORS.success },
  direccionInput: { flex: 1, fontSize: 14, color: isDark ? colors.text : COLORS.ink, paddingVertical: 12 },

  sugerenciasContainer: {
    backgroundColor: isDark ? colors.card : COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: isDark ? colors.border : COLORS.border,
    overflow: 'hidden',
  },
  sugerenciaItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.divider : COLORS.border,
  },
  sugerenciaTexto: { flex: 1, fontSize: 13, color: isDark ? colors.text : COLORS.ink },

  divisor: { height: 1, backgroundColor: isDark ? colors.divider : COLORS.border, marginVertical: 16 },

  /* ── Precio ── */
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDark ? colors.inputBg : COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? colors.inputBorder : COLORS.border,
    paddingHorizontal: 12,
  },
  priceCurrency: { fontSize: 18, fontWeight: '800', color: COLORS.inkSoft, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 16, color: isDark ? colors.text : COLORS.ink, paddingVertical: 12 },
  priceRange: { fontSize: 12, color: COLORS.inkFaint, marginTop: 8 },
  priceNote: { fontSize: 12, color: COLORS.accent, marginTop: 6, fontStyle: 'italic' },

  /* ── Submit ── */
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    ...shadow(COLORS.primary, 0.3, 10, 4),
  },
  submitButtonDisabled: { opacity: 0.4, ...shadow('transparent', 0, 0, 0) },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
