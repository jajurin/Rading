// Cliente/CrearSolicitud.js
//
// Pantalla de creación de solicitud con asistencia de IA.
//
// Flujo en dos pasos:
//  1) El usuario escribe la descripción en sus palabras y toca "Analizar
//     con IA". Eso llama a POST /solicitud/analizar, que devuelve una
//     descripción mejorada, el servicio sugerido (de tu tabla real
//     "Servicio") y un precio estimado con rango.
//  2) Todo eso se muestra editable. El usuario ajusta lo que quiera y toca
//     "Enviar solicitud", que llama a POST /solicitud/confirmar y ahí sí
//     se crea la fila en "Cliente-Trabajador".
//
// IMPORTANTE: cambiá API_BASE_URL por la URL real donde corre tu backend.
// Mientras desarrollás en el celular/emulador, "localhost" no funciona
// directo — usá la IP de tu máquina en la red local (ej 192.168.0.x) o
// un túnel como ngrok.
//
// DISEÑO: paleta y lenguaje visual tomados de RegistrarseCliente.js
// (header azul #1565D8, tarjetas redondeadas sobre fondo gris claro,
// section header con punto + título en mayúsculas, selector tipo
// "pastilla" animada para las opciones de Sí/No y Fijo/Subasta).
//
// SCROLL: el ScrollView usa `flex: 1` + `contentContainerStyle` con
// `flexGrow: 1` (en vez de `flex: 1` en el contentContainerStyle, que es
// lo que suele "trabar" el scroll cuando el contenido es más alto que la
// pantalla). El botón final queda con paddingBottom generoso para que no
// quede pegado al borde ni tapado por el teclado.

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from "react-native";

const API_BASE_URL = "http://localhost:3000"; // <-- cambiar esto

// TODO: reemplazar por el id del cliente logueado real (lo que tengas
// guardado tras el Login, ej en context, AsyncStorage o redux).
const ID_CLIENTE_TEMPORAL = 1;

const COLORS = {
  bg: "#F0F0F0",
  card: "#FFFFFF",
  cardSoft: "#b4b7bc63",
  cardBorder: "rgba(0,0,0,0.05)",
  ink: "#1A202C",
  inkSoft: "#4A5568",
  primary: "#1565D8",
  primaryDark: "#0E3F8E",
  track: "rgba(0,0,0,0.06)",
  border: "rgba(0,0,0,0.08)",
  warn: "#B5780B",
  error: "#C0392B",
};

