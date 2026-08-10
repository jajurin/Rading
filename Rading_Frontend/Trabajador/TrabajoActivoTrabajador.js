import React, { useEffect, useRef } from "react";
import { TouchableOpacity, View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/* Mismos tokens que el resto de la app (Home del trabajador) */
const INDIGO = "#3D4EEA";
const INDIGO_DEEP = "#2432B0";
const NAVY = "#0A1230";
const SUCCESS = "#2ED573";
const WHITE = "#FFFFFF";

/**
 * Barra flotante que indica que hay un trabajo en curso.
 * Mantiene la misma firma de props que la versión anterior
 * (estado, titulo, expanded, onPress) — reemplazo directo —
 * y suma dos props opcionales no disruptivas:
 *  - clienteNombre: si se pasa, se muestra debajo del título
 *  - tiempo: string ya formateado (ej. "12:34") para mostrar duración
 */
export default function TrabajoActivoTrabajador({
  estado = "TRABAJO EN CURSO",
  titulo = "Trabajo...",
  clienteNombre,
  tiempo,
  expanded = false,
  onPress,
}) {
  // Punto "en vivo" pulsante — refuerza que el trabajo está activo ahora mismo
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.wrap}>
      <LinearGradient
        colors={[INDIGO, INDIGO_DEEP]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.glowTop} />

        <View style={styles.leftSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="construct" size={16} color="#fff" />
            <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          </View>

          <View style={{ flexShrink: 1 }}>
            <View style={styles.estadoRow}>
              <Text style={styles.estado} numberOfLines={1}>{estado}</Text>
              {!!tiempo && (
                <>
                  <View style={styles.estadoDivider} />
                  <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.tiempo}>{tiempo}</Text>
                </>
              )}
            </View>
            <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
            {!!clienteNombre && (
              <Text style={styles.cliente} numberOfLines={1}>{clienteNombre}</Text>
            )}
          </View>
        </View>

        <View style={styles.chevronBtn}>
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-up"}
            size={18}
            color="#fff"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: 30,
  },
  container: {
    width: "100%",
    minHeight: 68,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: "hidden",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  glowTop: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#fff",
    opacity: 0.08,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  liveDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: SUCCESS,
    borderWidth: 1.5,
    borderColor: INDIGO_DEEP,
  },
  estadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  estado: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  estadoDivider: {
    width: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },
  tiempo: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  titulo: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  cliente: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});