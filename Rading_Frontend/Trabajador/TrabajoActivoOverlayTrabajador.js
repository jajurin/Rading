import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from '../configS';

const AVATAR_CLIENTE = (nombre = '', apellido = '') =>
  `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=0D47C7&color=fff&size=150`;

const TrabajoItem = ({ trabajo, onSelect, isSelected }) => (
  <TouchableOpacity
    style={[styles.item, isSelected && styles.itemSelected]}
    onPress={() => onSelect(trabajo)}
    activeOpacity={0.75}
  >
    <View style={styles.itemLeft}>
      <Image
        source={{ uri: AVATAR_CLIENTE(trabajo.nombre, trabajo.apellido) }}
        style={styles.itemAvatar}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemServicio} numberOfLines={1}>
          {trabajo.servicio_nombre ?? 'Trabajo'}
        </Text>
        <Text style={styles.itemNombre} numberOfLines={1}>
          {trabajo.nombre} {trabajo.apellido}
        </Text>
        <View style={styles.estadoBadge}>
          <View style={styles.estadoDot} />
          <Text style={styles.estadoText}>EN PROCESO</Text>
        </View>
      </View>
    </View>
    <View style={styles.itemRight}>
      <Text style={styles.itemPrecio}>${trabajo.precio ?? '-'}</Text>
      <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={18} color="#fff" />
    </View>
  </TouchableOpacity>
);

const TrabajoDetalle = ({ trabajo, onChat }) => (
  <View style={styles.detalle}>
    <View style={styles.detalleWorkerRow}>
      <Image
        source={{ uri: AVATAR_CLIENTE(trabajo.nombre, trabajo.apellido) }}
        style={styles.detalleAvatar}
      />
      <View style={styles.detalleWorkerInfo}>
        <Text style={styles.detalleNombre}>{trabajo.nombre} {trabajo.apellido}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#c87000" />
          <Text style={styles.rating}>{Number(trabajo.estrellas ?? 0).toFixed(2)}</Text>
          {trabajo.distancia && (
            <>
              <Text style={styles.ratingDot}>·</Text>
              <Ionicons name="location-outline" size={13} color="#0D47C7" />
              <Text style={styles.distanciaText}>{trabajo.distancia} km</Text>
            </>
          )}
        </View>
      </View>
    </View>

    <View style={styles.separador} />

    <View style={styles.infoGrid}>
      <View style={styles.infoCard}>
        <Ionicons name="construct-outline" size={16} color="#0D47C7" />
        <Text style={styles.infoLabel}>Servicio</Text>
        <Text style={styles.infoValue}>{trabajo.servicio_nombre ?? '-'}</Text>
      </View>
      <View style={styles.infoCard}>
        <Ionicons name="cash-outline" size={16} color="#0D47C7" />
        <Text style={styles.infoLabel}>Precio</Text>
        <Text style={styles.infoValue}>${trabajo.precio ?? '-'}</Text>
      </View>
      {trabajo.horario_requerido && (
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={16} color="#0D47C7" />
          <Text style={styles.infoLabel}>Horario inicio</Text>
          <Text style={styles.infoValue}>{trabajo.horario_requerido}</Text>
        </View>
      )}
      {trabajo.horario_finalizado && (
        <View style={styles.infoCard}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#0D47C7" />
          <Text style={styles.infoLabel}>Horario fin</Text>
          <Text style={styles.infoValue}>{trabajo.horario_finalizado}</Text>
        </View>
      )}
      {trabajo.fecha_iniciado && (
        <View style={[styles.infoCard, styles.infoCardWide]}>
          <Ionicons name="calendar-outline" size={16} color="#0D47C7" />
          <Text style={styles.infoLabel}>Fecha inicio</Text>
          <Text style={styles.infoValue}>
            {new Date(trabajo.fecha_iniciado).toLocaleDateString('es-AR')}
          </Text>
        </View>
      )}
      {trabajo.fijo !== undefined && (
        <View style={styles.infoCard}>
          <Ionicons name="pricetag-outline" size={16} color="#0D47C7" />
          <Text style={styles.infoLabel}>Tipo</Text>
          <Text style={styles.infoValue}>{trabajo.fijo ? 'Fijo' : 'Variable'}</Text>
        </View>
      )}
      {trabajo.emergencia !== undefined && (
        <View style={styles.infoCard}>
          <Ionicons name="flash-outline" size={16} color="#0D47C7" />
          <Text style={styles.infoLabel}>Emergencia</Text>
          <Text style={styles.infoValue}>{trabajo.emergencia ? 'Sí' : 'No'}</Text>
        </View>
      )}
    </View>

    <TouchableOpacity style={styles.chatButton} onPress={() => onChat(trabajo)} activeOpacity={0.85}>
      <Ionicons name="chatbox-outline" size={18} color="#fff" />
      <Text style={styles.chatText}>Chatear con el cliente</Text>
    </TouchableOpacity>
  </View>
);

