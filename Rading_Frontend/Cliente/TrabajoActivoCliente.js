import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TrabajoActivoCliente({
  titulo = "REPARACIÓN DE PLOMERÍA",
  onPress,
}) {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct" size={13} color="#7a5c00" />
        </View>
        <View>
          <Text style={styles.estado}>Buscando...</Text>
          <Text style={styles.titulo}>{titulo}</Text>
        </View>
      </View>
      <Ionicons name="chevron-up" size={20} color="#3d2e00" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 64,
    backgroundColor: "#FFD600",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  estado: {
    fontSize: 9,
    fontWeight: "500",
    color: "#7a5c00",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  titulo: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1200",
    textTransform: "uppercase",
    marginTop: 1,
  },
});