/* -------------------------------------------------------------------- */
/* Selector tipo "pastilla" animada — mismo lenguaje visual que los      */
/* tabs de categoría en RegistrarseCliente.js, reutilizado para          */
/* preguntas de dos opciones (Sí/No, Precio fijo/Subasta).               */
/* -------------------------------------------------------------------- */
function SegmentedToggle({ options, selectedIndex, onChange }) {
  const anim = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: selectedIndex,
      useNativeDriver: false,
      bounciness: 0,
    }).start();
  }, [selectedIndex, anim]);

  const left = anim.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => `${(i * 100) / options.length}%`),
  });

  return (
    <View style={styles.segmentedTrack}>
      <View style={styles.segmentedRelative}>
        <Animated.View
          style={[styles.segmentedBubble, { width: `${100 / options.length}%`, left }]}
        />
        {options.map((opt, i) => (
          <Pressable
            key={opt}
            style={styles.segmentedButton}
            onPress={() => onChange(i)}
            hitSlop={6}
          >
            <Text style={[styles.segmentedText, selectedIndex === i && styles.segmentedTextActive]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* Encabezado de sección: punto + título en mayúsculas, igual que en
   RegistrarseCliente.js ("Preferencias"). */
function SectionHeader({ label }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

export default function CrearSolicitud({ navigation }) {
  // --- Paso 1: input del usuario ---
  const [descripcionOriginal, setDescripcionOriginal] = useState("");

  // --- Estado de la llamada a IA ---
  const [analizando, setAnalizando] = useState(false);
  const [errorIA, setErrorIA] = useState(null);
  const [analisis, setAnalisis] = useState(null); // respuesta cruda de /analizar

  // --- Paso 2: campos editables post-análisis ---
  const [descripcionFinal, setDescripcionFinal] = useState("");
  const [servicioId, setServicioId] = useState(null);
  const [precioFinal, setPrecioFinal] = useState("");
  const [fijo, setFijo] = useState(true); // true = precio fijo, false = subasta
  const [emergencia, setEmergencia] = useState(false);
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  // --- Estado del envío final ---
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  const descripcionValida = descripcionOriginal.trim().length >= 10;

  const analizarConIA = useCallback(async () => {
    if (!descripcionValida) return;
    setAnalizando(true);
    setErrorIA(null);

    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcionOriginal }),
      });

      const json = await resp.json();

      if (!resp.ok || !json.ok) {
        throw new Error(json.message || "No se pudo analizar la solicitud");
      }

      const data = json.data;
      setAnalisis(data);
      setDescripcionFinal(data.descripcionMejorada);
      setServicioId(data.servicioId);
      setPrecioFinal(String(data.precioSugerido));
      setEmergencia(!!data.emergencia);
    } catch (err) {
      setErrorIA(err.message || "Ocurrió un error analizando tu solicitud");
    } finally {
      setAnalizando(false);
    }
  }, [descripcionOriginal, descripcionValida]);

  const enviarSolicitud = useCallback(async () => {
    if (!analisis || !servicioId) return;
    setEnviando(true);
    setErrorEnvio(null);

    try {
      const resp = await fetch(`${API_BASE_URL}/solicitud/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente: ID_CLIENTE_TEMPORAL,
          servicioId,
          descripcion: descripcionFinal,
          descripcionOriginal,
          precio: Number(precioFinal),
          fijo,
          emergencia,
        }),
      });

      const json = await resp.json();

      if (!resp.ok || !json.ok) {
        throw new Error(json.message || "No se pudo crear la solicitud");
      }

      // Solicitud creada — volvemos a la pantalla anterior.
      navigation?.goBack?.();
    } catch (err) {
      setErrorEnvio(err.message || "Ocurrió un error al enviar la solicitud");
    } finally {
      setEnviando(false);
    }
  }, [analisis, servicioId, descripcionFinal, descripcionOriginal, precioFinal, fijo, emergencia, navigation]);

  const servicioElegido = analisis?.servicios?.find((s) => s.id === servicioId);

  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          <Text style={styles.tagline}>Contanos qué necesitás</Text>
          <Text style={styles.subtitle}>La IA te ayuda a redactar el pedido y a estimar un precio</Text>
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
            placeholderTextColor={COLORS.inkSoft}
            value={descripcionOriginal}
            onChangeText={(t) => {
              setDescripcionOriginal(t);
              if (analisis) setAnalisis(null); // invalida el análisis previo si edita
            }}
            editable={!analizando}
          />

          <Pressable
            style={[styles.aiButton, (!descripcionValida || analizando) && styles.aiButtonDisabled]}
            onPress={analizarConIA}
            disabled={!descripcionValida || analizando}
          >
            {analizando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.aiButtonText}>{analisis ? "Volver a analizar" : "✨ Analizar con IA"}</Text>
            )}
          </Pressable>

          {!descripcionValida && descripcionOriginal.length > 0 && (
            <Text style={styles.errorText}>Contá un poco más para poder analizarlo (mínimo 10 caracteres).</Text>
          )}
          {errorIA && <Text style={styles.errorText}>{errorIA}</Text>}
        </View>

        {/* --- Paso 2: resultado del análisis, todo editable --- */}
        {analisis && (
          <View style={styles.card}>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>Sugerido por IA · editable</Text>
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
              <Text style={styles.chevron}>{selectorAbierto ? "▲" : "▼"}</Text>
            </Pressable>

            {selectorAbierto && (
              <View style={styles.dropdown}>
                {analisis.servicios?.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setServicioId(s.id);
                      setSelectorAbierto(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {s.categoria} · {s.nombre}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            {/* Emergencia */}
            <Text style={styles.label}>¿Es una emergencia?</Text>
            <SegmentedToggle
              options={["No", "Sí"]}
              selectedIndex={emergencia ? 1 : 0}
              onChange={(i) => setEmergencia(i === 1)}
            />

            {/* Modalidad: fijo o subasta */}
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
              Rango estimado: ${analisis.precioMin?.toLocaleString("es-AR")} – $
              {analisis.precioMax?.toLocaleString("es-AR")}
            </Text>
            <Text style={styles.priceNote}>{analisis.notas} Es una estimación, puede no ser exacta.</Text>
          </View>
        )}

        {errorEnvio && <Text style={[styles.errorText, styles.errorTextOutside]}>{errorEnvio}</Text>}

        <Pressable
          style={[styles.submitButton, (!analisis || !servicioId || enviando) && styles.submitButtonDisabled]}
          disabled={!analisis || !servicioId || enviando}
          onPress={enviarSolicitud}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {analisis ? "Enviar solicitud" : "Analizá la descripción primero"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: COLORS.bg },

  // flexGrow (no flex) en el contentContainer es lo que permite que el
  // contenido crezca más alto que la pantalla y siga siendo scrolleable.
  scrollContent: { flexGrow: 1, paddingBottom: 56 },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingBottom: 32,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 42,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  closeBtnText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  tagline: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 6, marginBottom: 6, maxWidth: "85%" },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 19, maxWidth: "90%" },

  card: {
    backgroundColor: COLORS.cardSoft,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  sectionTitle: { color: COLORS.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },

  label: { fontSize: 14, fontWeight: "700", color: COLORS.ink, marginTop: 18, marginBottom: 6 },
  helperText: { fontSize: 13, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 18 },

  textArea: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: COLORS.ink,
    minHeight: 96,
    textAlignVertical: "top",
  },

  aiButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  aiButtonDisabled: { backgroundColor: "#9DBBE8" },
  aiButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  errorText: { color: COLORS.error, fontSize: 13, marginTop: 8 },
  errorTextOutside: { marginHorizontal: 16, marginTop: 16 },

  resultBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryDark,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  resultBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: { fontSize: 15, color: COLORS.ink, fontWeight: "600" },
  chevron: { color: COLORS.inkSoft, fontSize: 12 },
  dropdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginTop: 6,
    overflow: "hidden",
    maxHeight: 240,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemText: { fontSize: 14, color: COLORS.ink },

  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)", marginTop: 18 },

  // Selector tipo "pastilla" animada
  segmentedTrack: { backgroundColor: COLORS.track, borderRadius: 12, height: 40, overflow: "hidden" },
  segmentedRelative: { flexDirection: "row", width: "100%", height: "100%", position: "relative" },
  segmentedBubble: { position: "absolute", top: 0, bottom: 0, backgroundColor: COLORS.primary, borderRadius: 12 },
  segmentedButton: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 2 },
  segmentedText: { fontSize: 13, fontWeight: "700", color: COLORS.inkSoft },
  segmentedTextActive: { color: "#fff" },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  priceCurrency: { fontSize: 16, color: COLORS.inkSoft, marginRight: 4 },
  priceInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "700", color: COLORS.ink },
  priceRange: { fontSize: 12, color: COLORS.inkSoft, marginTop: 6 },
  priceNote: { fontSize: 12, color: COLORS.warn, marginTop: 4, lineHeight: 16 },

  submitButton: {
    marginTop: 28,
    marginHorizontal: 16,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: "#A9BEDC" },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});