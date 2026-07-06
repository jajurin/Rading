// Cliente/CrearSolicitud.js
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Platform, Animated, KeyboardAvoidingView, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Header from "../Header";
import BottomNavBar from "./NavegadorCliente";
import API_URL from "../configS";

const API_BASE_URL = API_URL;

// Valor especial usado internamente para representar "el cliente prefiere
// escribir su propia respuesta" en vez de tocar uno de los chips de la IA.
const OPCION_OTRO = "__otro__";

/* ── Sistema de diseño ────────────────────────────────────────────────
   Paleta profesional tipo "fintech de confianza": azul profundo como
   color de marca, ámbar reservado ÚNICA Y EXCLUSIVAMENTE para urgencia
   real (emergencia / aclaración pendiente), y una escala de grises fría
   y consistente para todo lo demás. Nada de colores "de más". ── */
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

/* ── Cálculo de urgencia a partir de la fecha/hora elegida ───────────
   Esto se calcula acá (JS), no se le pide a la IA que haga cuentas con
   fechas: le pasamos ya la categoría resuelta como texto, más precisa. ── */
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

/* ── Selector tipo pastilla animada ─────────────────────────────────── */
function SegmentedToggle({ options, selectedIndex, onChange }) {
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
}

function SectionHeader({ label }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

/* ── Una sola pregunta dentro del bloque de aclaración ──────────────── */
// Muestra la pregunta + sus chips de opciones. Si el usuario toca el chip
// "Otro", se abre un input de texto libre solo para esta pregunta.
function PreguntaItem({ pregunta, opciones, seleccion, textoOtro, onSeleccionar, onCambiarTexto, deshabilitado }) {
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
}

/* ── Bloque de aclaración (puede traer 1, 2 o 3 preguntas juntas) ────── */
function AclaracionBox({ preguntas, respuestas, textosOtro, onSeleccionar, onCambiarTexto, onConfirmar, todasRespondidas, analizando }) {
  return (
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
}

/* ── Pantalla principal ──────────────────────────────────────────────── */
export default function CrearSolicitud({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const [descripcionOriginal, setDescripcionOriginal] = useState("");

  // 👇 Plazo/fecha límite: dato ESTRUCTURADO (Date real), no texto libre,
  // porque se guarda como atributo de la solicitud (horario_requerido /
  // fecha_iniciado en la base) y se puede mostrar después tal cual.
  const [tienePlazo, setTienePlazo] = useState(false);
  const [fechaLimite, setFechaLimite] = useState(null); // Date | null
  const [mostrarPickerFecha, setMostrarPickerFecha] = useState(false);
  const [mostrarPickerHora, setMostrarPickerHora] = useState(false);

  // 👇 guarda el texto COMPLETO (original + plazo + emergencia + TODAS las
  // aclaraciones acumuladas) que se mandó a la IA en el último análisis
  // exitoso. Sin esto, al responder una segunda tanda de preguntas se
  // perdía el contexto de la primera, porque siempre se reconstruía el
  // texto solo desde descripcionOriginal.
  const [contextoActual, setContextoActual] = useState("");

  const [analizando,  setAnalizando]  = useState(false);
  const [errorIA,     setErrorIA]     = useState(null);
  const [analisis,    setAnalisis]    = useState(null);

  // 👇 Estado de las respuestas a la tanda de preguntas actual. "respuestas"
  // guarda, por índice de pregunta, el chip elegido (o OPCION_OTRO).
  // "textosOtro" guarda el texto libre cuando se elige "Otro" en esa pregunta.
  const [respuestas,  setRespuestas]  = useState({});
  const [textosOtro,  setTextosOtro]  = useState({});

  const [descripcionFinal, setDescripcionFinal] = useState("");
  const [servicioId,       setServicioId]       = useState(null);
  const [precioFinal,      setPrecioFinal]      = useState("");
  const [fijo,             setFijo]             = useState(true);

  // 👇 Ahora "emergencia" se elige ANTES de analizar (botón junto a la
  // descripción), no se le pregunta más al cliente después de la IA.
  // Igual la dejamos sumarse con lo que la IA detecte por su cuenta (por
  // ejemplo si describe una pérdida de agua activa sin haber tocado el
  // botón), pero nunca se la bajamos si el cliente ya la marcó a mano.
  const [emergencia,       setEmergencia]       = useState(false);
  const [selectorAbierto,  setSelectorAbierto]  = useState(false);

  const [enviando,    setEnviando]    = useState(false);
  const [errorEnvio,  setErrorEnvio]  = useState(null);

  const descripcionValida = descripcionOriginal.trim().length >= 10;
  // Solo depende de lo que dijo la IA, no del servicioId
  const necesitaAclaracion = analisis !== null && analisis?.necesitaAclaracion === true && !analisis?.servicioId;
  const preguntasActuales = necesitaAclaracion ? (analisis?.preguntas || []) : [];

  // Se puede confirmar la tanda cuando TODAS las preguntas tienen una
  // respuesta válida: o bien un chip normal, o "Otro" con texto no vacío.
  const todasRespondidas = useMemo(() => {
    if (preguntasActuales.length === 0) return false;
    return preguntasActuales.every((_, idx) => {
      const r = respuestas[idx];
      if (!r) return false;
      if (r === OPCION_OTRO) return !!(textosOtro[idx] && textosOtro[idx].trim());
      return true;
    });
  }, [preguntasActuales, respuestas, textosOtro]);

  // Se invalida el análisis anterior si el cliente todavía no analizó y
  // cambia cualquier dato de entrada (descripción, plazo o emergencia).
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

  // 👇 Toggle de emergencia: se elige ANTES de analizar. Si se marca que sí,
  // forzamos el plazo a "hoy mismo" (una emergencia no se agenda para otro
  // día) y ya no hace falta pedirle fecha/hora por separado.
  const onCambiarEmergencia = useCallback((esEmergencia) => {
    setEmergencia(esEmergencia);
    if (esEmergencia) {
      setTienePlazo(true);
      setFechaLimite(new Date());
    }
    invalidarAnalisisPrevio();
  }, [invalidarAnalisisPrevio]);

  // Maneja el picker nativo de fecha (Android cierra solo, iOS queda inline).
  const onCambiarFecha = useCallback((event, fechaSeleccionada) => {
    setMostrarPickerFecha(Platform.OS === "ios"); // en iOS se mantiene abierto hasta que el usuario confirme
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

  // Arma el texto base (descripción + plazo + emergencia, si corresponde)
  // que se manda a la IA en el PRIMER análisis. La categoría de urgencia
  // se calcula en JS a partir de la fecha/hora elegida en el picker (no es
  // texto libre); la emergencia es un flag que el cliente marcó a mano
  // ANTES de analizar, con su propio marcador de texto para el backend.
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

  // Junta pregunta+respuesta de toda la tanda en un solo texto legible,
  // para mandarlo como "Aclaración" al backend.
  const construirTextoAclaracion = useCallback(() => {
    return preguntasActuales
      .map((p, idx) => {
        const r = respuestas[idx];
        const valor = r === OPCION_OTRO ? (textosOtro[idx] || "").trim() : r;
        return `${p.pregunta} → ${valor}`;
      })
      .join(" | ");
  }, [preguntasActuales, respuestas, textosOtro]);

  // Llama a /analizar concatenando la(s) aclaración(es) si existen.
  // Usa contextoActual (todo lo acumulado hasta ahora) como base cuando
  // viene de una aclaración, en vez de descripcionOriginal a secas.
  const analizarConIA = useCallback(async (descripcionExtra = "") => {
    if (!descripcionValida) return;
    setAnalizando(true);
    setErrorIA(null);

    // Base sobre la que se construye el texto: si ya hay contexto acumulado
    // (de una tanda de aclaraciones previa), se sigue sumando sobre ESE; si
    // es el primer análisis, se arranca desde descripción + plazo + emergencia.
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
      setAnalisis(null);         // limpia el análisis anterior primero
      setRespuestas({});         // limpia las respuestas de la tanda anterior
      setTextosOtro({});
      setAnalisis(data);
      setDescripcionFinal(data.descripcionMejorada);
      setServicioId(data.servicioId);
      setPrecioFinal(String(data.precioSugerido));
      // 👇 Nunca "bajamos" la emergencia si el cliente ya la marcó a mano;
      // solo la subimos si la IA detecta una emergencia real que el
      // cliente no había tildado (ej: describe una pérdida de agua activa
      // sin haber tocado el botón).
      setEmergencia((prev) => prev || !!data.emergencia);

      // 👇 guarda el texto completo que efectivamente se usó,
      // para que la PRÓXIMA tanda de aclaraciones (si la hay) se acumule
      // sobre esto.
      setContextoActual(textoFinal);
    } catch (err) {
      setErrorIA(err.message || "Ocurrió un error analizando tu solicitud");
    } finally {
      setAnalizando(false);
    }
  }, [descripcionValida, contextoActual, construirTextoBase]);

  // 👇 Se dispara al tocar "Continuar con esta info": junta las respuestas
  // de todas las preguntas de la tanda actual y reanaliza con eso.
  const confirmarRespuestas = useCallback(() => {
    const texto = construirTextoAclaracion();
    if (!texto.trim()) return;
    analizarConIA(texto);
  }, [construirTextoAclaracion, analizarConIA]);

  const enviarSolicitud = useCallback(async () => {
    if (!analisis || !servicioId || necesitaAclaracion) return;
    setEnviando(true);
    setErrorEnvio(null);

    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente: usuario?.idCliente,
          servicioId,
          descripcion: descripcionFinal,
          // 👇 Se manda el contexto completo (con plazo, emergencia y
          // aclaraciones) en vez del texto original puro, para que quede
          // guardado con todo el detalle que usó la IA para cotizar.
          descripcionOriginal: contextoActual || descripcionOriginal,
          precio: Number(precioFinal),
          fijo,
          emergencia,
          // 👇 Dato ESTRUCTURADO real (no texto libre) para guardar como
          // atributo de la solicitud, tal como está tipado en la base:
          // fecha (date) + hora (time) del plazo elegido por el cliente.
          // Si es una emergencia, tienePlazo/fechaLimite ya quedaron
          // forzados a "ahora" apenas se tildó el botón. Si no eligió
          // plazo, se manda null y el backend lo interpreta como "sin
          // plazo particular".
          fechaRequerida: tienePlazo && fechaLimite
            ? fechaLimite.toISOString().slice(0, 10)   // YYYY-MM-DD
            : null,
          horarioRequerido: tienePlazo && fechaLimite
            ? fechaLimite.toTimeString().slice(0, 5)   // HH:mm
            : null,
        }),
      });

      const json = await resp.json();
      if (!resp.ok || !json.ok) throw new Error(json.message || "No se pudo crear la solicitud");

      navigation?.goBack?.();
    } catch (err) {
      setErrorEnvio(err.message || "Ocurrió un error al enviar la solicitud");
    } finally {
      setEnviando(false);
    }
  }, [analisis, servicioId, necesitaAclaracion, descripcionFinal, descripcionOriginal, contextoActual, precioFinal, fijo, emergencia, tienePlazo, fechaLimite, usuario, navigation]);

  const servicioElegido = analisis?.servicios?.find((s) => s.id === servicioId);

  return (
    <SafeAreaView style={styles.flex1} edges={["top"]}>
      {/* Header compartido de la app (dirección, ajustes, logo → home) */}
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
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Ej: el grifo de mi cocina pierde agua desde ayer..."
              placeholderTextColor={COLORS.inkFaint}
              value={descripcionOriginal}
              onChangeText={(t) => {
                setDescripcionOriginal(t);
                invalidarAnalisisPrevio();
              }}
              editable={!analizando}
            />

            {/* 👇 Emergencia: se elige ACÁ, antes de mandarle nada a la IA */}
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

            {!descripcionValida && descripcionOriginal.length > 0 && (
              <Text style={styles.errorText}>Contá un poco más (mínimo 10 caracteres).</Text>
            )}
            {errorIA && <Text style={styles.errorText}>{errorIA}</Text>}
          </View>

          {/* ── Bloque de aclaración (puede traer varias preguntas juntas) ── */}
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

          {/* ── Resultado del análisis (solo si NO necesita aclaración) ── */}
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
                {/* Fondo: tocar afuera de la lista la cierra. Al estar en un
                    Modal, esta lista queda FUERA del ScrollView de la pantalla,
                    así que su scroll no compite con el de la pantalla. */}
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

          {/* Botón enviar — deshabilitado mientras necesite aclaración */}
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

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, paddingBottom: 180 },

  /* ── Banner de la pantalla (debajo del Header fijo de la app) ── */
  banner: {
    backgroundColor: COLORS.primaryDark,
    marginHorizontal: 16, marginTop: 16,
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 24,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...shadow(COLORS.primaryDark, 0.3, 16, 8),
  },
  bannerGlowTop: {
    position: "absolute", top: -50, right: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: COLORS.primary, opacity: 0.45,
  },
  bannerGlowBottom: {
    position: "absolute", bottom: -60, left: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: "#0A2F73", opacity: 0.6,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11, fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 4,
  },
  tagline: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 8, marginBottom: 8, maxWidth: "80%", letterSpacing: -0.3 },
  subtitle: { color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 20, maxWidth: "90%" },

  /* ── Tarjetas ── */
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16, marginTop: 20,
    borderRadius: RADIUS.xl, padding: 22,
    borderWidth: 1, borderColor: COLORS.border,
    ...shadow(COLORS.ink, 0.06, 14, 6),
  },

  /* Aviso de emergencia (reemplaza al selector de plazo cuando está activo) */
  emergenciaAviso: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1, borderColor: "rgba(192,57,43,0.35)",
    borderRadius: RADIUS.md, padding: 14, gap: 10,
  },
  emergenciaAvisoIcon: { marginTop: 1 },
  emergenciaAvisoText: { flex: 1, fontSize: 13, color: COLORS.danger, lineHeight: 18, fontWeight: "600" },

  /* Bloque de aclaración */
  aclaracionBox: {
    marginHorizontal: 16, marginTop: 20,
    borderRadius: RADIUS.xl, padding: 22,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: "rgba(217,130,43,0.35)",
    ...shadow("#B45309", 0.08, 12, 5),
  },
  aclaracionIconRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  aclaracionIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
  },
  aclaracionTitulo: { fontSize: 15, fontWeight: "800", color: COLORS.accent, flexShrink: 1 },

  /* Cada pregunta individual dentro de la tanda */
  preguntaItem: { marginBottom: 18 },
  preguntaTexto: { fontSize: 14, color: COLORS.ink, lineHeight: 20, marginBottom: 10, fontWeight: "700" },

  /* Chips de respuesta rápida */
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  chipActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipOtro: { borderColor: COLORS.borderStrong },
  chipIcon: { marginRight: 6 },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  chipTextActivo: { color: "#fff" },

  otroInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: "rgba(217,130,43,0.5)",
    borderRadius: RADIUS.sm, padding: 12,
    fontSize: 14, color: COLORS.ink,
    marginTop: 10,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  sectionTitle: { color: COLORS.primary, fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },

  label: { fontSize: 14, fontWeight: "700", color: COLORS.ink, marginTop: 18, marginBottom: 6 },
  helperText: { fontSize: 13, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 18 },

  textArea: {
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.ink,
    minHeight: 96, textAlignVertical: "top",
  },

  /* Selector de fecha/hora del plazo */
  plazoRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  plazoBox: {
    flex: 1, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12,
  },
  plazoBoxLabel: { fontSize: 11, color: COLORS.inkSoft, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  plazoBoxValue: { fontSize: 15, color: COLORS.ink, fontWeight: "700", marginTop: 4 },
  plazoResumen: { fontSize: 14, color: COLORS.ink, fontWeight: "600" },

  /* Botones de IA */
  aiButton: {
    marginTop: 18, backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.md,
    flexDirection: "row", paddingVertical: 15, alignItems: "center", justifyContent: "center",
    ...shadow(COLORS.primaryDark, 0.28, 10, 5),
  },
  aiButtonWarn: { backgroundColor: COLORS.accent, ...shadow(COLORS.accent, 0.28, 10, 5) },
  aiButtonIcon: { marginRight: 8 },
  aiButtonDisabled: { backgroundColor: "#B9C4DA", shadowOpacity: 0, elevation: 0 },
  aiButtonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },

  errorText: { color: COLORS.danger, fontSize: 13, marginTop: 8, fontWeight: "600" },
  errorTextOutside: { marginHorizontal: 16, marginTop: 16 },

  resultBadgeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  resultBadge: {
    flexDirection: "row", alignItems: "center",
    alignSelf: "flex-start", backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 5,
  },
  resultBadgeIcon: { marginRight: 5 },
  resultBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  emergenciaBadge: {
    flexDirection: "row", alignItems: "center",
    alignSelf: "flex-start", backgroundColor: COLORS.danger,
    borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 5,
  },
  emergenciaBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  selectBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 14,
  },
  selectText: { fontSize: 15, color: COLORS.ink, fontWeight: "700" },

  /* Modal del selector de servicio: al vivir en un Modal (fuera del
     ScrollView de la pantalla), su scroll interno no compite con el de
     afuera, y el usuario puede bajar la lista sin que se mueva la pantalla. */
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    maxHeight: "72%",
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    ...shadow(COLORS.ink, 0.2, 20, -6),
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitulo: { fontSize: 16, fontWeight: "800", color: COLORS.ink },
  modalCerrarBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center", justifyContent: "center",
  },
  modalScroll: { paddingHorizontal: 4 },

  dropdownItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dropdownItemActivo: { backgroundColor: COLORS.primarySoft },
  dropdownItemTextWrap: { flexShrink: 1, paddingRight: 12 },
  dropdownItemCategoria: { fontSize: 11, color: COLORS.inkFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  dropdownItemText: { fontSize: 14, color: COLORS.ink, fontWeight: "600" },
  dropdownItemTextActivo: { color: COLORS.primary, fontWeight: "800" },

  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 20 },

  segmentedTrack: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 42, overflow: "hidden" },
  segmentedRelative: { flexDirection: "row", width: "100%", height: "100%", position: "relative" },
  segmentedBubble: {
    position: "absolute", top: 3, bottom: 3, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    ...shadow(COLORS.primary, 0.3, 6, 2),
  },
  segmentedButton: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 2 },
  segmentedText: { fontSize: 13, fontWeight: "700", color: COLORS.inkSoft },
  segmentedTextActive: { color: "#fff" },

  priceRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  priceCurrency: { fontSize: 17, color: COLORS.inkSoft, marginRight: 4, fontWeight: "700" },
  priceInput: { flex: 1, paddingVertical: 12, fontSize: 17, fontWeight: "800", color: COLORS.ink },
  priceRange: { fontSize: 12, color: COLORS.inkSoft, marginTop: 6 },
  priceNote: { fontSize: 12, color: COLORS.accent, marginTop: 4, lineHeight: 16, fontWeight: "600" },

  submitButton: {
    marginTop: 28, marginHorizontal: 16, backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.md, paddingVertical: 17, alignItems: "center",
    ...shadow(COLORS.primaryDark, 0.3, 12, 6),
  },
  submitButtonDisabled: { backgroundColor: "#AEBBD6", shadowOpacity: 0, elevation: 0 },
  submitButtonText: { color: "#fff", fontWeight: "800", fontSize: 15.5, letterSpacing: 0.2 },
});