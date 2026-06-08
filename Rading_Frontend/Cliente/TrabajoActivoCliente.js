import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TrabajoActivoCliente({
  titulo = "REPARACIÓN DE PLOMERÍA",
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="construct" size={14} color="#0D47C7" />
        </View>

        <View>
          <Text style={styles.estado}>BUSCANDO...</Text>
          <Text style={styles.titulo}>{titulo}</Text>
        </View>
      </View>

      <Ionicons name="chevron-up" size={24} color="#1A1A1A" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    height: 64,
    backgroundColor: "#ffee00",
    borderRadius: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,

    elevation: 3,
  },

  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8D34A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  estado: {
    fontSize: 8,
    fontWeight: "700",
    color: "#4A4A4A",
    letterSpacing: 0.5,
    textTransform: "uppercase",

  },

  titulo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    marginTop: 1,
  },
});