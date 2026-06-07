import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TrabajoActivoTrabajador from "./TrabajoActivoTrabajador";
import Search from "./Search";



const trabajos = [
  {
    id: "1",
    nombre: "Rodrigo Perez",
    categoria: "Plomería",
    horario: "17:30",
    distancia: "1.2km",
    precio: "23.000$",
  },
  {
    id: "2",
    nombre: "Rodrigo Perez",
    categoria: "Plomería",
    horario: "17:30",
    distancia: "1.2km",
    precio: "23.000$",
  },
  {
    id: "3",
    nombre: "Rodrigo Perez",
    categoria: "Plomería",
    horario: "17:30",
    distancia: "1.2km",
    precio: "23.000$",
  },
  {
    id: "4",
    nombre: "Rodrigo Perez",
    categoria: "Plomería",
    horario: "17:30",
    distancia: "1.2km",
    precio: "23.000$",
  },
];

const TrabajoCard = ({ item }) => {
  return (
    <View style={styles.card}>
      {/* Foto botón */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => {
          // navegación futura
        }}
      />

      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Categoría:</Text>
          <Text style={styles.label}>Horario:</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.value}>{item.categoria}</Text>
          <Text style={styles.value}>{item.horario}</Text>
        </View>

        <View style={styles.rowBottom}>
          <Text style={styles.bottomText}>
            <Text style={styles.label}>Distancia:</Text> {item.distancia}
          </Text>

          <Text style={styles.bottomText}>
            <Text style={styles.label}>Fijo:</Text> {item.precio}
          </Text>
        </View>
      </View>

      <Text style={styles.nombre}>{item.nombre}</Text>
    </View>
  );
};

export default function BuscadorTrabajador() {
  return (
            <View style={styles.container}>
      {/* Buscador */}
      <Search/>
      
      <Text style={styles.titulo}>Trabajos</Text>

      <FlatList
        data={trabajos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrabajoCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
            <TrabajoActivoTrabajador/> 

    </View>
    
    
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECECEC",
    paddingHorizontal: 15,
    paddingTop: 20,
  },

  

  titulo: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 24,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#0D47C7",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    position: "relative",
    minHeight: 100,
  },

  nombre: {
    position: "absolute",
    top: 5,
    left: 8,
    fontSize: 11,
    color: "#ffffff",
  },

  profileButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: "#D9D9D9",
    margin: 25,
    alignSelf: "center",
  },

  infoContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  label: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  value: {
    color: "#FFF",
    fontSize: 14,
  },

  bottomText: {
    color: "#FFF",
    fontSize: 13,
  },
});