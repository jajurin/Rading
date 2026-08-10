import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/* Mismos tokens que el resto de la app */
const AMBER = "#F5A623";
const AMBER_DEEP = "#C77F0A";
const INDIGO = "#3D4EEA";
const NAVY = "#0A1230";
const INK = "#3D2E00";

export default function TrabajoActivoCliente({
  titulo = "Trabajos activos",
  estado = "Cargando...",
  onPress,
  // 👇 Cantidad de ofertas nuevas/pendientes. Si es > 0, se muestra una
  // alertita (badge) en la esquina de la tarjeta para que el cliente sepa
  // que tiene algo esperando, aunque no haya abierto el overlay todavía.
  badgeCount = 0,
}) {
  const mostrarBadge = badgeCount > 0;

  // Punto pulsante — comunica "esto se está actualizando en vivo"
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <TouchableOpacity style={styles.wrap} activeOpacity={0.92} onPress={onPress}>
      <LinearGradient
        colors={[AMBER, AMBER_DEEP]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.glowTop} />

        <View style={styles.leftSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="construct" size={15} color={INK} />
            <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.estado} numberOfLines={1}>{estado}</Text>
            <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {mostrarBadge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount > 9 ? "9+" : badgeCount}
              </Text>
            </View>
          )}
          <View style={styles.chevronBtn}>
            <Ionicons name="chevron-up" size={18} color={INK} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  container: {
    width: "100%",
    minHeight: 66,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    overflow: "hidden",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glowTop: {
    position: "absolute",
    top: -26,
    right: -18,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    opacity: 0.14,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.09)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  liveDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: INDIGO,
    borderWidth: 1.5,
    borderColor: AMBER,
  },
  estado: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(61,46,0,0.72)",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  titulo: {
    fontSize: 15,
    fontWeight: "800",
    color: INK,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    minWidth: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: INDIGO,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },
  chevronBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});