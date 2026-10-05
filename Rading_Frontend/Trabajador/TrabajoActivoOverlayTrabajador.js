import React, { useState, useEffect, useMemo } from "react";
import {
  Modal, View, Text, Image, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, TextInput,
  Pressable, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from '../configS';
import ConfirmarLlegadaTr from './ConfirmarLlegadaTr';
import ConfirmarTrabajoTr from './ConfirmarTrabajoTr';
import SeguimientoMini from "../SeguimientoMini";
import { useTheme } from "../ThemeContext";

const AVATAR_CLIENTE = (nombre = '', apellido = '') =>
  `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=0D47C7&color=fff&size=150`;

const MOTIVOS_CANCELACION = [
  "No pude llegar a tiempo",
  "El cliente no está / no responde",
  "Problema de seguridad en el lugar",
  "El trabajo no era lo acordado",
  "Otro",
];

const TrabajoItem = ({ trabajo, onSelect, isSelected, styles }) => (
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
          <Text style={styles.estadoText}>
            {trabajo.trabajo_iniciado_en ? 'EN PROCESO' : 'ESPERANDO LLEGADA'}
          </Text>
        </View>
      </View>
    </View>
    <View style={styles.itemRight}>
      <Text style={styles.itemPrecio}>${trabajo.precio ?? '-'}</Text>
      <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={18} color="#fff" />
    </View>
  </TouchableOpacity>
);

const TrabajoDetalle = ({ trabajo, onChat, onIniciar, onFinalizar, onCancelar, onClose, idTrabajador, styles, navigation }) => {
  const yaLlego = !!trabajo.trabajo_iniciado_en;
  const yaTermino = trabajo.estado === 'TERMINADO';

  return (
    <View style={styles.detalle}>
      <View style={styles.detalleWorkerRow}>
        <Image
          source={{ uri: AVATAR_CLIENTE(trabajo.nombre, trabajo.apellido) }}
          style={styles.detalleAvatar}
        />
        <View style={styles.detalleWorkerInfo}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PerfilClienteParaTrabajador', { idCliente: trabajo.idCliente })}
            activeOpacity={0.7}
          >
            <Text style={styles.detalleNombre}>{trabajo.nombre} {trabajo.apellido}</Text>
          </TouchableOpacity>
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

      {/* Mini mapa con ruta y ETA hasta el domicilio. Solo mientras va en
          camino: desaparece cuando se confirma la llegada. */}
      {!yaLlego && !yaTermino && (
        <SeguimientoMini
          trabajo={trabajo}
          rol="trabajador"
          idUsuarioRol={idTrabajador}
          navigation={navigation}
          onAbrir={onClose}
          activo={!yaLlego}
        />
      )}

      {/* Acción principal según el estado del trabajo */}
      {!yaLlego ? (
        <TouchableOpacity
          style={styles.llegadaButton}
          onPress={() => onIniciar(trabajo)}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.llegadaText}>Confirmar llegada</Text>
        </TouchableOpacity>
      ) : !yaTermino ? (
        <TouchableOpacity
          style={styles.finalizarButton}
          onPress={() => onFinalizar(trabajo)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text style={styles.finalizarText}>Finalizar trabajo</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.chatButton} onPress={() => onChat(trabajo)} activeOpacity={0.85}>
        <Ionicons name="chatbox-outline" size={18} color="#fff" />
        <Text style={styles.chatText}>Chatear con el cliente</Text>
      </TouchableOpacity>

      {/* Cancelar: disponible mientras el trabajo esté en proceso (con o
          sin llegada confirmada), no una vez terminado. */}
      {!yaTermino && (
        <TouchableOpacity
          style={styles.cancelarButton}
          onPress={() => onCancelar(trabajo)}
          activeOpacity={0.85}
        >
          <Ionicons name="close-circle-outline" size={17} color="#E4483C" />
          <Text style={styles.cancelarText}>Cancelar trabajo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Modal para pedir el motivo antes de cancelar. Vive en este archivo
 * porque solo se usa desde acá; si en algún momento se necesita también
 * en TrabajoActivoTrabajador (la barra flotante), conviene extraerlo a
 * un componente compartido en vez de duplicarlo.
 */
const CancelarTrabajoModal = ({ visible, onClose, onConfirm, styles, isDark, colors }) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (visible) {
      setMotivoSeleccionado(null);
      setMotivoTexto("");
      setEnviando(false);
    }
  }, [visible]);

  const motivoFinal = motivoSeleccionado === "Otro" ? motivoTexto.trim() : motivoSeleccionado;
  const puedeConfirmar = !!motivoFinal && !enviando;

  const confirmar = async () => {
    if (!puedeConfirmar) return;
    try {
      setEnviando(true);
      await onConfirm(motivoFinal);
    } catch (err) {
      console.error('Error cancelando trabajo:', err);
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.cancelOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={enviando ? undefined : onClose} />

        <View style={styles.cancelCard}>
          <Text style={styles.cancelTitulo}>Cancelar trabajo</Text>
          <Text style={styles.cancelSubtitulo}>Contanos por qué — se lo mostramos al cliente.</Text>

          <View style={styles.cancelMotivos}>
            {MOTIVOS_CANCELACION.map((m) => {
              const activo = motivoSeleccionado === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.cancelMotivoItem, activo && styles.cancelMotivoItemActivo]}
                  onPress={() => setMotivoSeleccionado(m)}
                >
                  <View style={[styles.cancelRadio, activo && styles.cancelRadioActivo]}>
                    {activo && <View style={styles.cancelRadioDot} />}
                  </View>
                  <Text style={[styles.cancelMotivoTexto, activo && styles.cancelMotivoTextoActivo]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {motivoSeleccionado === "Otro" && (
            <TextInput
              style={styles.cancelInput}
              placeholder="Escribí el motivo..."
              placeholderTextColor={colors.textSecondary ?? "#8A8FA3"}
              value={motivoTexto}
              onChangeText={setMotivoTexto}
              multiline
              maxLength={200}
            />
          )}

          <View style={styles.cancelBtnRow}>
            <TouchableOpacity style={styles.cancelBtnSecundario} onPress={onClose} disabled={enviando}>
              <Text style={styles.cancelBtnSecundarioTexto}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtnPeligro, !puedeConfirmar && styles.cancelBtnDeshabilitado]}
              onPress={confirmar}
              disabled={!puedeConfirmar}
            >
              <Text style={styles.cancelBtnPeligroTexto}>
                {enviando ? "Cancelando..." : "Confirmar cancelación"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Válido solo si es un número entero positivo real (cubre null, undefined,
// NaN, y también el caso "null" como string que rompía la query en Postgres).
const esIdValido = (id) => {
  const n = Number(id);
  return id !== null && id !== undefined && Number.isInteger(n) && n > 0;
};

export default function TrabajoActivoOverlayTrabajador({ visible, onClose, onChat, idTrabajador, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);

  // Controla qué modal de confirmación (llegada / fin) está abierto y sobre qué trabajo
  const [confirmacion, setConfirmacion] = useState(null); // { tipo: 'llegada' | 'fin', trabajo }

  // Trabajo sobre el que se abrió el modal de cancelación (null = cerrado)
  const [trabajoACancelar, setTrabajoACancelar] = useState(null);

  useEffect(() => {
    if (visible && esIdValido(idTrabajador)) {
      fetchTrabajos();
    }
    if (!visible) {
      setTrabajos([]);
      setTrabajoSeleccionado(null);
      setConfirmacion(null);
      setTrabajoACancelar(null);
    }
  }, [visible, idTrabajador]);

  const fetchTrabajos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/trabajador/trabajosActivos/${idTrabajador}`);
      if (!res.ok) throw new Error(`Respuesta no OK (${res.status}) al pedir trabajos activos`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.trabajos ?? data.data ?? [];
      setTrabajos(lista);
      setTrabajoSeleccionado(prev => lista.find(t => t.id === prev?.id) ?? lista[0] ?? null);
    } catch (e) {
      console.error('Error al cargar trabajos activos (trabajador):', e);
      setTrabajos([]);
      setTrabajoSeleccionado(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (trabajo) => {
    setTrabajoSeleccionado(prev => prev?.id === trabajo.id ? null : trabajo);
  };

  // Al confirmar llegada o fin, refrescamos la lista para que el detalle
  // muestre el siguiente paso (o desaparezca si el trabajo ya terminó).
  const handleConfirmacionOk = () => {
    fetchTrabajos();
  };

  const cerrarConfirmacion = () => setConfirmacion(null);

  const handleCancelarConfirmado = async (motivo) => {
    const idTrabajo = trabajoACancelar.id;
    const res = await fetch(`${API_URL}/trabajador/${idTrabajo}/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idTrabajador, motivo }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'No se pudo cancelar el trabajo');
    }
    setTrabajoACancelar(null);
    await fetchTrabajos();
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

          {/* TABS */}
          <View style={styles.tabs}>
            <View style={styles.tabActive}>
              <Text style={styles.tabTextActive}>En proceso</Text>
            </View>
            <TouchableOpacity
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                navigation.navigate('VerTrabajosRealizados', { idTrabajador });
              }}
            >
              <Text style={styles.tabBtnText}>Realizados</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFD000" />
            </TouchableOpacity>
          </View>

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
                    styles={styles}
                  />
                  {trabajoSeleccionado?.id === trabajo.id && (
                    <TrabajoDetalle
                      trabajo={trabajo}
                      onChat={onChat}
                      onIniciar={(t) => setConfirmacion({ tipo: 'llegada', trabajo: t })}
                      onFinalizar={(t) => setConfirmacion({ tipo: 'fin', trabajo: t })}
                      onCancelar={(t) => setTrabajoACancelar(t)}
                      onClose={onClose}
                      idTrabajador={idTrabajador}
                      styles={styles}
                      navigation={navigation}
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Modal de confirmación de llegada / fin, sobre el overlay de la lista */}
      {confirmacion && (
        <Modal visible transparent animationType="slide">
          {confirmacion.tipo === 'llegada' ? (
            <ConfirmarLlegadaTr
              idTrabajo={confirmacion.trabajo.id}
              service={confirmacion.trabajo.servicio_nombre}
              clientName={`${confirmacion.trabajo.nombre} ${confirmacion.trabajo.apellido}`}
              address={confirmacion.trabajo.direccion ?? 'Dirección no disponible'}
              onConfirm={handleConfirmacionOk}
              onClose={cerrarConfirmacion}
            />
          ) : (
            <ConfirmarTrabajoTr
              idTrabajo={confirmacion.trabajo.id}
              service={confirmacion.trabajo.servicio_nombre}
              clientName={`${confirmacion.trabajo.nombre} ${confirmacion.trabajo.apellido}`}
              durationMinutes={confirmacion.trabajo.duracionMinutos}
              onConfirm={handleConfirmacionOk}
              onClose={cerrarConfirmacion}
            />
          )}
        </Modal>
      )}

      {/* Modal de motivo de cancelación. Se monta/desmonta del todo (en vez
          de solo alternar `visible`) porque el Modal de RN Web a veces no
          limpia bien su overlay si el componente sigue vivo por detrás —
          eso era lo que hacía que en compu no se viera cerrar del todo. */}
      {trabajoACancelar && (
        <CancelarTrabajoModal
          visible
          onClose={() => setTrabajoACancelar(null)}
          onConfirm={handleCancelarConfirmado}
          styles={styles}
          isDark={isDark}
          colors={colors}
        />
      )}
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: isDark ? colors.overlay : "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  container: { width: "92%", maxHeight: "85%", backgroundColor: isDark ? colors.surface : "#0d2a6e", borderRadius: 20, overflow: "hidden" },
  header: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: isDark ? colors.divider : "rgba(255,255,255,0.15)" },
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
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? colors.divider : "rgba(255,255,255,0.1)" },
  itemSelected: { backgroundColor: "#1565D8" },
  itemLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  itemAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  itemInfo: { flex: 1, gap: 3 },
  tabs: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? colors.divider : "rgba(255,255,255,0.15)" },
  tabActive: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20 },
  tabTextActive: { color: "#fff", fontSize: 13, fontWeight: "800" },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1.5, borderColor: "#FFD000", borderRadius: 20 },
  tabBtnText: { color: "#FFD000", fontSize: 13, fontWeight: "700" },
  itemServicio: { fontSize: 14, fontWeight: "800", color: "#fff" },
  itemNombre: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  estadoBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  estadoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFD000" },
  estadoText: { color: "#FFD000", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  itemRight: { alignItems: "flex-end", gap: 6 },
  itemPrecio: { fontSize: 15, fontWeight: "900", color: "#fff" },
  detalle: { backgroundColor: isDark ? colors.surfaceVariant : "#e8f0fe", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? colors.divider : "rgba(0,0,0,0.08)" },
  detalleWorkerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  detalleAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: "#1565D8" },
  detalleWorkerInfo: { flex: 1 },
  detalleNombre: { fontSize: 17, fontWeight: "800", color: isDark ? colors.text : "#0d2a6e", marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 13, fontWeight: "700", color: isDark ? colors.text : "#0d2a6e" },
  ratingDot: { color: isDark ? colors.text : "#0d2a6e", fontSize: 14 },
  distanciaText: { fontSize: 12, color: isDark ? colors.text : "#0d2a6e", fontWeight: "500" },
  separador: { height: 1, backgroundColor: isDark ? colors.divider : "rgba(0,0,0,0.08)", marginBottom: 14 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  infoCard: { backgroundColor: isDark ? colors.surfaceVariant : "#c7d9ff", borderRadius: 12, padding: 10, minWidth: "47%", flex: 1, gap: 4 },
  infoCardWide: { minWidth: "100%" },
  infoLabel: { fontSize: 9, fontWeight: "700", color: isDark ? colors.text : "#0d2a6e", letterSpacing: 0.5, textTransform: "uppercase" },
  infoValue: { fontSize: 14, fontWeight: "800", color: isDark ? colors.text : "#0d2a6e" },
  chatButton: { backgroundColor: "#1565D8", borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  chatText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  llegadaButton: { backgroundColor: "#FFD000", borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
  llegadaText: { color: "#0d2a6e", fontSize: 14, fontWeight: "800" },
  finalizarButton: { backgroundColor: "#1e9e5a", borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
  finalizarText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  cancelarButton: { marginTop: 10, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#E4483C" },
  cancelarText: { color: "#E4483C", fontSize: 13.5, fontWeight: "800" },

  /* Modal de motivo de cancelación.
     En mobile se comporta como bottom sheet (pegado abajo, solo esquinas
     superiores redondeadas). En web eso queda pegado al borde real del
     navegador y no al del teléfono simulado, así que ahí lo centramos
     como un diálogo normal. */
  cancelOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,18,48,0.55)",
    justifyContent: Platform.OS === "web" ? "center" : "flex-end",
    alignItems: Platform.OS === "web" ? "center" : "stretch",
    padding: Platform.OS === "web" ? 20 : 0,
  },
  cancelCard: {
    backgroundColor: isDark ? colors.surface : "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === "web" ? 24 : 0,
    borderBottomRightRadius: Platform.OS === "web" ? 24 : 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
    width: Platform.OS === "web" ? "100%" : undefined,
    maxWidth: Platform.OS === "web" ? 420 : undefined,
  },
  cancelTitulo: { fontSize: 18, fontWeight: "800", color: isDark ? colors.text : "#0d2a6e" },
  cancelSubtitulo: { fontSize: 13, fontWeight: "500", color: colors.textSecondary ?? "#8A8FA3", marginTop: 4, marginBottom: 16 },
  cancelMotivos: { gap: 8 },
  cancelMotivoItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(10,18,48,0.08)" },
  cancelMotivoItemActivo: { borderColor: "#1565D8", backgroundColor: isDark ? "rgba(21,101,216,0.14)" : "rgba(21,101,216,0.06)" },
  cancelRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(10,18,48,0.25)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  cancelRadioActivo: { borderColor: "#1565D8" },
  cancelRadioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#1565D8" },
  cancelMotivoTexto: { fontSize: 13.5, fontWeight: "600", color: isDark ? "rgba(255,255,255,0.85)" : "#0d2a6e", flexShrink: 1 },
  cancelMotivoTextoActivo: { color: isDark ? "#fff" : "#0D47C7" },
  cancelInput: { marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(10,18,48,0.08)", paddingHorizontal: 12, paddingVertical: 10, minHeight: 70, textAlignVertical: "top", fontSize: 13.5, color: isDark ? colors.text : "#0d2a6e" },
  cancelBtnRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtnSecundario: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(10,18,48,0.06)" },
  cancelBtnSecundarioTexto: { fontSize: 14, fontWeight: "700", color: isDark ? colors.text : "#0d2a6e" },
  cancelBtnPeligro: { flex: 1.4, paddingVertical: 13, borderRadius: 14, alignItems: "center", backgroundColor: "#E4483C" },
  cancelBtnDeshabilitado: { opacity: 0.45 },
  cancelBtnPeligroTexto: { fontSize: 14, fontWeight: "800", color: "#fff" },
});