import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle } from "react-native-svg";
import API_URL from "../configS";
import Header from "../Header";
import BottomNavBar from "./NavegadorCliente";

// ── Paleta (misma que CalificarClienteTrabajador) ───────────────────────
const NAVY = "#0F1B4C";
const INDIGO = "#2A3FD6";
const AMBER = "#F5A623";
const GREEN = "#22C55E";
const RED = "#EF4444";
const BG = "#F4F6FC";
const CARD = "#FFFFFF";
const TEXT_DARK = "#12172E";
const TEXT_MUTED = "#828AA0";
const BORDER = "rgba(15,27,76,0.07)";
const WHITE = "#FFFFFF";

// ── Datos de razones / motivos ───────────────────────────────────────────
const REASONS = [
  { label: "Selecciona una razón...", value: "" },
  { label: "Excelente trabajo", value: "excellent" },
  { label: "Buen trabajo", value: "good" },
  { label: "Trabajo aceptable", value: "acceptable" },
  { label: "Necesita mejorar", value: "needs_improvement" },
  { label: "Trabajo deficiente", value: "poor" },
];

const REPORT_REASONS = [
  { label: "Selecciona un motivo...", value: "" },
  { label: "Comportamiento inapropiado", value: "comportamiento_inapropiado" },
  { label: "Lenguaje ofensivo o discriminatorio", value: "lenguaje_ofensivo" },
  { label: "No se presentó al trabajo", value: "no_se_presento" },
  { label: "Intentó cobrar fuera de la app", value: "cobro_fuera_app" },
  { label: "Daño a la propiedad", value: "dano_propiedad" },
  { label: "Conducta insegura o de riesgo", value: "conducta_insegura" },
  { label: "Otro", value: "otro" },
];

const RATING_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

const iniciales = (nombreCompleto = "") => {
  const partes = nombreCompleto.split(" ").filter(Boolean);
  const a = partes[0]?.charAt(0) || "";
  const b = partes[1]?.charAt(0) || "";
  return (a + b).toUpperCase() || "?";
};

