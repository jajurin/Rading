import { useEffect, useRef, useState } from "react";
import { getRuta } from "./Rutas";

// Calcula la ruta origen -> destino. Se recalcula cuando se mueve el origen,
// pero con un mínimo de `minIntervaloMs` entre pedidos para no castigar al
// servidor público de OSRM.
export default function useRuta(origen, destino, minIntervaloMs = 15000) {
  const [ruta, setRuta] = useState(null);
  const [error, setError] = useState(null);
  const ultimoPedido = useRef(0);
  const pedidoId = useRef(0);
  const montado = useRef(true);

  const oLat = origen?.lat, oLng = origen?.lng;
  const dLat = destino?.lat, dLng = destino?.lng;

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
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
        if (montado.current && id === pedidoId.current) setError(e);
      });
  }, [oLat, oLng, dLat, dLng, minIntervaloMs]);

  return { ruta, error };
}