import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MiniMapaRuta from "./MiniMapaRuta";
import SeguimientoTrabajo from "./SeguimientoTrabajo";
import useSeguimiento from "./useSeguimiento";
import { formatearEta } from "./Rutas";

const NAVY = "#0A1230";

/**
 * Tarjeta con mini mapa + ETA + botón "Ver distancia y ruta".
 * Se muestra SIEMPRE; si el trabajo no tiene coordenadas, avisa en vez de esconderse.
 *  - rol 'trabajador' → idUsuarioRol = idTrabajador
 *  - rol 'cliente'    → idUsuarioRol = idCliente
 *
 * `trabajo` tiene que traer id, latitud y longitud (el destino).
 *
 * El seguimiento a pantalla completa se abre en un Modal propio (no usa
 * navigation.navigate), así que NO hace falta registrar ninguna pantalla en el
 * navigator. `navigation` y `onAbrir` se aceptan por compatibilidad pero ya no
 * se usan: el overlay que contiene a esta tarjeta NO se cierra, el seguimiento
 * se abre encima.
 */
export default function SeguimientoMini({
  trabajo,
  rol,
  idUsuarioRol,
  activo = true,
  style,
}) {
  const [abierto, setAbierto] = useState(false);
  const esTrabajador = rol === "trabajador";

  // Mientras la pantalla completa está abierta, ella maneja el GPS / polling
  const seg = useSeguimiento({ trabajo, rol, idUsuarioRol, activo: activo && !abierto });
  const tieneDestino = !!seg.destino;

  let etiqueta;
  let texto;
  if (!tieneDestino) {
    etiqueta = "DISTANCIA Y RUTA";
    texto = "Este trabajo no tiene ubicación cargada";
  } else if (esTrabajador) {
    etiqueta = "LLEGÁS EN";
    if (seg.permisoDenegado) texto = "Activá el permiso de ubicación";
    else if (seg.llego) { etiqueta = "ESTÁS EN EL LUGAR"; texto = "¡Llegaste! Confirmá la llegada"; }
    else if (seg.etaMin != null) texto = `${formatearEta(seg.etaMin)} · ${seg.km.toFixed(1)} km${seg.aproximado ? " (aprox.)" : ""}`;
    else texto = "Buscando tu ubicación...";
  } else {
    etiqueta = "TU TRABAJADOR LLEGA EN";
    if (!seg.origen) texto = "Esperando la ubicación del trabajador...";
    else if (seg.sinSenal) { etiqueta = "SIN SEÑAL"; texto = "No recibimos su ubicación hace un rato"; }
    else if (seg.llego) { etiqueta = "TU TRABAJADOR"; texto = "Está llegando"; }
    else if (seg.etaMin != null) texto = `${formatearEta(seg.etaMin)} · ${seg.km.toFixed(1)} km${seg.aproximado ? " (aprox.)" : ""}`;
    else texto = "Calculando...";
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setAbierto(true)} style={[styles.card, style]}>
        {tieneDestino && (
          <View pointerEvents="none">
            <MiniMapaRuta
              origen={seg.origen}
              destino={seg.destino}
              puntos={seg.puntos}
              height={150}
              fit="siempre"
              style={styles.mapa}
            />
          </View>
        )}
        <View style={styles.footer}>
          <Ionicons name={tieneDestino ? "navigate" : "location-outline"} size={20} color="#FFD000" />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{etiqueta}</Text>
            <Text style={styles.texto} numberOfLines={2}>{texto}</Text>
          </View>
        </View>
        <View style={styles.boton}>
          <Ionicons name="map-outline" size={16} color="#0d2a6e" />
          <Text style={styles.botonTxt}>Ver distancia y ruta</Text>
        </View>
      </TouchableOpacity>

      {abierto && (
        <Modal visible animationType="slide" onRequestClose={() => setAbierto(false)}>
          <SeguimientoTrabajo
            trabajo={trabajo}
            rol={rol}
            idUsuarioRol={idUsuarioRol}
            onCerrar={() => setAbierto(false)}
          />
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: NAVY, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  mapa: { borderRadius: 0 },
  footer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, gap: 10 },
  label: { fontSize: 9, fontWeight: "800", letterSpacing: 1, color: "rgba(255,255,255,0.6)" },
  texto: { fontSize: 15, fontWeight: "800", color: "#fff", marginTop: 1 },
  boton: {
    marginHorizontal: 14, marginBottom: 12, backgroundColor: "#FFD000", borderRadius: 10,
    paddingVertical: 10, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
  },
  botonTxt: { color: "#0d2a6e", fontWeight: "800", fontSize: 13.5 },
});