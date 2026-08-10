  import React, { useState, useRef, useEffect } from "react";
  import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
  } from "react-native";
  import Svg, { Path, Circle } from "react-native-svg";
  import API_URL from "../configS";

  export default function ConfirmarLlegadaCl({
    idTrabajo,
    service = "Reparación de plomería",
    workerName = "Juan Pérez",
    onConfirm = () => {},
    onClose = () => {},
  }) {
    const [status, setStatus] = useState("idle"); // idle | loading | waiting | success | error | closing
    const [codigo, setCodigo] = useState(null);
    const [validezMinutos, setValidezMinutos] = useState(15);
    const [errorMsg, setErrorMsg] = useState(null);
    const [visible, setVisible] = useState(true);
    const pollRef = useRef(null);

    const cardAnim = useRef(new Animated.Value(1)).current;
    const popAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    useEffect(() => stopPolling, []);

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
      stopPolling();
      setStatus("success");
      onConfirm(data);
      setTimeout(() => {
        animateClose();
      }, 1600);
    };

    // Poll de /estado: cuando el trabajador ingresa bien el código,
    // el backend setea llegada_trabajador_at / trabajo_iniciado_en.
    const startPolling = () => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/trabajo/${idTrabajo}/estado`);
          if (!res.ok) return;
          const estado = await res.json();
          if (estado.llegada_trabajador_at || estado.trabajo_iniciado_en) {
            goToSuccess(estado);
          }
        } catch (e) {
          console.error("Error consultando estado (cliente-generar-llegada):", e);
        }
      }, 4000);
    };

    const generarCodigo = async () => {
      setStatus("loading");
      setErrorMsg(null);
      try {
        const res = await fetch(`${API_URL}/trabajo/${idTrabajo}/generar-codigo-llegada`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo generar el código");

        setCodigo(data.codigo);
        setValidezMinutos(data.validezMinutos ?? 15);
        setStatus("waiting");
        startPolling();
      } catch (err) {
        console.error("Error al generar código de llegada:", err);
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
              <Text style={styles.successTitle}>¡Llegada confirmada!</Text>
              <Text style={styles.successSub}>
                {workerName} ingresó el código correctamente.
              </Text>
            </View>
          ) : status === "waiting" ? (
            <View style={styles.centerBlock}>
              <Animated.View style={[styles.codeWrap, { transform: [{ scale: popAnim }] }]}>
                <Text style={styles.codeText}>{codigo}</Text>
              </Animated.View>
              <Text style={styles.waitingTitle}>Compartí este código</Text>
              <Text style={styles.waitingSub}>
                Decíselo a {workerName} para que confirme su llegada. Válido por {validezMinutos} minutos.
              </Text>
              <TouchableOpacity style={styles.linkBtn} onPress={generarCodigo} activeOpacity={0.7}>
                <Text style={styles.linkBtnText}>Generar un código nuevo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.badge}>
                <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C8 2 4.8 5.2 4.8 9.2c0 5.4 6.3 11.6 6.6 11.9.3.3.7.3 1 0 .3-.3 6.6-6.5 6.6-11.9C19.2 5.2 16 2 12 2z"
                    fill="#ffffff"
                  />
                  <Circle cx={12} cy={9.2} r={2.6} fill="#0b2cd6" />
                </Svg>
              </View>

              <Text style={styles.title}>Confirmá la llegada</Text>
              <Text style={styles.sub}>
                Generá un código y compartíselo a {workerName} cuando llegue a tu domicilio.
              </Text>

              <View style={styles.rows}>
                <View style={[styles.row, styles.rowLast]}>
                  <Text style={styles.rowLabel}>Servicio</Text>
                  <Text style={styles.rowValue}>{service}</Text>
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
                onPress={generarCodigo}
                activeOpacity={0.85}
              >
                {status === "loading" ? (
                  <>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                    <Text style={styles.btnText}>Generando...</Text>
                  </>
                ) : status === "error" ? (
                  <Text style={styles.btnText}>Reintentar</Text>
                ) : (
                  <Text style={styles.btnText}>Generar código</Text>
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
    title: { textAlign: "center", color: BLUE, fontSize: 21, fontWeight: "800", marginBottom: 4 },
    sub: { textAlign: "center", color: "#8a90a8", fontSize: 13.5, marginBottom: 20, lineHeight: 19 },
    rows: { backgroundColor: "#f6f8ff", borderRadius: 18, paddingHorizontal: 16, marginBottom: 22 },
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
    errorBox: { backgroundColor: "#fdeceb", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
    errorText: { color: "#c0392b", fontSize: 12.5, fontWeight: "600", textAlign: "center" },
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
    codeWrap: {
      minWidth: 160,
      paddingVertical: 18,
      paddingHorizontal: 26,
      marginTop: 4,
      marginBottom: 18,
      borderRadius: 24,
      backgroundColor: "#1657ff",
      alignItems: "center",
      justifyContent: "center",
    },
    codeText: {
      color: "#ffffff",
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: 8,
    },
    linkBtn: { marginTop: 4, paddingVertical: 8 },
    linkBtnText: { color: BLUE, fontSize: 13.5, fontWeight: "700", textDecorationLine: "underline" },
    successTitle: { color: BLUE, fontSize: 19, fontWeight: "800", marginBottom: 6 },
    successSub: { color: "#8a90a8", fontSize: 13.5, textAlign: "center" },
    waitingTitle: { color: BLUE, fontSize: 19, fontWeight: "800", marginBottom: 6 },
    waitingSub: { color: "#8a90a8", fontSize: 13.5, textAlign: "center", marginBottom: 6 },
  });