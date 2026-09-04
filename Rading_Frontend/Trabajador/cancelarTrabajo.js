import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import API_URL from "../configS";

const MOTIVOS = [
  "El trabajador no llegó",
  "Cambié de planes",
  "Encontré otra solución",
  "El precio no me convence",
  "Otro motivo",
];

export default function CancelarTrabajoCl({
  idTrabajo,
  service = "Reparación de plomería",
  workerName = "Juan Pérez",
  onCancelado = () => {},
  onClose = () => {},
}) {
  const [status, setStatus] = useState("idle"); // idle | confirm | loading | success | error | closing
  const [motivo, setMotivo] = useState(null);
  const [motivoOtro, setMotivoOtro] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [visible, setVisible] = useState(true);

  const cardAnim = useRef(new Animated.Value(1)).current;
  const popAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    if (status === "loading") {
      spinAnim.setValue(0);
      loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [status]);

  useEffect(() => {
    if (status === "success") {
      popAnim.setValue(0);
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const motivoFinal = motivo === "Otro motivo" ? motivoOtro.trim() : motivo;
  const puedeConfirmar = !!motivo && (motivo !== "Otro motivo" || motivoFinal.length > 0);

  const cancelarTrabajo = async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/trabajo/${idTrabajo}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoFinal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cancelar el trabajo");

      setStatus("success");
      onCancelado(data);
      setTimeout(() => {
        animateClose();
      }, 1600);
    } catch (err) {
      console.error("Error al cancelar trabajo:", err);
      setErrorMsg(err.message || "Ocurrió un error. Probá de nuevo.");
      setStatus("error");
    }
  };

  const animateClose = () => {
    setStatus("closing");
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onClose();
    });
  };

  const handleClose = () => {
    if (status === "closing" || status === "loading") return;
    animateClose();
  };

  if (!visible) return null;

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, cardStyle]}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {status === "success" ? (
          <View style={styles.centerBlock}>
            <Animated.View style={[styles.checkWrap, { transform: [{ scale: popAnim }] }]}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 13l4 4L19 7"
                  stroke="#ffffff"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            <Text style={styles.successTitle}>Trabajo cancelado</Text>
            <Text style={styles.successSub}>
              Le avisamos a {workerName} que el servicio fue cancelado.
            </Text>
          </View>
        ) : status === "confirm" ? (
          <View style={styles.centerBlock}>
            <View style={[styles.badge, styles.badgeWarn]}>
              <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 9v4M12 16.5h.01"
                  stroke="#ffffff"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx={12} cy={12} r={9} stroke="#ffffff" strokeWidth={2} />
              </Svg>
            </View>
            <Text style={styles.title}>¿Confirmás la cancelación?</Text>
            <Text style={styles.sub}>
              Esta acción no se puede deshacer. {workerName} va a ser notificado.
            </Text>

            {status !== "loading" && errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => setStatus("idle")}
                activeOpacity={0.85}
              >
                <Text style={styles.btnGhostText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnDanger, status === "loading" && { opacity: 0.85 }]}
                disabled={status === "loading"}
                onPress={cancelarTrabajo}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Sí, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : status === "loading" ? (
          <View style={styles.centerBlock}>
            <Animated.View style={[styles.spinnerBig, { transform: [{ rotate: spin }] }]} />
            <Text style={styles.waitingTitle}>Cancelando el trabajo…</Text>
            <Text style={styles.waitingSub}>Esto puede tardar unos segundos.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.badge, styles.badgeWarn]}>
              <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 8l8 8M16 8l-8 8"
                  stroke="#ffffff"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <Text style={styles.title}>Cancelar trabajo</Text>
            <Text style={styles.sub}>
              Contanos por qué querés cancelar el servicio con {workerName}.
            </Text>

            <View style={styles.rows}>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>Servicio</Text>
                <Text style={styles.rowValue}>{service}</Text>
              </View>
            </View>

            <View style={styles.motivosWrap}>
              {MOTIVOS.map((m) => {
                const activo = motivo === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.motivoChip, activo && styles.motivoChipActivo]}
                    onPress={() => setMotivo(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.motivoChipText, activo && styles.motivoChipTextActivo]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {motivo === "Otro motivo" && (
              <TextInput
                style={styles.input}
                placeholder="Contanos brevemente el motivo"
                placeholderTextColor="#8a90a8"
                value={motivoOtro}
                onChangeText={setMotivoOtro}
                multiline
              />
            )}

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btnDanger, !puedeConfirmar && { opacity: 0.5 }]}
              disabled={!puedeConfirmar}
              onPress={() => setStatus("confirm")}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Continuar</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const BLUE = "#0b2cd6";
const RED = "#e0392b";

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#0b1220", alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    paddingTop: 28,
    shadowColor: BLUE,
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#f1f4ff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  closeBtnText: { color: BLUE, fontSize: 16, fontWeight: "700" },
  badge: {
    width: 74,
    height: 74,
    marginTop: 6,
    marginBottom: 14,
    alignSelf: "center",
    borderRadius: 24,
    backgroundColor: "#1550ff",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWarn: { backgroundColor: RED },
  title: { textAlign: "center", color: BLUE, fontSize: 21, fontWeight: "800", marginBottom: 4 },
  sub: { textAlign: "center", color: "#8a90a8", fontSize: 13.5, marginBottom: 20, lineHeight: 19 },
  rows: { backgroundColor: "#f6f8ff", borderRadius: 18, paddingHorizontal: 16, marginBottom: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9edff",
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: "#8a90a8", fontSize: 13, fontWeight: "600" },
  rowValue: { color: "#16193f", fontSize: 13.5, fontWeight: "700", textAlign: "right", maxWidth: "60%" },

  motivosWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  motivoChip: {
    borderWidth: 1.4,
    borderColor: "#e2e6f5",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  motivoChipActivo: { backgroundColor: RED, borderColor: RED },
  motivoChipText: { color: "#5a6079", fontSize: 12.5, fontWeight: "600" },
  motivoChipTextActivo: { color: "#ffffff" },

  input: {
    backgroundColor: "#f6f8ff",
    borderRadius: 14,
    padding: 12,
    fontSize: 13.5,
    color: "#16193f",
    minHeight: 56,
    textAlignVertical: "top",
    marginBottom: 16,
  },

  errorBox: { backgroundColor: "#fdeceb", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
  errorText: { color: "#c0392b", fontSize: 12.5, fontWeight: "600", textAlign: "center" },

  btnDanger: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  btnText: { color: "#ffffff", fontSize: 15.5, fontWeight: "800" },

  confirmBtnRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  btnGhost: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f4ff",
  },
  btnGhostText: { color: BLUE, fontSize: 15, fontWeight: "800" },

  spinnerBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: "#e9edff",
    borderTopColor: RED,
    marginBottom: 18,
  },

  centerBlock: { alignItems: "center", paddingVertical: 6, paddingBottom: 4 },
  checkWrap: {
    width: 84,
    height: 84,
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 42,
    backgroundColor: "#1657ff",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { color: BLUE, fontSize: 19, fontWeight: "800", marginBottom: 6 },
  successSub: { color: "#8a90a8", fontSize: 13.5, textAlign: "center" },
  waitingTitle: { color: BLUE, fontSize: 19, fontWeight: "800", marginBottom: 6 },
  waitingSub: { color: "#8a90a8", fontSize: 13.5, textAlign: "center", marginBottom: 6 },
});