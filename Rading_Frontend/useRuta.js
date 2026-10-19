import { useEffect, useRef, useState } from "react";
import { getRuta } from "./Rutas";

// Calcula la ruta origen -> destino. Se recalcula cuando se mueve el origen,
// pero con un mínimo de `minIntervaloMs` entre pedidos para no castigar al
// servidor público de OSRM.
// Si el pedido falla (red, 429 del servidor demo...) se reintenta solo cada
// `reintentoMs`: antes quedaba sin ruta hasta que el origen se moviera, y un
// trabajador/cliente quieto nunca la recuperaba.
export default function useRuta(origen, destino, minIntervaloMs = 15000, reintentoMs = 8000) {
  const [ruta, setRuta] = useState(null);
  const [error, setError] = useState(null);
  const [reintento, setReintento] = useState(0);
  const ultimoPedido = useRef(0);
  const pedidoId = useRef(0);
  const montado = useRef(true);
  const timer = useRef(null);

  const oLat = origen?.lat, oLng = origen?.lng;
  const dLat = destino?.lat, dLng = destino?.lng;

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; clearTimeout(timer.current); };
  }, []);

  // Si cambia el destino, se descarta la ruta anterior
  useEffect(() => {
    ultimoPedido.current = 0;
    setRuta(null);
  }, [dLat, dLng]);

  useEffect(() => {
    if (oLat == null || oLng == null || dLat == null || dLng == null) return;
    const ahora = Date.now();
    if (ahora - ultimoPedido.current < minIntervaloMs) return;
    ultimoPedido.current = ahora;

    const id = ++pedidoId.current;
    getRuta({ lat: oLat, lng: oLng }, { lat: dLat, lng: dLng })
      .then((r) => {
        if (montado.current && id === pedidoId.current) { setRuta(r); setError(null); }
      })
      .catch((e) => {
        if (!montado.current || id !== pedidoId.current) return;
        console.warn("Ruta (OSRM):", e?.message || e);
        setError(e);
        ultimoPedido.current = 0; // el throttle no debe frenar el reintento
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { if (montado.current) setReintento((n) => n + 1); }, reintentoMs);
      });
  }, [oLat, oLng, dLat, dLng, minIntervaloMs, reintentoMs, reintento]);

  return { ruta, error };
}