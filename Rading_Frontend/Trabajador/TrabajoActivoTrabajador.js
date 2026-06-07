import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Search from "./Search";

export default function TrabajoActivoTrabajador({
  estado = "TRABAJO EN CURSO",
  titulo = "REPARACIÓN DE PLOMERÍA",
  expanded = true,
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
          <Ionicons name="construct" size={12} color="#000" />
        </View>

        <View>
          <Text style={styles.estado}>{estado}</Text>
          <Text style={styles.titulo}>{titulo}</Text>
        </View>
      </View>

      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color="#000"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 64,
    backgroundColor: "#F3C64D",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 45,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DDB03C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  estado: {
    fontSize: 8,
    fontWeight: "700",
    color: "#444",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  titulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    textTransform: "uppercase",
    marginTop: 1,
  },
});