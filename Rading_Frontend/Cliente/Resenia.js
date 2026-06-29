
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  Alert,
} from "react-native";

const COLORS = {
  primary: "#1565D8",
  primaryDark: "#1565D8",
  star: "#1A3CFF",
  starEmpty: "#D0D8FF",
  background: "#F5F6FA",
  card: "#FFFFFF",
  descrition: "#000000",
  textPrimary: "#1565D8",
  textSecondary: "#1565D8",
  textMuted: "#000000",
  border: "#E2E6F3",
  inputBg: "#F0F2FA",
  danger: "#FF3B30",
};

const REASONS = [
  { label: "Selecciona una razon...", value: "" },
  { label: "Excelente trabajo", value: "excellent" },
  { label: "Buen trabajo", value: "good" },
  { label: "Trabajo aceptable", value: "acceptable" },
  { label: "Necesita mejorar", value: "needs_improvement" },
  { label: "Trabajo deficiente", value: "poor" },
];

const StarRating = ({ rating, onRate }) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7} style={styles.starBtn}>
        <Text style={[styles.star, { color: star <= rating ? COLORS.star : COLORS.starEmpty }]}>
          {"\u2605"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const ReasonPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = REASONS.find((r) => r.value === value) || REASONS[0];

  return (
    <>
      <TouchableOpacity style={styles.pickerTrigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[styles.pickerText, !value && { color: COLORS.textMuted }]}>{selected.label}</Text>
        <Text style={styles.pickerChevron}>{"\u25be"}</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.pickerDropdown}>
            <Text style={styles.pickerDropdownTitle}>{"Raz\u00f3n de la calificaci\u00f3n"}</Text>
            {REASONS.filter((r) => r.value !== "").map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.pickerOption, value === r.value && styles.pickerOptionActive]}
                onPress={() => { onChange(r.value); setOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, value === r.value && styles.pickerOptionTextActive]}>
                  {r.label}
                </Text>
                {value === r.value && <Text style={styles.pickerCheck}>{"\u2713"}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const LowReviewModal = ({ visible, onClose, onSubmit }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) {
      Alert.alert("Campo requerido", "Por favor conta\u0301nos que\u0301 paso\u0301 antes de enviar.");
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
            <Text style={styles.modalTitle}>{"\u00bfDinos qu\u00e9 pas\u00f3?"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalCloseIcon}>{"\u2715"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            {"Tu opini\u00f3n nos ayuda a mejorar la calidad del servicio."}
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Conta\u0301nos tu experiencia con detalle..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Enviar comentario</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function ClasificarTrabajador({ worker, onSubmit }) {
  const w = worker || { name: "Alejandro Gomez", role: "Plomero", avatar: null };

  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [block, setBlock] = useState(false);
  const [showLowModal, setShowLowModal] = useState(false);
  const [lowReviewText, setLowReviewText] = useState("");

  const ratingLabels = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  const handleRate = (val) => {
    setRating(val);
    if (val <= 2) setShowLowModal(true);
  };

  const handleLowSubmit = (text) => {
    setLowReviewText(text);
    setShowLowModal(false);
  };

  const handleSend = () => {
    if (!rating) {
      Alert.alert("Calificaci\u00f3n requerida", "Por favor selecciona una calificaci\u00f3n con estrellas.");
      return;
    }
    if (!reason) {
      Alert.alert("Raz\u00f3n requerida", "Por favor selecciona una raz\u00f3n para tu calificaci\u00f3n.");
      return;
    }
    const payload = { rating, reason, description, block, lowReviewText };
    onSubmit ? onSubmit(payload) : Alert.alert("Enviado", JSON.stringify(payload));
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Clasificar trabajador</Text>

        {/* Tarjeta trabajador */}
        <View style={styles.workerCard}>
          <View style={styles.avatarWrapper}>
            {w.avatar ? (
              <Image source={{ uri: w.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.reportBadge}
              onPress={() => Alert.alert("Reportar", "\u00bfDeseas reportar a este trabajador?")}
            >
              <Text style={styles.reportIcon}>{"\ud83d\udce3"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.workerName}>{w.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{w.role}</Text>
          </View>
        </View>

        {/* Estrellas */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{"\u00bfC\u00f3mo lo calific\u00e1s?"}</Text>
          <StarRating rating={rating} onRate={handleRate} />
          {rating > 0 && <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>}
        </View>

        {/* Razon */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{"Raz\u00f3n"}</Text>
          <ReasonPicker value={reason} onChange={setReason} />
        </View>

        {/* Descripcion */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>{"Descripci\u00f3n"}</Text>
          <TextInput
            style={styles.descInput}
            placeholder="Conta\u0301nos tu experiencia..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        {/* Bloquear */}
        <TouchableOpacity
          style={[styles.blockRow, block && styles.blockRowActive]}
          onPress={() => setBlock(!block)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, block && styles.checkboxChecked]}>
            {block && <Text style={styles.checkmark}>{"\u2713"}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.blockLabel, block && styles.blockLabelActive]}>Bloquear usuario</Text>
            <Text style={styles.blockSub}>{"No volver\u00e1 a aparecer en tus b\u00fasquedas"}</Text>
          </View>
        </TouchableOpacity>

        {/* Boton */}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>{"Enviar calificaci\u00f3n"}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <LowReviewModal
        visible={showLowModal}
        onClose={() => setShowLowModal(false)}
        onSubmit={handleLowSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  screenContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 20, letterSpacing: -0.3 },
  workerCard: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 24,
    shadowColor: "#1A3CFF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.primary },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.inputBg,
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: COLORS.primary },
  reportBadge: {
    position: "absolute", top: -4, right: -4, backgroundColor: COLORS.danger,
    width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.card,
  },
  reportIcon: { fontSize: 14 },
  workerName: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
  rolePill: { backgroundColor: COLORS.inputBg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  roleText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center", marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase" },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 40 },
  ratingLabel: { textAlign: "center", marginTop: 8, fontSize: 15, fontWeight: "600", color: COLORS.primary },
  pickerTrigger: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14,
  },
  pickerText: { flex: 1, fontSize: 15, color: COLORS.descrition },
  pickerChevron: { fontSize: 18, color: COLORS.primary },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  pickerDropdown: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 36,
  },
  pickerDropdownTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 16 },
  pickerOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerOptionActive: { backgroundColor: "#EEF1FF", marginHorizontal: -20, paddingHorizontal: 20, borderBottomColor: "transparent", borderRadius: 12 },
  pickerOptionText: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  pickerOptionTextActive: { color: COLORS.primary, fontWeight: "600" },
  pickerCheck: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
  descInput: {
    backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1.5,
    borderColor: COLORS.border, padding: 14, fontSize: 15, color: COLORS.textPrimary, minHeight: 100,
  },
  charCount: { textAlign: "right", fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  blockRow: {
    flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 16, marginBottom: 24,
  },
  blockRowActive: { borderColor: COLORS.danger, backgroundColor: "#FFF5F5" },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  checkmark: { color: "#fff", fontWeight: "700", fontSize: 14 },
  blockLabel: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 2 },
  blockLabelActive: { color: COLORS.danger },
  blockSub: { fontSize: 12, color: COLORS.textMuted },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.inputBg, alignItems: "center", justifyContent: "center" },
  modalCloseIcon: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "700" },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 20 },
  modalInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 14, padding: 14, fontSize: 15,
    color: COLORS.textPrimary, minHeight: 110, marginBottom: 20, borderWidth: 1.5, borderColor: COLORS.border,
  },
});
