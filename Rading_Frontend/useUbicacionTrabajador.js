import { useEffect, useState } from "react";
import API_URL from "./configS";

// Lado CLIENTE: consulta cada ~12 s dónde está el trabajador.
// El backend responde 204 cuando no hay nada para mostrar (todavía no
// reportó, ya llegó, o el trabajo no es de este cliente).
export default function useUbicacionTrabajador(idTrabajo, idCliente, activo = true, cadaMs = 12000) {
  const [ubicacion, setUbicacion] = useState(null); // { lat, lng, vigente, actualizadoEn }

  useEffect(() => {
    if (!activo || !idTrabajo || !idCliente) return;
    let vivo = true;

    const pedir = async () => {
      try {
        const r = await fetch(`${API_URL}/cliente/trabajo/${idTrabajo}/ubicacion?idCliente=${idCliente}`);
        if (!vivo) return;
        if (r.status === 204) { setUbicacion(null); return; }
        if (!r.ok) return;
        const u = await r.json();
        if (!vivo || u?.lat == null) return;
        setUbicacion({
          lat: Number(u.lat),
          lng: Number(u.lng),
          vigente: u.vigente !== false,
          actualizadoEn: u.actualizadoEn,
        });
      } catch (e) {
        console.error("Ubicación del trabajador:", e);
      }
    };

    pedir();
    const id = setInterval(pedir, cadaMs);
    return () => { vivo = false; clearInterval(id); };
  }, [idTrabajo, idCliente, activo, cadaMs]);

  return ubicacion;
}