export default function TrabajoActivoOverlayTrabajador({ visible, onClose, onChat, idTrabajador }) {
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);

  useEffect(() => {
    if (visible && idTrabajador) fetchTrabajos();
    if (!visible) {
      setTrabajos([]);
      setTrabajoSeleccionado(null);
    }
  }, [visible, idTrabajador]);

  const fetchTrabajos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/trabajador/trabajosActivos/${idTrabajador}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.trabajos ?? data.data ?? [];
      setTrabajos(lista);
      setTrabajoSeleccionado(lista[0] ?? null);
    } catch (e) {
      console.error('Error al cargar trabajos activos (trabajador):', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (trabajo) => {
    setTrabajoSeleccionado(prev => prev?.id === trabajo.id ? null : trabajo);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.header} onPress={onClose} activeOpacity={0.8}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="construct" size={13} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerLabel}>MIS TRABAJOS</Text>
                <Text style={styles.headerTitle}>
                  {loading ? '...' : `${trabajos.length} en proceso`}
                </Text>
              </View>
            </View>
            <View style={styles.closeCircle}>
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Cargando trabajos...</Text>
            </View>
          ) : trabajos.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="briefcase-outline" size={40} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyText}>No tenés trabajos en proceso</Text>
            </View>
          ) : (
            <ScrollView style={styles.lista} contentContainerStyle={styles.listaContent} showsVerticalScrollIndicator={false}>
              {trabajos.map((trabajo) => (
                <View key={trabajo.id}>
                  <TrabajoItem
                    trabajo={trabajo}
                    onSelect={handleSelect}
                    isSelected={trabajoSeleccionado?.id === trabajo.id}
                  />
                  {trabajoSeleccionado?.id === trabajo.id && (
                    <TrabajoDetalle trabajo={trabajo} onChat={onChat} />
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  container: { width: "92%", maxHeight: "85%", backgroundColor: "#0d2a6e", borderRadius: 20, overflow: "hidden" },
  header: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerLabel: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.6)", letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  closeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  centerBox: { paddingVertical: 40, justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "600", marginTop: 6 },
  lista: { maxHeight: 500 },
  listaContent: { paddingBottom: 8 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  itemSelected: { backgroundColor: "#1565D8" },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  itemAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  itemInfo: { flex: 1, gap: 3 },
  itemServicio: { fontSize: 14, fontWeight: "800", color: "#fff" },
  itemNombre: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  estadoBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  estadoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFD000" },
  estadoText: { color: "#FFD000", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  itemRight: { alignItems: "flex-end", gap: 6 },
  itemPrecio: { fontSize: 15, fontWeight: "900", color: "#fff" },
  detalle: { backgroundColor: "#e8f0fe", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  detalleWorkerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  detalleAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: "#1565D8" },
  detalleWorkerInfo: { flex: 1 },
  detalleNombre: { fontSize: 17, fontWeight: "800", color: "#0d2a6e", marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 13, fontWeight: "700", color: "#0d2a6e" },
  ratingDot: { color: "#0d2a6e", fontSize: 14 },
  distanciaText: { fontSize: 12, color: "#0d2a6e", fontWeight: "500" },
  separador: { height: 1, backgroundColor: "rgba(0,0,0,0.08)", marginBottom: 14 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  infoCard: { backgroundColor: "#c7d9ff", borderRadius: 12, padding: 10, minWidth: "47%", flex: 1, gap: 4 },
  infoCardWide: { minWidth: "100%" },
  infoLabel: { fontSize: 9, fontWeight: "700", color: "#0d2a6e", letterSpacing: 0.5, textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontWeight: "800", color: "#0d2a6e" },
  chatButton: { backgroundColor: "#1565D8", borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  chatText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});