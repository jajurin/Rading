import { useEffect, useMemo, useRef } from "react";
import API_URL from "./configS";
import useMiUbicacion from "./UseMiUbicacion";
import useRuta from "./useRuta";
import useUbicacionTrabajador from "./useUbicacionTrabajador";
import { distanciaKm, etaAproximadoMin } from "./Rutas";

const KM_LLEGADA = 0.05; // 50 m (está en km)

/**
 * Hook único que usan el mini mapa y la pantalla completa, para los dos roles.
 *
 *  - rol 'trabajador': usa su GPS, se lo reporta al backend y calcula la ruta.
 *  - rol 'cliente':    consulta dónde está el trabajador y calcula la ruta.
 *
 * idUsuarioRol = idTrabajador (si rol es 'trabajador') o idCliente (si es 'cliente').
 * `trabajo` tiene que traer id y el destino, ya sea como latitud/longitud
 * (alias del backend) o como lat/lng (nombre real de las columnas).
 */
export default function useSeguimiento({ trabajo, rol, idUsuarioRol, activo = true }) {
  const esTrabajador = rol === "trabajador";

  const rawLat = trabajo?.latitud ?? trabajo?.lat;
  const rawLng = trabajo?.longitud ?? trabajo?.lng;

  const destino = useMemo(() => {
    if (rawLat == null || rawLng == null) return null;
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [rawLat, rawLng]);

  // ── Trabajador: GPS propio + reporte al backend ──
  const gpsActivo = activo && esTrabajador && !!destino;
  const { coords: miUbicacion, denegado } = useMiUbicacion(gpsActivo);
  const dejarDeReportar = useRef(false);

  useEffect(() => {
    if (!gpsActivo || !miUbicacion || dejarDeReportar.current || !idUsuarioRol) return;
    fetch(`${API_URL}/trabajador/trabajo/${trabajo.id}/ubicacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idTrabajador: idUsuarioRol, lat: miUbicacion.lat, lng: miUbicacion.lng }),
    })
      .then((r) => {
        // 400 = el trabajo ya no admite ubicación (llegada confirmada, cancelado...)
        if (r.status === 400) dejarDeReportar.current = true;
      })
      .catch((e) => console.error("Reportar ubicación:", e));
  }, [gpsActivo, miUbicacion?.lat, miUbicacion?.lng, trabajo?.id, idUsuarioRol]);

  // ── Cliente: posición que reporta el trabajador ──
  const ubiTrabajador = useUbicacionTrabajador(
    trabajo?.id,
    idUsuarioRol,
    activo && !esTrabajador && !!destino
  );

  const origen = esTrabajador ? miUbicacion : ubiTrabajador;
  const { ruta } = useRuta(origen, destino);

  const kmRecta = origen && destino ? distanciaKm(origen, destino) : null;
  const llego = kmRecta != null && kmRecta < KM_LLEGADA;

  // Si OSRM falla se muestra una estimación en línea recta
  const aproximado = !ruta && kmRecta != null;
  const km = ruta ? ruta.distanciaKm : kmRecta;
  const etaMin = ruta ? ruta.duracionMin : kmRecta != null ? etaAproximadoMin(kmRecta) : null;

  return {
    destino,
    origen,
    puntos: ruta?.puntos ?? null,
    km,
    etaMin,
    aproximado,
    llego,
    permisoDenegado: esTrabajador && denegado,
    sinSenal: !esTrabajador && !!ubiTrabajador && ubiTrabajador.vigente === false,
  };
}