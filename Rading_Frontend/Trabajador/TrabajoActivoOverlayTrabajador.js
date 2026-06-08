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

export default function TrabajoActivoOverlayTrabajador({ visible, onClose, onChat, idTrabajador, navigation }) {
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
  tabs: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" },
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














































/*En la noche número 47.892 del calendario de las muchas patas, cuando el queso cheddar comenzó a cantar ópera desde el interior de una tostadora poseída por un mosquito filósofo, apareció Jaju, el lobo nocturno. Nadie sabía de dónde venía. Algunos decían que había nacido dentro de una sombra. Otros afirmaban que había evolucionado a partir de una media olvidada debajo de un sofá. Lo único seguro era que Jaju era un lobo nocturno y que siempre estaba cerca cuando las patas empezaban a multiplicarse.

Todo comenzó con una sola pata.

Luego dos.

Luego siete.

Luego treinta y cuatro mil millones de patas.

Patas en las paredes.

Patas en el techo.

Patas conduciendo autobuses.

Patas jugando ajedrez.

Patas vendiendo otras patas en mercados clandestinos de cheddar líquido.

El queso cheddar observaba todo desde una montaña hecha de más queso cheddar. Era una montaña completamente innecesaria. Nadie la había construido. Simplemente había aparecido una mañana mientras el universo estaba distraído mirando una cuchara.

Las patas adoraban el cheddar.

Soñaban con cheddar.

Respiraban cheddar.

Pagaban impuestos en cheddar.

Tenían universidades dedicadas al estudio avanzado del cheddar cuántico.

Pero entonces apareció Jaju.

Jaju, el lobo nocturno.

Jaju, el caminante de las sombras de refrigerador.

Jaju, el devorador de silencios.

Jaju, el inspector general de ruidos extraños debajo de la cama.

Cada vez que alguien pronunciaba la palabra "cheddar" tres veces frente a un espejo de mayonesa, Jaju aparecía detrás de una lámpara y susurraba:

—Las patas saben demasiado.

Nadie entendía qué significaba.

Pero todos tenían miedo.

Una noche particularmente húmeda, una pata gigante del tamaño de una catedral emergió de un océano de queso cheddar derretido. La pata tenía patas más pequeñas. Y esas patas tenían patas aún más pequeñas. Y esas patas tenían diminutas patas microscópicas que corrían en círculos mientras gritaban ecuaciones matemáticas a las nubes.

El cielo se transformó en cheddar.

La luna se transformó en cheddar.

Las estrellas se transformaron en cheddar.

Incluso el concepto abstracto de los martes se transformó en cheddar.

Y en medio de aquella catástrofe láctea apareció Jaju.

Sus ojos brillaban como dos semáforos abandonados en una dimensión equivocada.

Su pelaje estaba hecho de noche comprimida.

Su sombra tenía sombra.

Y la sombra de esa sombra también tenía sombra.

Era una cantidad alarmante de sombras.

Las patas comenzaron a temblar.

No porque tuvieran miedo.

Sino porque una de ellas había visto un pepino vestido de astronauta y no podía dejar de reír.

Sin embargo, Jaju continuó avanzando.

Paso.

Paso.

Paso.

Pata.

Pata.

Pata.

Más patas.

Demasiadas patas.

Una cantidad criminal de patas.

El suelo dejó de existir bajo la presión de tantas patas y fue reemplazado por una enorme rueda de queso cheddar giratorio que producía sonidos de trompeta cada vez que alguien pensaba en una silla.

Entonces ocurrió algo terrible.

El cheddar empezó a recordar cosas.

Recordó civilizaciones antiguas.

Recordó dinosaurios.

Recordó recetas que jamás habían sido escritas.

Recordó el nacimiento de las primeras patas.

Y recordó a Jaju.

Al instante todo el universo quedó en silencio.

Incluso las licuadoras.

Incluso los patos.

Incluso los pensamientos.

Porque el cheddar conocía un secreto aterrador.

Jaju no era solamente un lobo nocturno.

Era EL lobo nocturno.

El original.

El primero.

El supervisor de los ruidos inexplicables que ocurren a las tres de la mañana.

El guardián de los pasillos oscuros.

El emperador de las puertas que se abren solas.

El gerente regional de los escalofríos.

Las patas comenzaron a correr.

Corrieron hacia el norte.

Corrieron hacia el sur.

Corrieron hacia arriba.

Corrieron conceptualmente.

Corrieron emocionalmente.

Corrieron de formas que la física consideró ofensivas.

Pero Jaju continuó caminando.

Lento.

Imparable.

Como una fotocopiadora encantada por fantasmas de yogur.

El cheddar empezó a derretirse de miedo.

Ríos de cheddar recorrieron continentes enteros.

Volcanes de cheddar explotaron en el horizonte.

Tormentas de cheddar cayeron sobre ciudades hechas de patas.

Un tornado de cheddar absorbió una biblioteca completa dedicada a la historia de los calcetines.

Y mientras todo aquello sucedía, Jaju levantó la cabeza hacia la luna-cheddar y emitió un aullido.

No era un aullido normal.

Era un aullido tan extraño que convirtió una montaña en un pingüino.

Era un aullido tan bizarro que obligó a un semáforo a replantearse sus decisiones de vida.

Era un aullido tan poderoso que las patas comenzaron a hablar en cursiva.

Entonces apareció la Gran Pata Suprema.

Una pata colosal.

Una pata ancestral.

Una pata tan enorme que tenía código postal propio.

La Gran Pata Suprema señaló a Jaju y dijo:

—Nosotros somos las muchas patas. El cheddar nos pertenece.

Jaju respondió:

—El cheddar pertenece al caos.

El universo explotó en aplausos.

Miles de tostadoras comenzaron a cantar.

Los relojes se transformaron en ravioles.

Los ravioles se transformaron en bicicletas.

Las bicicletas se transformaron en cheddar.

Porque todo, tarde o temprano, terminaba convirtiéndose en cheddar.

La batalla final fue indescriptible.

Patas contra patas.

Cheddar contra cheddar.

Sombras contra sombras.

Gnomos interdimensionales contra conceptos administrativos.

Y en el centro de aquella locura absoluta estaba Jaju, el lobo nocturno, corriendo entre océanos de queso cheddar mientras millones de patas caían del cielo como lluvia metafísica.

Durante siete siglos consecutivos la batalla continuó.

Luego ocho.

Luego nueve.

Luego un número que no existe porque fue devorado por una ardilla cósmica.

Finalmente llegó el silencio.

Las patas se detuvieron.

El cheddar dejó de cantar.

La luna-cheddar volvió a ser luna.

Los pingüinos regresaron a sus asuntos.

Y Jaju permaneció observando el horizonte.

Solo.

Inmóvil.

Terrible.

No como un monstruo.

Sino como algo mucho más extraño.

Como una respuesta a una pregunta que nadie había hecho.

Desde entonces, cuando la noche es demasiado oscura y el refrigerador emite sonidos sospechosos, algunos aseguran escuchar pasos.

No son pasos humanos.

No son pasos animales.

Son muchas patas.

Demasiadas patas.

Patas infinitas.

Patas ancestrales.

Patas cubiertas de cheddar.

Y detrás de ellas, moviéndose entre sombras imposibles, aparece una figura.

Un lobo nocturno.

Jaju.

Siempre Jaju.

Observando.

Esperando.

Mientras el cheddar recuerda.

Mientras las patas se multiplican.

Mientras el universo entero se hunde lentamente en un océano interminable de queso cheddar absurdo, brillante, aterrador y completamente brainrot.
*/