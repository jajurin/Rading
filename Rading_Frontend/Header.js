import React, { useState, useEffect, useCallback } from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import API_URL from './configS';
import Logoicon from './assets/Logoicon.png';
import AjustesOverlay from './AjustesOverlay';

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
 * - onCambiarDireccion, onLogo: callbacks de los botones
 * - onSettings: callback opcional adicional, se dispara ANTES de abrir el
 *   menú lateral de ajustes (por si querés loguear el evento, etc). No hace
 *   falta que abras nada vos: el Header ya maneja el overlay internamente.
 * - notificaciones: array opcional de notificaciones reales, formato:
 *     { id, nombre, mensaje, hora, leida }
 *   Si no se pasa, se usa una lista de ejemplo.
 * - onNotificaciones: callback opcional, se dispara al abrir el panel
 * - onVerNotificacion: callback opcional, se dispara al tocar un item (item) => void
 * - onPerfil, onNotifAjustes, onPrivacidad, onPagos, onTrabajadores,
 *   onCerrarSesion: callbacks de cada item del menú lateral de ajustes
 */
export default function Header({
  direccion: direccionProp,
  tipoDireccion = 'Casa',
  usuario,
  onSettings,
  onCambiarDireccion,
  onLogo,
  notificaciones,
  onNotificaciones,
  onVerNotificacion,
  onPerfil,
  onNotifAjustes,
  onPrivacidad,
  onPagos,
  onTrabajadores,
  onCerrarSesion,
}) {
  const navigation = useNavigation();

  const [direccionDb, setDireccionDb] = useState(null);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState(false);

  const [panelVisible, setPanelVisible] = useState(false);
  const [ajustesVisible, setAjustesVisible] = useState(false);

  const fetchDireccion = useCallback(async () => {
    if (!usuario?.email) return;

    try {
      setCargandoDireccion(true);
      setErrorDireccion(false);

      const url = `${API_URL}/usuario/buscar?email=${encodeURIComponent(usuario.email)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Status ${resp.status}`);

      const data = await resp.json();
      if (data?.direccion) {
        setDireccionDb(data.direccion);
      }
    } catch (err) {
      console.error('[Header] Error trayendo dirección:', err.message);
      setErrorDireccion(true);
    } finally {
      setCargandoDireccion(false);
    }
  }, [usuario?.email]);

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

  /* Lista de ejemplo si el padre no pasa notificaciones reales todavía */
  const notificacionesData =
    notificaciones ?? [
      {
        id: '1',
        nombre: 'Paola Laurita',
        rol: 'Electricista',
        mensaje: 'Ya llegué a la dirección, ¿me confirmás el acceso?',
        hora: '10:24',
        leida: false,
      },
      {
        id: '2',
        nombre: 'Marcos Gómez',
        rol: 'Plomero',
        mensaje: 'Terminé el trabajo, quedó todo probado y funcionando.',
        hora: 'Ayer',
        leida: false,
      },
      {
        id: '3',
        nombre: 'Toileta Laura',
        rol: 'Gasista',
        mensaje: 'Te dejé la cotización actualizada del servicio.',
        hora: 'Lun',
        leida: true,
      },
    ];

  const noLeidas = notificacionesData.filter((n) => !n.leida).length;

  const abrirPanel = () => {
    setPanelVisible(true);
    onNotificaciones?.();
  };

  const cerrarPanel = () => setPanelVisible(false);

  const handleItemPress = (item) => {
    onVerNotificacion?.(item);
    cerrarPanel();
  };

  const abrirAjustes = () => {
    onSettings?.();
    setAjustesVisible(true);
  };

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
        onPress={abrirAjustes}
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

      {/* Iconos de la derecha — Notificaciones + Logo/Home */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={abrirPanel}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="notifications-outline" size={19} color={WHITE} />
          {noLeidas > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoBtn}
          onPress={irAHome}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Image source={Logoicon} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Panel desplegable de notificaciones */}
      <Modal
        visible={panelVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarPanel}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={cerrarPanel}>
          <Pressable style={styles.panelWrapper} onPress={() => {}}>
            <View style={styles.panelArrow} />
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Notificaciones</Text>
                {noLeidas > 0 && (
                  <View style={styles.panelCountPill}>
                    <Text style={styles.panelCountText}>{noLeidas} nuevas</Text>
                  </View>
                )}
              </View>

              {notificacionesData.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={26}
                    color="rgba(10,18,48,0.28)"
                  />
                  <Text style={styles.emptyText}>No tenés notificaciones</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.panelList}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {notificacionesData.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.notifItem,
                        idx === notificacionesData.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleItemPress(item)}
                    >
                      <View style={styles.notifAvatar}>
                        <Text style={styles.notifAvatarText}>
                          {item.nombre?.charAt(0) ?? '?'}
                        </Text>
                        {!item.leida && <View style={styles.unreadDot} />}
                      </View>

                      <View style={styles.notifBody}>
                        <View style={styles.notifTopRow}>
                          <Text style={styles.notifNombre} numberOfLines={1}>
                            {item.nombre}
                            {item.rol ? (
                              <Text style={styles.notifRol}> · {item.rol}</Text>
                            ) : null}
                          </Text>
                          <Text style={styles.notifHora}>{item.hora}</Text>
                        </View>
                        <Text
                          style={[
                            styles.notifMensaje,
                            !item.leida && styles.notifMensajeUnread,
                          ]}
                          numberOfLines={2}
                        >
                          {item.mensaje}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Menú lateral de ajustes */}
      <AjustesOverlay
        visible={ajustesVisible}
        onClose={() => setAjustesVisible(false)}
        usuario={usuario}
        onPerfil={onPerfil}
        onNotificaciones={onNotifAjustes}
        onPrivacidad={onPrivacidad}
        onPagos={onPagos}
        onTrabajadores={onTrabajadores}
        onCerrarSesion={onCerrarSesion}
      />
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

  /* ---------- Panel de notificaciones ---------- */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,18,48,0.35)',
  },
  panelWrapper: {
    position: 'absolute',
    top: 98,
    right: 60,
    width: 300,
    alignItems: 'flex-end',
  },
  panelArrow: {
    width: 14,
    height: 14,
    backgroundColor: WHITE,
    transform: [{ rotate: '45deg' }],
    marginRight: 18,
    marginBottom: -7,
    borderRadius: 2,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  panel: {
    width: '100%',
    maxHeight: 360,
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 10,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,18,48,0.08)',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  panelCountPill: {
    backgroundColor: 'rgba(61,78,234,0.1)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  panelCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: INDIGO,
  },
  panelList: {
    maxHeight: 320,
  },
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,18,48,0.06)',
    gap: 10,
  },
  notifAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAvatarText: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 15,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AMBER,
    borderWidth: 1.5,
    borderColor: WHITE,
  },
  notifBody: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
    flexShrink: 1,
  },
  notifRol: {
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(10,18,48,0.45)',
  },
  notifHora: {
    fontSize: 10.5,
    color: 'rgba(10,18,48,0.4)',
    marginLeft: 6,
  },
  notifMensaje: {
    fontSize: 12.5,
    color: 'rgba(10,18,48,0.55)',
    lineHeight: 17,
  },
  notifMensajeUnread: {
    color: NAVY,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 12.5,
    color: 'rgba(10,18,48,0.4)',
    fontWeight: '600',
  },
});