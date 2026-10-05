import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Platform, StyleSheet } from "react-native";

const WebView = Platform.OS === "web" ? null : require("react-native-webview").WebView;

// El HTML se arma UNA sola vez y solo conoce el destino. El resto (posición
// del trabajador y línea de la ruta) llega por mensajes, así el mapa no se
// recarga ni pierde el zoom cuando el trabajador se mueve.
//
// Mapa: MapLibre + tiles raster de OpenStreetMap (sin API key, sin glyphs ni sprites).
// Ojo: el servidor público de OSM es para uso liviano; para producción con mucho
// tráfico conviene OpenFreeMap / MapTiler / Stadia con clave propia.
//  - Nada depende del evento 'load'.
//  - El iframe avisa 'mapa-listo' y el padre recién ahí le manda los datos.
//  - ResizeObserver: el mapa nace dentro de un Modal animado y puede medir 0 px.
//  - La ruta se asegura de forma idempotente (fuente + borde + línea) y se
//    reintenta en cada 'idle': antes, si addSource andaba y addLayer fallaba,
//    la fuente quedaba creada sin capa y nunca se reintentaba.
const buildHtml = (destino, refitSiempre) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet"/>
<style>html,body,#m{height:100%;margin:0}body{background:#dfe6f5}
.dot{width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px #0006}</style>
</head><body><div id="m"></div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
  var D = ${JSON.stringify(destino)};
  var REFIT = ${refitSiempre ? "true" : "false"};

  function aviso(m) {
    try {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m);
      else parent.postMessage(m, '*');
    } catch (_) {}
  }

  var map = new maplibregl.Map({
    container: 'm',
    style: {
      version: 8,
      sources: {
        base: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [{ id: 'base', type: 'raster', source: 'base' }]
    },
    center: [D.lng, D.lat],
    zoom: 14,
    attributionControl: true
  });
  map.on('error', function (e) { console.warn('MapLibre:', e && e.error && e.error.message); });

  function mk(c) { var e = document.createElement('div'); e.className = 'dot'; e.style.background = c; return e; }
  new maplibregl.Marker({ element: mk('#E4483C') }).setLngLat([D.lng, D.lat]).addTo(map);
  var mover = new maplibregl.Marker({ element: mk('#3D4EEA') });

  var ultimo = null, ajustado = false, actual = null, rafId = 0;

  // Si el contenedor cambia de tamaño (animación del Modal, scroll), se recalcula
  try { new ResizeObserver(function () { map.resize(); }).observe(document.getElementById('m')); } catch (_) {}

  // Puntos llegan como [lat,lng]; GeoJSON/MapLibre necesitan [lng,lat]
  function datosRuta() {
    var coords = [];
    if (ultimo && ultimo.puntos) {
      coords = ultimo.puntos.map(function (p) { return [p[1], p[0]]; });
    }
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
  }

  // Idempotente: crea lo que falte (fuente, borde, línea) y actualiza los datos.
  function asegurarRuta() {
    try {
      var datos = datosRuta();
      if (!map.getSource('ruta')) {
        map.addSource('ruta', { type: 'geojson', data: datos });
      }
      if (!map.getLayer('ruta-borde')) {
        map.addLayer({ id: 'ruta-borde', type: 'line', source: 'ruta',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.9 } });
      }
      if (!map.getLayer('ruta')) {
        map.addLayer({ id: 'ruta', type: 'line', source: 'ruta',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#3D4EEA', 'line-width': 5, 'line-opacity': 1 } });
      }
      map.getSource('ruta').setData(datos);
      return true;
    } catch (err) {
      console.warn('asegurarRuta:', err && err.message);
      return false;
    }
  }

  map.on('style.load', asegurarRuta);
  if (map.isStyleLoaded()) asegurarRuta();
  // Red de seguridad: si hay ruta y todavía no hay capa, reintenta cuando el mapa descansa
  map.on('idle', function () {
    if (ultimo && ultimo.puntos && ultimo.puntos.length && !map.getLayer('ruta')) asegurarRuta();
  });

  // Mueve el marcador suavemente en ~1 s en vez de "saltar"
  function animar(desde, hasta) {
    cancelAnimationFrame(rafId);
    var t0 = performance.now(), dur = 1000;
    function paso(t) {
      var k = Math.min(1, (t - t0) / dur);
      mover.setLngLat([desde.lng + (hasta.lng - desde.lng) * k, desde.lat + (hasta.lat - desde.lat) * k]);
      if (k < 1) rafId = requestAnimationFrame(paso);
    }
    rafId = requestAnimationFrame(paso);
  }

  function aplicar(msg) {
    ultimo = msg;
    var origen = msg.origen;
    if (origen) {
      if (!actual) { mover.setLngLat([origen.lng, origen.lat]).addTo(map); }
      else { animar(actual, origen); }
      actual = origen;
    }

    asegurarRuta();
    if (msg.puntos && msg.puntos.length) {
      console.log('ruta: ' + msg.puntos.length + ' puntos, capa = ' + !!map.getLayer('ruta') +
        ', primero = ' + JSON.stringify(msg.puntos[0]));
    }

    // Mini mapa: reencuadra siempre. Pantalla completa: solo la primera vez,
    // después el usuario puede mover y hacer zoom libremente.
    if (origen && (REFIT || !ajustado)) {
      map.resize();
      var b = new maplibregl.LngLatBounds([D.lng, D.lat], [D.lng, D.lat]);
      b.extend([origen.lng, origen.lat]);
      if (msg.puntos) msg.puntos.forEach(function (p) { b.extend([p[1], p[0]]); });
      map.fitBounds(b, { padding: 40, maxZoom: 16, duration: ajustado ? 600 : 0 });
      ajustado = true;
    }
  }

  window.actualizar = aplicar;
  // En web (iframe) los mensajes llegan por postMessage
  window.addEventListener('message', function (e) {
    try { aplicar(JSON.parse(e.data)); } catch (_) {}
  });

  // Le avisamos al padre que ya puede mandar los datos
  aviso('mapa-listo');
</script></body></html>`;

/**
 * Props:
 *  - destino: { lat, lng }              (obligatorio)
 *  - origen:  { lat, lng } | null       posición del trabajador
 *  - puntos:  [[lat,lng], ...] | null   línea de la ruta
 *  - height:  alto fijo (mini mapa). Sin height, el mapa se estira (flex:1).
 *  - fit:     'siempre' (mini mapa) | 'primera' (pantalla completa)
 */
export default function MiniMapaRuta({ origen, destino, puntos, height, fit = "siempre", style }) {
  const ref = useRef(null);
  const msgRef = useRef(null);
  const dLat = destino?.lat, dLng = destino?.lng;

  // Depende solo del destino → el mapa NO se recarga cuando se mueve el trabajador
  const html = useMemo(
    () => buildHtml({ lat: dLat, lng: dLng }, fit === "siempre"),
    [dLat, dLng, fit]
  );

  const enviar = useCallback(() => {
    if (!msgRef.current) return;
    const json = JSON.stringify(msgRef.current);
    if (Platform.OS === "web") {
      ref.current?.contentWindow?.postMessage(json, "*");
    } else {
      ref.current?.injectJavaScript(`window.actualizar && window.actualizar(${json}); true;`);
    }
  }, []);

  useEffect(() => {
    msgRef.current = {
      origen: origen ? { lat: origen.lat, lng: origen.lng } : null,
      puntos: puntos || null,
    };
    enviar();
  }, [origen?.lat, origen?.lng, puntos, enviar]);

  // Web: el iframe avisa cuando el mapa está listo para recibir datos
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const h = (e) => {
      if (e.data === "mapa-listo" && e.source === ref.current?.contentWindow) enviar();
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, [enviar]);

  if (dLat == null || dLng == null) return null;

  return (
    <View style={[styles.box, height != null && { height }, style]}>
      {Platform.OS === "web" ? (
        React.createElement("iframe", {
          ref,
          srcDoc: html,
          onLoad: enviar,
          style: { border: 0, width: "100%", height: "100%", display: "block" },
        })
      ) : (
        <WebView
          ref={ref}
          originWhitelist={["*"]}
          source={{ html }}
          onLoadEnd={enviar}
          onMessage={(e) => { if (e.nativeEvent.data === "mapa-listo") enviar(); }}
          scrollEnabled={false}
          javaScriptEnabled
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 14, overflow: "hidden", backgroundColor: "#dfe6f5" },
});