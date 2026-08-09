import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import API_URL from "../configS";

export default function ConfirmarTrabajoCl({
  idTrabajo,
  service = "Reparación de plomería",
  workerName = "Juan Pérez",
  duration = "45 min",
  onConfirm = () => {},
  onClose = () => {},
}) {
  const [status, setStatus] = useState("idle"); // idle | loading | waiting | success | error | closing
  const [errorMsg, setErrorMsg] = useState(null);
  const [visible, setVisible] = useState(true);
  const pollRef = useRef(null);

  const cardAnim = useRef(new Animated.Value(1)).current; // opacity/scale for close
  const popAnim = useRef(new Animated.Value(0)).current; // entrance for success/waiting badge
  const spinAnim = useRef(new Animated.Value(0)).current;

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  // spinner rotation loop, runs while loading or waiting
  useEffect(() => {
    let loop;
    if (status === "loading" || status === "waiting") {
      spinAnim.setValue(0);
      loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: status === "loading" ? 700 : 800,
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

  // pop-in entrance for success/waiting icon
  useEffect(() => {
    if (status === "success" || status === "waiting") {
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

  const goToSuccess = (data) => {
    setStatus("success");
    onConfirm(data);
    setTimeout(() => {
      animateClose();
    }, 1600);
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/trabajo/${idTrabajo}/estado`);
        if (!res.ok) return;
        const estado = await res.json();
        if (estado.estado === "TERMINADO") {
          stopPolling();
          goToSuccess(estado);
        }
      } catch (e) {
        console.error("Error consultando estado (cliente-fin):", e);
      }
    }, 4000);
  };

  const handleConfirm = async () => {
    if (status !== "idle" && status !== "error") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/trabajo/${idTrabajo}/confirmar-fin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: "CLIENTE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo confirmar el trabajo");

      if (data.ambosFinesConfirmados || data.trabajoTerminadoAhora) {
        goToSuccess(data);
      } else {
        setStatus("waiting");
        startPolling();
      }
    } catch (err) {
      console.error("Error al confirmar fin (cliente):", err);
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
    stopPolling();
    animateClose();
  };

  if (!visible) return null;

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1],
        }),
      },
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
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
            <Animated.View
              style={[
                styles.checkWrap,
                { transform: [{ scale: popAnim }] },
              ]}
            >
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
            <Text style={styles.successTitle}>¡Gracias por confirmar!</Text>
            <Text style={styles.successSub}>
              Marcamos el servicio de {workerName} como finalizado.
            </Text>
          </View>
        ) : status === "waiting" ? (
          <View style={styles.centerBlock}>
            <Animated.View
              style={[styles.waitingWrap, { transform: [{ scale: popAnim }] }]}
            >
              <Animated.View
                style={[styles.waitingSpinner, { transform: [{ rotate: spin }] }]}
              />
            </Animated.View>
            <Text style={styles.waitingTitle}>Esperando a {workerName}</Text>
            <Text style={styles.waitingSub}>
              Ya confirmaste el fin del trabajo. Se cierra en cuanto {workerName}{" "}
              confirme también.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.badge}>
              <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 12.5 11 14.5 15.5 9.5"
                  stroke="#ffffff"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Rect x={3.5} y={4.5} width={17} height={15} rx={4} stroke="#ffffff" strokeWidth={2} />
              </Svg>
            </View>

            <Text style={styles.title}>Confirmá el trabajo</Text>
            <Text style={styles.sub}>
              Revisá que {workerName} haya finalizado el servicio en tu domicilio.
            </Text>

            <View style={styles.rows}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Servicio</Text>
                <Text style={styles.rowValue}>{service}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Trabajador</Text>
                <Text style={styles.rowValue}>{workerName}</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>Duración</Text>
                <Text style={styles.rowValue}>{duration}</Text>
              </View>
            </View>

            {status === "error" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, status === "loading" && { opacity: 0.85 }]}
              disabled={status === "loading"}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              {status === "loading" ? (
                <>
                  <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                  <Text style={styles.btnText}>Confirmando...</Text>
                </>
              ) : status === "error" ? (
                <Text style={styles.btnText}>Reintentar</Text>
              ) : (
                <Text style={styles.btnText}>Confirmar trabajo finalizado</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const BLUE = "#0b2cd6";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
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
  title: {
    textAlign: "center",
    color: BLUE,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 4,
  },
  sub: {
    textAlign: "center",
    color: "#8a90a8",
    fontSize: 13.5,
    marginBottom: 20,
    lineHeight: 19,
  },
  rows: {
    backgroundColor: "#f6f8ff",
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
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
  rowValue: {
    color: "#16193f",
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "right",
    maxWidth: "60%",
  },
  errorBox: {
    backgroundColor: "#fdeceb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  errorText: {
    color: "#c0392b",
    fontSize: 12.5,
    fontWeight: "600",
    textAlign: "center",
  },
  btn: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "#1657ff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  btnText: { color: "#ffffff", fontSize: 15.5, fontWeight: "800" },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    marginRight: 10,
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
  waitingWrap: {
    width: 84,
    height: 84,
    marginTop: 4,
    marginBottom: 18,
    borderRadius: 42,
    backgroundColor: "#1657ff",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
  },
  successTitle: { color: BLUE, fontSize: 19, fontWeight: "800", marginBottom: 6 },
  successSub: { color: "#8a90a8", fontSize: 13.5, textAlign: "center" },
  waitingTitle: { color: BLUE, fontSize: 19, fontWeight: "800", marginBottom: 6 },
  waitingSub: { color: "#8a90a8", fontSize: 13.5, textAlign: "center" },
});