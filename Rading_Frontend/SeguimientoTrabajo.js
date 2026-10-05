import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, SafeAreaView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MiniMapaRuta from "./MiniMapaRuta";
import useSeguimiento from "./useSeguimiento";
import { formatearEta } from "./Rutas";

const urlComoLlegar = (d) =>
  `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}&travelmode=driving`;

/**
 * Pantalla completa de seguimiento. Sirve para los dos roles y se puede usar:
 *  - dentro de un <Modal> (como hace SeguimientoMini): props { trabajo, rol, idUsuarioRol, onCerrar }
 *  - como pantalla de un Stack: route.params { trabajo, rol, idUsuarioRol } + navigation
 *
 * idUsuarioRol = idTrabajador (rol trabajador) o idCliente (rol cliente)
 */
export default function SeguimientoTrabajo(props) {
  const params = props.route?.params ?? {};
  const trabajo = props.trabajo ?? params.trabajo;
  const rol = props.rol ?? params.rol;
  const idUsuarioRol = props.idUsuarioRol ?? params.idUsuarioRol;
  const volver = () => (props.onCerrar ? props.onCerrar() : props.navigation?.goBack());

  const esTrabajador = rol === "trabajador";
  const seg = useSeguimiento({ trabajo, rol, idUsuarioRol, activo: true });

  let label;
  let eta;
  if (esTrabajador) {
    label = seg.llego ? "ESTÁS EN EL LUGAR" : "LLEGÁS EN";
    eta = seg.permisoDenegado ? "Activá el permiso de ubicación"
      : seg.llego ? "¡Llegaste!"
      : seg.etaMin != null ? formatearEta(seg.etaMin)
      : "Buscando tu ubicación...";
  } else {
    label = seg.sinSenal ? "SIN SEÑAL" : "TU TRABAJADOR LLEGA EN";
    eta = !seg.origen ? "Esperando ubicación..."
      : seg.sinSenal ? "Sin señal hace un rato"
      : seg.llego ? "Está llegando"
      : seg.etaMin != null ? formatearEta(seg.etaMin)
      : "Calculando...";
  }

  return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity onPress={volver} style={s.back} activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>

      {seg.destino ? (
        <MiniMapaRuta
          origen={seg.origen}
          destino={seg.destino}
          puntos={seg.puntos}
          fit="primera"
          style={{ flex: 1, borderRadius: 0 }}
        />
      ) : (
        <View style={s.sinDestino}>
          <Text style={s.sinDestinoTxt}>Este trabajo no tiene una ubicación cargada.</Text>
        </View>
      )}

      <View style={s.panel}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.eta}>{eta}</Text>
        {seg.km != null && (
          <Text style={s.dist}>
            {seg.km.toFixed(1)} km{seg.aproximado ? " (aproximado)" : ""}
          </Text>
        )}

        {esTrabajador && seg.destino && (
          <>
            <TouchableOpacity style={s.btn} onPress={() => Linking.openURL(urlComoLlegar(seg.destino))}>
              <Ionicons name="navigate" size={18} color="#0d2a6e" />
              <Text style={s.btnText}>Abrir navegación</Text>
            </TouchableOpacity>
            <Text style={s.nota}>
              Mantené esta pantalla abierta: si salís de la app, el cliente deja de verte en el mapa.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A1230" },
  back: {
    position: "absolute", top: Platform.OS === "web" ? 16 : 50, left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(10,18,48,0.75)", alignItems: "center", justifyContent: "center",
  },
  sinDestino: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  sinDestinoTxt: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", textAlign: "center" },
  panel: { backgroundColor: "#0A1230", padding: 20, paddingBottom: 30 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "rgba(255,255,255,0.6)" },
  eta: { fontSize: 30, fontWeight: "900", color: "#fff", marginTop: 2 },
  dist: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  btn: {
    marginTop: 16, backgroundColor: "#FFD000", borderRadius: 12, paddingVertical: 13,
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
  },
  btnText: { color: "#0d2a6e", fontWeight: "800", fontSize: 14 },
  nota: { marginTop: 10, fontSize: 11.5, fontWeight: "500", color: "rgba(255,255,255,0.55)", textAlign: "center" },
});