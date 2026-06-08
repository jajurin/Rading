import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TrabajoActivoTrabajador({
  estado = "TRABAJO EN CURSO",
  titulo = "REPARACIÓN DE PLOMERÍA",
  expanded = false,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.leftSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct" size={12} color="#fff" />
        </View>
        <View>
          <Text style={styles.estado}>{estado}</Text>
          <Text style={styles.titulo}>{titulo}</Text>
        </View>
      </View>

      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color="#fff"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 64,
    backgroundColor: "#1565D8",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 45,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  estado: {
    fontSize: 8,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    textTransform: "uppercase",
    marginTop: 1,
  },
});