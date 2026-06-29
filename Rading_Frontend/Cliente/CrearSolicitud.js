// Cliente/CrearSolicitud.js
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, StyleSheet, Platform, Animated, KeyboardAvoidingView,
} from "react-native";

const API_BASE_URL = "http://localhost:3000";
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
  warnBg: "#FFF8EC",
  error: "#C0392B",
  errorBg: "#FDF0EF",
};

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

/* ── Bloque de aclaración ────────────────────────────────────────────── */
function AclaracionBox({ pregunta, valor, onChange, onReanalizar, analizando }) {
  return (
    <View style={styles.aclaracionBox}>
      <View style={styles.aclaracionIconRow}>
        <Text style={styles.aclaracionIcon}>🤔</Text>
        <Text style={styles.aclaracionTitulo}>Necesitamos un poco más de info</Text>
      </View>
      <Text style={styles.aclaracionPregunta}>{pregunta}</Text>
      <TextInput
        style={styles.aclaracionInput}
        placeholder="Escribí tu respuesta acá..."
        placeholderTextColor={COLORS.inkSoft}
        value={valor}
        onChangeText={onChange}
        multiline
      />
      <Pressable
        style={[styles.aiButton, (!valor.trim() || analizando) && styles.aiButtonDisabled]}
        onPress={onReanalizar}
        disabled={!valor.trim() || analizando}
      >
        {analizando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.aiButtonText}>✨ Reanalizar con esta info</Text>
        }
      </Pressable>
    </View>
  );
}

