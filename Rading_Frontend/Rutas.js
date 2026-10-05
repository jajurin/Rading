// Ruta, distancia y ETA con OSRM (gratis, sin API key).
// El servidor público de OSRM es de demo: para producción con muchos
// usuarios cambiá OSRM por OpenRouteService o un OSRM propio. Como todo
// está acá, cambiar de proveedor es tocar solo este archivo.
const OSRM = "https://router.project-osrm.org/route/v1/driving";

export async function getRuta(origen, destino) {
  const url = `${OSRM}/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const r = data.routes?.[0];
  if (!r) throw new Error("Sin ruta");
  return {
    distanciaKm: r.distance / 1000,
    duracionMin: Math.max(1, Math.round(r.duration / 60)),
    // OSRM devuelve [lng,lat]; el mapa lo recibe como [lat,lng]
    puntos: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

// Distancia en línea recta (Haversine). Gratis y se recalcula con cada posición.
export const distanciaKm = (a, b) => {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

// Estimación grosera por si OSRM falla (~25 km/h promedio urbano).
export const etaAproximadoMin = (km) => Math.max(1, Math.round((km / 25) * 60));

export const formatearEta = (min) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;

// Abre Google Maps / Apple Maps con navegación paso a paso (sin API key).
export const urlComoLlegar = (destino) =>
  `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}&travelmode=driving`;