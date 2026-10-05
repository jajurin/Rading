// Devuelve la posición actual del dispositivo: { coords, error, permiso }
// coords = { latitude, longitude, heading, speed } o null mientras no hay posición.
// NO hace POST al backend: eso lo hace useSeguimiento.
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as Location from 'expo-location'

export default function useMiUbicacion(opciones = true) {
    // Acepta useMiUbicacion(true/false) o useMiUbicacion({ activo })
    const activo =
        typeof opciones === 'object' && opciones !== null
            ? opciones.activo !== false
            : opciones !== false

    const [coords, setCoords] = useState(null)
    const [error, setError] = useState(null)
    const [permiso, setPermiso] = useState(null)

    useEffect(() => {
        if (!activo) return

        let cancelado = false
        let limpiar = () => {}

        const onPosicion = (c) => {
            if (cancelado) return
            setCoords({
                // Ambos nombres, por si useSeguimiento/SeguimientoMini usan uno u otro
                latitude: c.latitude,
                longitude: c.longitude,
                lat: c.latitude,
                lng: c.longitude,
                heading: c.heading ?? null,
                speed: c.speed ?? null,
            })
        }

        if (Platform.OS === 'web') {
            if (!navigator.geolocation) {
                setError('Geolocalización no disponible')
                setPermiso(false)
                return
            }
            const id = navigator.geolocation.watchPosition(
                (pos) => { setPermiso(true); onPosicion(pos.coords) },
                (err) => { setError(err.message); if (err.code === 1) setPermiso(false) },
                { enableHighAccuracy: true, maximumAge: 5000 }
            )
            limpiar = () => navigator.geolocation.clearWatch(id)
        } else {
            ;(async () => {
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync()
                    if (cancelado) return
                    setPermiso(status === 'granted')
                    if (status !== 'granted') return

                    const sub = await Location.watchPositionAsync(
                        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
                        (pos) => onPosicion(pos.coords)
                    )
                    if (cancelado) {
                        try { sub.remove() } catch {}
                        return
                    }
                    limpiar = () => {
                        try { sub.remove() } catch (e) { console.warn('cleanup ubicación:', e) }
                    }
                } catch (e) {
                    if (!cancelado) setError(e.message)
                }
            })()
        }

        return () => {
            cancelado = true
            limpiar()
        }
    }, [activo])

    return { coords, error, permiso }
}