import React, { useState, useEffect } from "react";


import {
  Modal, View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from '../configS';
 
const TrabajoItem = ({ trabajo, onSelect, isSelected }) => (
  <TouchableOpacity
    style={[styles.item, isSelected && styles.itemSelected]}
    onPress={() => onSelect(trabajo)}
    activeOpacity={0.75}
  >
    <View style={styles.itemLeft}>
      <Image
        source={{ uri: trabajo.foto ?? 'https://i.pravatar.cc/150?img=11' }}
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
      <Text style={styles.itemPrecio}>
        ${trabajo.precio ?? '-'}
      </Text>
      <Ionicons
        name={isSelected ? "chevron-up" : "chevron-down"}
        size={18}
        color="#7a5c00"
      />
    </View>
  </TouchableOpacity>
);
 
const TrabajoDetalle = ({ trabajo, onChat }) => (
  <View style={styles.detalle}>
 
    {/* Trabajador */}
    <View style={styles.detalleWorkerRow}>
      <Image
        source={{ uri: trabajo.foto ?? 'https://i.pravatar.cc/150?img=11' }}
        style={styles.detalleAvatar}
      />
      <View style={styles.detalleWorkerInfo}>
        <Text style={styles.detalleNombre}>
          {trabajo.nombre} {trabajo.apellido}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#c87000" />
          <Text style={styles.rating}>
            {Number(trabajo.estrellas ?? 0).toFixed(2)}
          </Text>
          {trabajo.distancia && (
            <>
              <Text style={styles.ratingDot}>·</Text>
              <Ionicons name="location-outline" size={13} color="#7a5c00" />
              <Text style={styles.distanciaText}>{trabajo.distancia} km</Text>
            </>
          )}
        </View>
      </View>
    </View>
 
    {/* Separador */}
    <View style={styles.separador} />
 
    {/* Info grid */}
    <View style={styles.infoGrid}>
 
      <View style={styles.infoCard}>
        <Ionicons name="construct-outline" size={16} color="#c87000" />
        <Text style={styles.infoLabel}>Servicio</Text>
        <Text style={styles.infoValue}>{trabajo.servicio_nombre ?? '-'}</Text>
      </View>
 
      <View style={styles.infoCard}>
        <Ionicons name="cash-outline" size={16} color="#c87000" />
        <Text style={styles.infoLabel}>Precio</Text>
        <Text style={styles.infoValue}>${trabajo.precio ?? '-'}</Text>
      </View>
 
      {trabajo.horario_requerido && (
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={16} color="#c87000" />
          <Text style={styles.infoLabel}>Horario inicio</Text>
          <Text style={styles.infoValue}>{trabajo.horario_requerido}</Text>
        </View>
      )}
 
      {trabajo.horario_finalizado && (
        <View style={styles.infoCard}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#c87000" />
          <Text style={styles.infoLabel}>Horario fin</Text>
          <Text style={styles.infoValue}>{trabajo.horario_finalizado}</Text>
        </View>
      )}
 
      {trabajo.fecha_iniciado && (
        <View style={[styles.infoCard, styles.infoCardWide]}>
          <Ionicons name="calendar-outline" size={16} color="#c87000" />
          <Text style={styles.infoLabel}>Fecha inicio</Text>
          <Text style={styles.infoValue}>
            {new Date(trabajo.fecha_iniciado).toLocaleDateString('es-AR')}
          </Text>
        </View>
      )}
 
      {trabajo.fijo !== undefined && (
        <View style={styles.infoCard}>
          <Ionicons name="pricetag-outline" size={16} color="#c87000" />
          <Text style={styles.infoLabel}>Tipo</Text>
          <Text style={styles.infoValue}>{trabajo.fijo ? 'Fijo' : 'Variable'}</Text>
        </View>
      )}
 
    </View>
 
    {/* Botón chat */}
    <TouchableOpacity style={styles.chatButton} onPress={() => onChat(trabajo)} activeOpacity={0.85}>
      <Ionicons name="chatbox-outline" size={18} color="#FFF" />
      <Text style={styles.chatText}>Chatear con el trabajador</Text>
    </TouchableOpacity>
 
  </View>
);
 
export default function OfertaRecibidaOverlayCliente({
  visible,
  onClose,
  onChat,
  idCliente,
  usuario,
  navigation
}) { 
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);

  // Ofertas pendientes agrupadas por trabajo "abierto"
  const [ofertasPendientes, setOfertasPendientes] = useState([]);
  const [loadingOfertas, setLoadingOfertas] = useState(false);
  const [errorOfertas, setErrorOfertas] = useState(false);
 
  useEffect(() => {
    if (visible && idCliente) {
      fetchTrabajos();
      fetchOfertasPendientes();
    }
  }, [visible, idCliente]);
 
  const fetchTrabajos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/cliente/trabajosActivos/${idCliente}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.trabajos ?? data.data ?? [];
      setTrabajos(lista);
      setTrabajoSeleccionado(lista[0] ?? null);
    } catch (e) {
      console.error('Error al cargar trabajos activos:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfertasPendientes = async () => {
    try {
      setLoadingOfertas(true);
      setErrorOfertas(false);
      const url = `${API_URL}/cliente/ofertas/pendientes/${idCliente}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setOfertasPendientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar ofertas pendientes:', e);
      setErrorOfertas(true);
      setOfertasPendientes([]);
    } finally {
      setLoadingOfertas(false);
    }
  };
 
  const handleSelect = (trabajo) => {
    setTrabajoSeleccionado(prev => prev?.id === trabajo.id ? null : trabajo);
  };

  // Total de ofertas sumando todos los trabajos "abiertos"
  const totalOfertas = ofertasPendientes.reduce(
    (acc, o) => acc + Number(o.cantidadOfertas || 0),
    0
  );

  const irAOfertas = () => {
    // 👇 evita navegar mientras todavía está cargando (race condition fix)
    if (loadingOfertas) return;

    onClose?.();

    if (ofertasPendientes.length > 0) {
      // Si hay más de un trabajo esperando ofertas, por ahora abrimos
      // el primero (el más reciente); más adelante se puede armar
      // una pantalla intermedia para elegir cuál ver.
      const primero = ofertasPendientes[0];
      navigation?.navigate('RecibirOfertasScreen', {
        idTrabajo: primero.idTrabajo,
        servicioNombre: primero.servicio_nombre,
        usuario,
      });
    } else if (errorOfertas) {
      Alert.alert('Error', 'No se pudieron cargar tus ofertas. Probá de nuevo en un momento.');
    } else {
      Alert.alert('Sin ofertas', 'Todavía no tenés ofertas pendientes de trabajadores.');
    }
  };
 
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container} >
 
          {/* Header: fila 1 = título + cerrar (tocar afuera del título ya
              cierra), fila 2 = acciones (Ofertas / Recientes), separada
              del título para que no queden "pegadas". */}
          <View style={styles.header}>

            <TouchableOpacity
              style={styles.headerTop}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="construct" size={13} color="#7a5c00" />
                </View>

                <View>
                  <Text style={styles.headerLabel}>MIS TRABAJOS</Text>
                  <Text style={styles.headerTitle}>
                    {loading ? '...' : `${trabajos.length} en proceso`}
                  </Text>
                </View>
              </View>

              <View style={styles.closeCircle}>
                <Ionicons name="chevron-down" size={20} color="#7a5c00" />
              </View>
            </TouchableOpacity>

            {/* Fila de acciones, separada del título */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.recientesButton}
                onPress={() => {
                  onClose?.();
                  navigation?.navigate('RecienteClientes', { usuario });
                }}
              >
                <Ionicons name="time-outline" size={13} color="#3a2c00" />
                <Text style={styles.recientesText}>Recientes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ofertasButton, loadingOfertas && styles.ofertasButtonDisabled]}
                onPress={irAOfertas}
                disabled={loadingOfertas}
              >
                <Ionicons name="pricetags-outline" size={13} color="#FFF" />
                <Text style={styles.ofertasText}>
                  {loadingOfertas ? 'Cargando...' : 'Ver ofertas'}
                </Text>
                {!loadingOfertas && (totalOfertas > 0 || errorOfertas) && (
                  <View style={styles.ofertasBadge}>
                    <Text style={styles.ofertasBadgeText}>
                      {errorOfertas ? '!' : totalOfertas}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

          </View>
 
          {/* Contenido */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#c87000" />
              <Text style={styles.loadingText}>Cargando trabajos...</Text>
            </View>
          ) : trabajos.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="briefcase-outline" size={40} color="#D8AF3A" />
              <Text style={styles.emptyText}>No tenés trabajos en proceso</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.lista}
              contentContainerStyle={styles.listaContent}
              showsVerticalScrollIndicator={false}
            >
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "#FFD000",
    borderRadius: 20,
    overflow: "hidden",
  },
 
  // Header (ahora envuelve 2 filas: título y acciones)
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#7a5c00",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#3a2c00",
  },
  closeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Fila de acciones (Recientes / Ofertas), separada del título de arriba
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
 
  // Loading / Empty
  centerBox: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#7a5c00",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    color: "#7a5c00",
    fontWeight: "600",
    marginTop: 6,
  },
 
  // Lista
  lista: { maxHeight: 500 },
  listaContent: { paddingBottom: 8 },
 
  // Item colapsado
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  itemSelected: {
    backgroundColor: "#FFC200",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  itemAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.15)",
  },
  itemInfo: { flex: 1, gap: 3 },
  itemServicio: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3a2c00",
  },
  itemNombre: {
    fontSize: 12,
    color: "#7a5c00",
    fontWeight: "500",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  estadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D47C7",
  },
  estadoText: {
    color: "#0D47C7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  itemPrecio: {
    fontSize: 15,
    fontWeight: "900",
    color: "#3a2c00",
  },
 
  // Detalle expandido
  detalle: {
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  detalleWorkerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  detalleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#FFD000",
  },
  detalleWorkerInfo: { flex: 1 },
  detalleNombre: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3a2c00",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3a2c00",
  },
  ratingDot: {
    color: "#7a5c00",
    fontSize: 14,
  },
  distanciaText: {
    fontSize: 12,
    color: "#7a5c00",
    fontWeight: "500",
  },
 
  separador: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: 14,
  },
 
  // Info grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#FFD000",
    borderRadius: 12,
    padding: 10,
    minWidth: "47%",
    flex: 1,
    gap: 4,
  },
  infoCardWide: {
    minWidth: "100%",
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#7a5c00",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3a2c00",
  },
 
  // Chat button
  chatButton: {
    backgroundColor: "#0D47C7",
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chatText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // Botón "Recientes" (fila de acciones)
  recientesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  recientesText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3a2c00",
  },

  // Botón "Ver ofertas" + badge (destacado en azul para diferenciarlo
  // claramente de "Recientes" y darle más peso visual)
  ofertasButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0D47C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ofertasButtonDisabled: {
    opacity: 0.6,
  },
  ofertasText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
  },
  ofertasBadge: {
    backgroundColor: "#FFF",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  ofertasBadgeText: {
    color: "#0D47C7",
    fontSize: 11,
    fontWeight: "900",
  },
});