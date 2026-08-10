import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import API_URL from './configS';
import Logoicon from './assets/Logoicon.png';

/* Mismos tokens que el resto de la app */
const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const NAVY = '#0A1230';
const AMBER = '#F5A623';
const DANGER = '#E5484D';
const WHITE = '#FFFFFF';

/* Pin de ubicación, mismo estilo lineal que el resto de los íconos de la app */
const PinIcon = ({ color = WHITE, size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C12 21 19 14.4353 19 9.6C19 5.67451 15.866 2.5 12 2.5C8.13401 2.5 5 5.67451 5 9.6C5 14.4353 12 21 12 21Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="9.6" r="2.4" stroke={color} strokeWidth="1.8" />
  </Svg>
);

/**
 * Props:
 * - usuario: objeto con al menos { email } (o { id }) del usuario logueado.
 *   El Header usa esto para pedirle la dirección real al backend.
 * - direccion: opcional, permite overridear/forzar una dirección sin pegarle
 *   a la API (por ejemplo si ya la tenés resuelta en la pantalla padre).
 * - tipoDireccion: texto del chip "Casa ⌄" (la tabla Usuario no tiene este
 *   campo todavía; si lo agregás a la DB, se puede traer igual que direccion).
 * - onSettings, onCambiarDireccion, onLogo: callbacks de los botones
 * - notificacionesCount / onNotificaciones: badge de notificaciones
 */
export default function Header({
  direccion: direccionProp,
  tipoDireccion = 'Casa',
  usuario,
  onSettings,
  onCambiarDireccion,
  onLogo,
  notificacionesCount = 0,
  onNotificaciones,
}) {
  const navigation = useNavigation();

  const [direccionDb, setDireccionDb] = useState(null);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState(false);

  const fetchDireccion = useCallback(async () => {
    console.log('[Header] usuario recibido:', usuario);

    if (!usuario?.email) {
      console.log('[Header] No hay usuario.email, no se hace fetch');
      return;
    }

    try {
      setCargandoDireccion(true);
      setErrorDireccion(false);

      const url = `${API_URL}/usuario/buscar?email=${encodeURIComponent(usuario.email)}`;
      console.log('[Header] Pidiendo:', url);

      const resp = await fetch(url);
      console.log('[Header] Status:', resp.status);

      if (!resp.ok) throw new Error(`Status ${resp.status}`);

      const data = await resp.json();
      console.log('[Header] Data recibida:', data);

      if (data?.direccion) {
        setDireccionDb(data.direccion);
      } else {
        console.log('[Header] La respuesta no trae campo direccion');
      }
    } catch (err) {
      console.error('[Header] Error trayendo dirección:', err.message);
      setErrorDireccion(true);
    } finally {
      setCargandoDireccion(false);
    }
  }, [usuario?.email]);

  // 👇 esto era lo que faltaba: sin esto, fetchDireccion nunca se ejecuta
  useEffect(() => {
    fetchDireccion();
  }, [fetchDireccion]);

  // Prioridad: dirección pasada explícitamente por prop > la traída de la DB > placeholder
  const direccion =
    direccionProp ??
    direccionDb ??
    (errorDireccion ? 'No se pudo cargar' : 'Sin dirección');

  const irAHome = () => {
    onLogo?.();
    navigation.navigate('HomeCliente', { usuario });
  };

  const mostrarNotificaciones = notificacionesCount > 0;

  return (
    <LinearGradient
      colors={[INDIGO, INDIGO_DEEP]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <StatusBar backgroundColor={INDIGO_DEEP} barStyle="light-content" />
      <View style={styles.glowTop} />

      {/* Icono izquierdo — Ajustes */}
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onSettings}
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="settings-outline" size={20} color={WHITE} />
      </TouchableOpacity>

      {/* Dirección */}
      <TouchableOpacity
        style={styles.centerContainer}
        onPress={onCambiarDireccion}
        activeOpacity={0.8}
      >
        <View style={styles.eyebrowRow}>
          <PinIcon />
          <Text style={styles.eyebrow}>ENVIANDO A</Text>
        </View>

        {cargandoDireccion && !direccionProp ? (
          <ActivityIndicator size="small" color={WHITE} style={{ marginTop: 4 }} />
        ) : (
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
            {direccion}
          </Text>
        )}

        <View style={styles.tipoChip}>
          <Text style={styles.tipoChipText} numberOfLines={1}>
            {tipoDireccion}
          </Text>
          <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.85)" />
        </View>
      </TouchableOpacity>

      {/* Iconos de la derecha — Notificaciones (opcional) + Logo/Home */}
      <View style={styles.rightGroup}>
        {mostrarNotificaciones && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onNotificaciones}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="notifications-outline" size={19} color={WHITE} />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {notificacionesCount > 9 ? '9+' : notificacionesCount}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoBtn}
          onPress={irAHome}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Image source={Logoicon} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 92,
    paddingHorizontal: 14,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    opacity: 0.08,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  address: {
    color: WHITE,
    fontSize: 14.5,
    fontWeight: '800',
    marginTop: 3,
    maxWidth: '100%',
    letterSpacing: -0.1,
  },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tipoChipText: {
    color: WHITE,
    fontSize: 11.5,
    fontWeight: '700',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: INDIGO,
  },
  notifBadgeText: {
    color: WHITE,
    fontSize: 8.5,
    fontWeight: '900',
  },
  logoBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: 30,
    height: 30,
  },
});