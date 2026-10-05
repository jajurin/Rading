// Dibuja (o actualiza) la línea de la ruta en un mapa MapLibre.
// JS plano, sin imports: se puede pegar donde está tu crearCapa
// (dentro del HTML del mapa o en el módulo que maneja `map`).
//
// ruta:     array de puntos. Por defecto [lat, lng] (como el que loguea tu
//           código: [-34.60853, ...]). Si ya viene como [lng, lat], pasá
//           { formato: 'lnglat' }.
// opciones: { formato, color, ancho, ajustar }
function dibujarRuta(map, ruta, opciones = {}) {
    const { formato = 'latlng', color = '#1565D8', ancho = 5, ajustar = true } = opciones
    if (!map || !Array.isArray(ruta) || ruta.length < 2) return

    // MapLibre/GeoJSON usan [lng, lat]
    const coordenadas = ruta
        .map((p) => (formato === 'latlng' ? [p[1], p[0]] : [p[0], p[1]]))
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))
    if (coordenadas.length < 2) return

    const data = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coordenadas },
    }

    const pintar = () => {
        const fuente = map.getSource('ruta')
        if (fuente) fuente.setData(data)
        else map.addSource('ruta', { type: 'geojson', data })

        // Borde blanco debajo para que la línea se vea sobre cualquier calle
        if (!map.getLayer('ruta-borde')) {
            map.addLayer({
                id: 'ruta-borde',
                type: 'line',
                source: 'ruta',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#ffffff', 'line-width': ancho + 3 },
            })
        }
        if (!map.getLayer('ruta-linea')) {
            map.addLayer({
                id: 'ruta-linea',
                type: 'line',
                source: 'ruta',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': color, 'line-width': ancho },
            })
        }

        if (ajustar) {
            const lngs = coordenadas.map((c) => c[0])
            const lats = coordenadas.map((c) => c[1])
            map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 40, duration: 0 }
            )
        }
    }

    // Si el estilo todavía no cargó, addSource/addLayer tiran error
    // ("Style is not done loading"): reintentamos cuando el mapa esté en reposo.
    const intentar = () => {
        try { pintar(); return true } catch (e) { return false }
    }
    if (!intentar()) {
        const reintentar = () => { if (intentar()) map.off('idle', reintentar) }
        map.on('idle', reintentar)
    }
}