// ── Iconos propios (mismo estilo SVG que el banner de cliente) ──────────
const Icons = {
  Check: ({ color = "#FFFFFF", size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5L10 17.5L19 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  Back: ({ color = "#FFFFFF", size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5L8 12L15 19"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  Flag: ({ color = RED, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3V21M6 4H17L14.5 8L17 12H6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
};

// ── Selector grande de estrellas (calificación general) ─────────────────
function EstrellasGrandes({ value, onChange }) {
  return (
    <View style={styles.estrellasGrandesRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={40}
            color={n <= value ? AMBER : "rgba(15,27,76,0.16)"}
            style={{ marginHorizontal: 3 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Dropdown genérico reutilizable (razón y motivo de reporte) ──────────
function OptionPicker({ value, onChange, options = REASONS, title = "Razón de la calificación" }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((r) => r.value === value) || options[0];

  return (
    <>
      <TouchableOpacity style={styles.pickerTrigger} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={[styles.pickerText, !value && { color: TEXT_MUTED }]}>{selected.label}</Text>
        <Ionicons name="chevron-down" size={16} color={INDIGO} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.pickerDropdown}>
            <Text style={styles.pickerDropdownTitle}>{title}</Text>
            {options
              .filter((r) => r.value !== "")
              .map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.pickerOption, value === r.value && styles.pickerOptionActive]}
                  onPress={() => {
                    onChange(r.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, value === r.value && styles.pickerOptionTextActive]}>
                    {r.label}
                  </Text>
                  {value === r.value && <Icons.Check color={INDIGO} size={16} />}
                </TouchableOpacity>
              ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Modal: comentario obligatorio cuando la calificación es baja ────────
function LowReviewModal({ visible, onClose, onSubmit }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert("Campo requerido", "Por favor contanos qué pasó antes de enviar.");
      return;
    }
    onSubmit(text);
    setText("");
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>¿Qué pasó?</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Tu opinión nos ayuda a mejorar la calidad del servicio.</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Contanos tu experiencia con detalle..."
            placeholderTextColor={TEXT_MUTED}
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          <TouchableOpacity activeOpacity={0.88} onPress={handleSubmit}>
            <LinearGradient
              colors={[INDIGO, "#1E2E9E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enviarBtn}
            >
              <Text style={styles.enviarBtnText}>Enviar comentario</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Modal de reporte: motivo + descripción, independiente de la calificación ──
function ReportModal({ visible, onClose, reason, onReasonChange, description, onDescriptionChange, onSubmit, enviando }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reportar trabajador</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            Contanos qué pasó. Nuestro equipo va a revisar el reporte, esto no reemplaza tu calificación.
          </Text>

          <Text style={styles.fieldLabel}>Motivo</Text>
          <OptionPicker value={reason} onChange={onReasonChange} options={REPORT_REASONS} title="Motivo del reporte" />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Descripción</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Describí lo que pasó con el mayor detalle posible..."
            placeholderTextColor={TEXT_MUTED}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={onDescriptionChange}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.contadorChars}>{description.length}/500</Text>

          <TouchableOpacity activeOpacity={enviando ? 1 : 0.88} onPress={onSubmit} disabled={enviando}>
            <View style={[styles.enviarBtn, { backgroundColor: RED }]}>
              {enviando ? <ActivityIndicator color={WHITE} /> : <Text style={styles.enviarBtnText}>Enviar reporte</Text>}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ClasificarTrabajador({ route, navigation }) {
  const { trabajo, usuario } = route?.params || {};

  const nombreCompleto = trabajo ? `${trabajo.nombre ?? ""} ${trabajo.apellido ?? ""}`.trim() : "";
  const servicioNombre = trabajo?.servicio_nombre ?? "";
  const fotoTrabajador = trabajo?.foto ?? null;

  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [block, setBlock] = useState(false);
  const [showLowModal, setShowLowModal] = useState(false);
  const [lowReviewText, setLowReviewText] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const handleRate = (val) => {
    setRating(val);
    if (val <= 2) setShowLowModal(true);
  };

  const handleLowSubmit = (text) => {
    setLowReviewText(text);
    setShowLowModal(false);
  };

  const handleSend = async () => {
    if (!rating) {
      Alert.alert("Calificación requerida", "Por favor selecciona una calificación con estrellas.");
      return;
    }
    if (!reason) {
      Alert.alert("Razón requerida", "Por favor selecciona una razón para tu calificación.");
      return;
    }
    if (!trabajo?.idTrabajador || !trabajo?.idTrabajo || !usuario?.idCliente) {
      Alert.alert("Error", "Faltan datos del trabajo o del usuario para enviar la calificación.");
      return;
    }

    const payload = {
      idTrabajador: trabajo.idTrabajador,
      idCliente: usuario.idCliente,
      idTrabajo: trabajo.idTrabajo,
      estrellas: rating,
      razon: reason,
      descripcion: description,
      comentarioBajaCalificacion: rating <= 2 ? lowReviewText : null,
      bloqueoSolicitado: block,
    };

    try {
      setEnviando(true);

      const res = await fetch(`${API_URL}/cliente/resenia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? `Error ${res.status} al enviar la reseña`);
      }

      Alert.alert("¡Gracias!", "Tu calificación fue enviada correctamente.", [
        { text: "OK", onPress: () => navigation?.goBack() },
      ]);
    } catch (err) {
      console.error("Error al enviar reseña:", err);
      Alert.alert("Error", err.message ?? "No se pudo enviar la calificación. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      Alert.alert("Motivo requerido", "Por favor selecciona un motivo para el reporte.");
      return;
    }
    if (!reportDescription.trim()) {
      Alert.alert("Descripción requerida", "Contanos qué pasó para poder revisar el reporte.");
      return;
    }
    if (!trabajo?.idTrabajador || !usuario?.idCliente) {
      Alert.alert("Error", "Faltan datos para enviar el reporte.");
      return;
    }

    const payload = {
      idTrabajador: trabajo.idTrabajador,
      idCliente: usuario.idCliente,
      idTrabajo: trabajo.idTrabajo ?? null,
      motivo: reportReason,
      descripcion: reportDescription.trim(),
    };

    try {
      setEnviandoReporte(true);

      const res = await fetch(`${API_URL}/cliente/reportarTrabajador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? `Error ${res.status} al enviar el reporte`);
      }

      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
      Alert.alert("Reporte enviado", "Gracias por avisarnos, nuestro equipo lo va a revisar a la brevedad.");
    } catch (err) {
      console.error("Error al enviar reporte:", err);
      Alert.alert("Error", err.message ?? "No se pudo enviar el reporte. Intentá de nuevo.");
    } finally {
      setEnviandoReporte(false);
    }
  };

  const puedeEnviar = rating > 0;

  return (
    <>
      <Header usuario={usuario} />
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Banner del trabajador (mismo lenguaje que el banner de cliente) ── */}
        <LinearGradient
          colors={[INDIGO, "#1E2E9E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerGlowTop} />
          <View style={styles.bannerGlowBottom} />

          <View style={styles.bannerTopRow}>
            <View style={styles.bannerTag}>
              <Ionicons name="checkmark-done" size={12} color="#fff" />
              <Text style={styles.bannerTagText}>TRABAJO FINALIZADO</Text>
            </View>

            <TouchableOpacity
              style={styles.reportBadge}
              onPress={() => setShowReportModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.85}
            >
              <Icons.Flag color="#fff" size={12} />
              <Text style={styles.reportBadgeText}>Reportar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bannerClienteRow}>
            <View style={styles.bannerAvatarWrap}>
              {fotoTrabajador ? (
                <Image source={{ uri: fotoTrabajador }} style={styles.bannerAvatar} />
              ) : (
                <View style={styles.bannerAvatarFallback}>
                  <Text style={styles.bannerAvatarFallbackText}>{iniciales(nombreCompleto)}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={styles.bannerClienteNombre} numberOfLines={1}>
                {nombreCompleto || "Trabajador"}
              </Text>
              <Text style={styles.bannerServicio} numberOfLines={1}>
                {servicioNombre || "Servicio"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Calificación general ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cómo lo calificás?</Text>
          <Text style={styles.cardSubtitle}>Tu opinión ayuda a otros clientes</Text>

          <EstrellasGrandes value={rating} onChange={handleRate} />

          <Text style={styles.estrellasLabel}>
            {rating > 0 ? RATING_LABELS[rating] : "Tocá una estrella para calificar"}
          </Text>
        </View>

        {/* ── Razón ───────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Razón</Text>
          <Text style={styles.cardSubtitle}>Elegí lo que mejor describe el trabajo</Text>
          <View style={{ marginTop: 14 }}>
            <OptionPicker value={reason} onChange={setReason} options={REASONS} title="Razón de la calificación" />
          </View>
        </View>

        {/* ── Comentario ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dejá un comentario</Text>
          <Text style={styles.cardSubtitle}>Opcional · lo verán otros clientes</Text>

          <TextInput
            style={styles.comentarioInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Contanos tu experiencia..."
            placeholderTextColor={TEXT_MUTED}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.contadorChars}>{description.length}/300</Text>
        </View>

        {/* ── Bloquear ────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.blockRow} onPress={() => setBlock(!block)} activeOpacity={0.85}>
            <View style={[styles.checkbox, block && styles.checkboxChecked]}>
              {block && <Icons.Check color={WHITE} size={13} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.blockLabel, block && styles.blockLabelActive]}>Bloquear usuario</Text>
              <Text style={styles.blockSub}>No volverá a aparecer en tus búsquedas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportLink}
            onPress={() => setShowReportModal(true)}
            activeOpacity={0.8}
          >
            <Icons.Flag color="#EF4444" size={13} />
            <Text style={styles.reportLinkText}>Reportar a este trabajador</Text>
          </TouchableOpacity>
        </View>

        {/* ── Botones finales ─────────────────────────────────────────── */}
        <View style={styles.footerBtns}>
          <TouchableOpacity style={styles.omitirBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.8}>
            <Text style={styles.omitirBtnText}>Omitir por ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={puedeEnviar ? 0.88 : 1} onPress={handleSend} disabled={!puedeEnviar || enviando}>
            <LinearGradient
              colors={puedeEnviar ? [INDIGO, "#1E2E9E"] : ["#C7CCE8", "#C7CCE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enviarBtn}
            >
              {enviando ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Text style={styles.enviarBtnText}>Enviar calificación</Text>
                  <Ionicons name="arrow-forward" size={16} color={WHITE} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LowReviewModal visible={showLowModal} onClose={() => setShowLowModal(false)} onSubmit={handleLowSubmit} />

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reason={reportReason}
        onReasonChange={setReportReason}
        description={reportDescription}
        onDescriptionChange={setReportDescription}
        onSubmit={handleReportSubmit}
        enviando={enviandoReporte}
      />

      <BottomNavBar usuario={usuario} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  banner: {
    margin: 16,
    marginTop: 16,
    borderRadius: 26,
    padding: 20,
    overflow: "hidden",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  bannerGlowTop: { position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "#fff", opacity: 0.12 },
  bannerGlowBottom: { position: "absolute", bottom: -55, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "#fff", opacity: 0.08 },

  bannerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bannerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  bannerTagText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  reportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239,68,68,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  reportBadgeText: { color: "#fff", fontSize: 10.5, fontWeight: "800" },

  bannerClienteRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  bannerAvatarWrap: { padding: 2.5, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.15)" },
  bannerAvatar: { width: 52, height: 52, borderRadius: 26 },
  bannerAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerAvatarFallbackText: { color: WHITE, fontWeight: "800", fontSize: 16 },
  bannerClienteNombre: { color: WHITE, fontSize: 17, fontWeight: "800" },
  bannerServicio: { color: "rgba(255,255,255,0.75)", fontSize: 12.5, marginTop: 3 },

  card: {
    backgroundColor: CARD,
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTitle: { color: TEXT_DARK, fontSize: 15.5, fontWeight: "800" },
  cardSubtitle: { color: TEXT_MUTED, fontSize: 12, marginTop: 3 },

  estrellasGrandesRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 18 },
  estrellasLabel: { textAlign: "center", marginTop: 12, color: INDIGO, fontWeight: "800", fontSize: 14 },

  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: { flex: 1, fontSize: 14.5, color: TEXT_DARK },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  pickerDropdown: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  pickerDropdownTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK, marginBottom: 16 },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pickerOptionActive: {
    backgroundColor: "rgba(42,63,214,0.06)",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomColor: "transparent",
    borderRadius: 12,
  },
  pickerOptionText: { flex: 1, fontSize: 14.5, color: TEXT_DARK },
  pickerOptionTextActive: { color: INDIGO, fontWeight: "700" },

  comentarioInput: {
    marginTop: 14,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    minHeight: 96,
    color: TEXT_DARK,
    fontSize: 13.5,
    lineHeight: 19,
  },
  contadorChars: { textAlign: "right", color: TEXT_MUTED, fontSize: 11, marginTop: 6 },

  fieldLabel: { fontSize: 11.5, fontWeight: "700", color: TEXT_MUTED, letterSpacing: 0.3, textTransform: "uppercase" },

  blockRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: RED, borderColor: RED },
  blockLabel: { fontSize: 14, fontWeight: "700", color: TEXT_DARK, marginBottom: 2 },
  blockLabelActive: { color: RED },
  blockSub: { fontSize: 11.5, color: TEXT_MUTED },

  reportLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  reportLinkText: { color: RED, fontWeight: "700", fontSize: 13 },

  footerBtns: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  omitirBtn: { alignItems: "center", paddingVertical: 10 },
  omitirBtnText: { color: TEXT_MUTED, fontWeight: "700", fontSize: 13.5 },
  enviarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  enviarBtnText: { color: WHITE, fontWeight: "800", fontSize: 15.5 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  modalTitle: { flex: 1, fontSize: 19, fontWeight: "800", color: TEXT_DARK },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: "center", justifyContent: "center" },
  modalCloseIcon: { fontSize: 14, color: TEXT_MUTED, fontWeight: "700" },
  modalSubtitle: { fontSize: 13.5, color: TEXT_MUTED, marginBottom: 20, lineHeight: 19 },
  modalInput: {
    backgroundColor: BG,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: TEXT_DARK,
    minHeight: 110,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
});