/* ── Pantalla principal ──────────────────────────────────────────────── */
export default function CrearSolicitud({ navigation }) {
  const [descripcionOriginal, setDescripcionOriginal] = useState("");
  const [aclaracion, setAclaracion]                   = useState("");

  const [analizando,  setAnalizando]  = useState(false);
  const [errorIA,     setErrorIA]     = useState(null);
  const [analisis,    setAnalisis]    = useState(null);

  const [descripcionFinal, setDescripcionFinal] = useState("");
  const [servicioId,       setServicioId]       = useState(null);
  const [precioFinal,      setPrecioFinal]      = useState("");
  const [fijo,             setFijo]             = useState(true);
  const [emergencia,       setEmergencia]       = useState(false);
  const [selectorAbierto,  setSelectorAbierto]  = useState(false);

  const [enviando,    setEnviando]    = useState(false);
  const [errorEnvio,  setErrorEnvio]  = useState(null);

  const descripcionValida = descripcionOriginal.trim().length >= 10;
  // Solo depende de lo que dijo la IA, no del servicioId
  const necesitaAclaracion = analisis !== null && analisis?.necesitaAclaracion === true && !analisis?.servicioId;

  // Llama a /analizar concatenando la aclaración si existe
  const analizarConIA = useCallback(async (descripcionExtra = "") => {
    if (!descripcionValida) return;
    setAnalizando(true);
    setErrorIA(null);

    const textoFinal = descripcionExtra
      ? `${descripcionOriginal.trim()} — Aclaración: ${descripcionExtra.trim()}`
      : descripcionOriginal.trim();

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
      setAclaracion("");         // limpia el campo de aclaración
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
    if (!analisis || !servicioId || necesitaAclaracion) return;
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
      if (!resp.ok || !json.ok) throw new Error(json.message || "No se pudo crear la solicitud");

      navigation?.goBack?.();
    } catch (err) {
      setErrorEnvio(err.message || "Ocurrió un error al enviar la solicitud");
    } finally {
      setEnviando(false);
    }
  }, [analisis, servicioId, necesitaAclaracion, descripcionFinal, descripcionOriginal, precioFinal, fijo, emergencia, navigation]);

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
              if (analisis) { setAnalisis(null); setAclaracion(""); }
            }}
            editable={!analizando}
          />

          <Pressable
            style={[styles.aiButton, (!descripcionValida || analizando) && styles.aiButtonDisabled]}
            onPress={() => analizarConIA()}
            disabled={!descripcionValida || analizando}
          >
            {analizando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.aiButtonText}>{analisis ? "Volver a analizar" : "✨ Analizar con IA"}</Text>
            }
          </Pressable>

          {!descripcionValida && descripcionOriginal.length > 0 && (
            <Text style={styles.errorText}>Contá un poco más (mínimo 10 caracteres).</Text>
          )}
          {errorIA && <Text style={styles.errorText}>{errorIA}</Text>}
        </View>

        {/* ── Bloque de aclaración (se muestra cuando la IA pide más info) ── */}
        {analisis && necesitaAclaracion && (
          <AclaracionBox
            pregunta={analisis.preguntaAclaracion || "¿Podés darnos más detalles?"}
            valor={aclaracion}
            onChange={setAclaracion}
            onReanalizar={() => analizarConIA(aclaracion)}
            analizando={analizando}
          />
        )}

        {/* ── Resultado del análisis (solo si NO necesita aclaración) ── */}
        {analisis && !necesitaAclaracion && (
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
                    onPress={() => { setServicioId(s.id); setSelectorAbierto(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{s.categoria} · {s.nombre}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.label}>¿Es una emergencia?</Text>
            <SegmentedToggle
              options={["No", "Sí"]}
              selectedIndex={emergencia ? 1 : 0}
              onChange={(i) => setEmergencia(i === 1)}
            />

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
                  ? "Respondé la pregunta primero"
                  : "Enviar solicitud"}
              </Text>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: COLORS.bg },
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
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  closeBtnText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  tagline: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 6, marginBottom: 6, maxWidth: "85%" },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 19, maxWidth: "90%" },

  card: {
    backgroundColor: COLORS.cardSoft,
    marginHorizontal: 16, marginTop: 20,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },

  // Bloque de aclaración
  aclaracionBox: {
    marginHorizontal: 16, marginTop: 20,
    borderRadius: 24, padding: 24,
    backgroundColor: COLORS.warnBg,
    borderWidth: 1.5, borderColor: "#F5A623",
  },
  aclaracionIconRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  aclaracionIcon: { fontSize: 22 },
  aclaracionTitulo: { fontSize: 15, fontWeight: "700", color: COLORS.warn },
  aclaracionPregunta: { fontSize: 14, color: COLORS.ink, lineHeight: 20, marginBottom: 14 },
  aclaracionInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: "#F5A623",
    borderRadius: 14, padding: 14,
    fontSize: 14, color: COLORS.ink,
    minHeight: 80, textAlignVertical: "top",
    marginBottom: 14,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 },
  sectionTitle: { color: COLORS.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },

  label: { fontSize: 14, fontWeight: "700", color: COLORS.ink, marginTop: 18, marginBottom: 6 },
  helperText: { fontSize: 13, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 18 },

  textArea: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.ink,
    minHeight: 96, textAlignVertical: "top",
  },

  aiButton: {
    marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: "center", justifyContent: "center",
  },
  aiButtonDisabled: { backgroundColor: "#9DBBE8" },
  aiButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  errorText: { color: COLORS.error, fontSize: 13, marginTop: 8 },
  errorTextOutside: { marginHorizontal: 16, marginTop: 16 },

  resultBadge: {
    alignSelf: "flex-start", backgroundColor: COLORS.primaryDark,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  resultBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  selectBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  selectText: { fontSize: 15, color: COLORS.ink, fontWeight: "600" },
  chevron: { color: COLORS.inkSoft, fontSize: 12 },
  dropdown: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, marginTop: 6, overflow: "hidden", maxHeight: 240,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemText: { fontSize: 14, color: COLORS.ink },

  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)", marginTop: 18 },

  segmentedTrack: { backgroundColor: COLORS.track, borderRadius: 12, height: 40, overflow: "hidden" },
  segmentedRelative: { flexDirection: "row", width: "100%", height: "100%", position: "relative" },
  segmentedBubble: { position: "absolute", top: 0, bottom: 0, backgroundColor: COLORS.primary, borderRadius: 12 },
  segmentedButton: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 2 },
  segmentedText: { fontSize: 13, fontWeight: "700", color: COLORS.inkSoft },
  segmentedTextActive: { color: "#fff" },

  priceRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14,
  },
  priceCurrency: { fontSize: 16, color: COLORS.inkSoft, marginRight: 4 },
  priceInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "700", color: COLORS.ink },
  priceRange: { fontSize: 12, color: COLORS.inkSoft, marginTop: 6 },
  priceNote: { fontSize: 12, color: COLORS.warn, marginTop: 4, lineHeight: 16 },

  submitButton: {
    marginTop: 28, marginHorizontal: 16, backgroundColor: COLORS.primaryDark,
    borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: "#A9BEDC" },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});