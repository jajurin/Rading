import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useTheme } from './ThemeContext';
import {
  listarNotificaciones,
  mapearParaHeader,
  marcarTodasLasLeidas,
  navegarDesdeNotificacion,
} from './Notificaciones';

const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const AMBER = '#F5A623';
const DANGER = '#E5484D';
const WHITE = '#FFFFFF';

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
  const { colors, isDark } = useTheme();

  const [direccionDb, setDireccionDb] = useState(null);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [errorDireccion, setErrorDireccion] = useState(false);

  const [panelVisible, setPanelVisible] = useState(false);
  const [ajustesVisible, setAjustesVisible] = useState(false);
  const [notificacionesInternas, setNotificacionesInternas] = useState(null);

  const cargarNotificacionesInternas = useCallback(async () => {
    if (!usuario?.id) {
      setNotificacionesInternas([]);
      return;
    }
    try {
      const filas = await listarNotificaciones(usuario.id);
      setNotificacionesInternas(filas.map(mapearParaHeader));
    } catch (err) {
      console.error('[Header] Error trayendo notificaciones:', err.message);
      setNotificacionesInternas([]);
    }
  }, [usuario?.id]);

  useEffect(() => {
    if (!notificaciones) cargarNotificacionesInternas();
  }, [notificaciones, cargarNotificacionesInternas]);

  const fetchDireccion = useCallback(async () => {
    if (!usuario?.email) return;
    try {
      setCargandoDireccion(true);
      setErrorDireccion(false);
      const url = `${API_URL}/usuario/buscar?email=${encodeURIComponent(usuario.email)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const data = await resp.json();
      if (data?.direccion) setDireccionDb(data.direccion);
    } catch (err) {
      console.error('[Header] Errorr trayendo dirección:', err.message);
      setErrorDireccion(true);
    } finally {
      setCargandoDireccion(false);
    }
  }, [usuario?.email]);

  useEffect(() => { fetchDireccion(); }, [fetchDireccion]);

  const direccion = direccionProp ?? direccionDb ?? (errorDireccion ? 'No se pudo cargar' : 'Sin dirección');

  const irAHome = () => {
    onLogo?.();
    const destino = usuario?.tipo === 'trabajador' ? 'HomeTrabajador' : 'HomeCliente';
    navigation.navigate(destino, { usuario });
  };

  const notificacionesData = notificaciones ?? notificacionesInternas ?? [];
  const noLeidas = notificacionesData.filter((n) => !n.leida).length;

  const abrirPanel = () => {
    setPanelVisible(true);
    if (usuario?.id) {
      marcarTodasLasLeidas(usuario.id).catch((err) =>
        console.error('[Header] No se pudieron marcar como leídas:', err.message)
      );
      if (notificaciones) onNotificaciones?.();
      else cargarNotificacionesInternas();
    }
  };

  const cerrarPanel = () => setPanelVisible(false);

  const handleItemPress = (item) => {
    onVerNotificacion?.(item);
    cerrarPanel();
    if (usuario?.id) {
      navegarDesdeNotificacion(item, usuario, navigation).catch((err) =>
        console.error('[Header] No se pudo navegar desde la notificación:', err.message)
      );
    }
  };

  const verTodas = () => {
    cerrarPanel();
    navigation.navigate('Notificaciones', { usuario });
  };

  const abrirAjustes = () => {
    onSettings?.();
    setAjustesVisible(false);
    navigation.navigate('Configuracion', { usuario });
  };

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <LinearGradient
      colors={isDark ? ['#1a1f3a', '#0d1117'] : [INDIGO, INDIGO_DEEP]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <StatusBar backgroundColor={isDark ? '#0d1117' : INDIGO_DEEP} barStyle="light-content" />
      <View style={styles.glowTop} />

      <TouchableOpacity style={styles.iconBtn} onPress={abrirAjustes} activeOpacity={0.8} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name="settings-outline" size={20} color={WHITE} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.centerContainer} onPress={onCambiarDireccion} activeOpacity={0.8}>
        <View style={styles.eyebrowRow}>
          <PinIcon />
          <Text style={styles.eyebrow}>ENVIANDO A</Text>
        </View>
        {cargandoDireccion && !direccionProp ? (
          <ActivityIndicator size="small" color={WHITE} style={{ marginTop: 4 }} />
        ) : (
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">{direccion}</Text>
        )}
        <View style={styles.tipoChip}>
          <Text style={styles.tipoChipText} numberOfLines={1}>{tipoDireccion}</Text>
          <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.85)" />
        </View>
      </TouchableOpacity>

      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.iconBtn} onPress={abrirPanel} activeOpacity={0.8} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="notifications-outline" size={19} color={WHITE} />
          {noLeidas > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoBtn} onPress={irAHome} activeOpacity={0.85} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Image source={Logoicon} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <Modal visible={panelVisible} transparent animationType="fade" onRequestClose={cerrarPanel} statusBarTranslucent>
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
                  <Ionicons name="notifications-off-outline" size={26} color={colors.textTertiary} />
                  <Text style={styles.emptyText}>No tenés notificaciones</Text>
                </View>
              ) : (
                <ScrollView style={styles.panelList} showsVerticalScrollIndicator={false} bounces={false}>
                  {notificacionesData.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.notifItem, idx === notificacionesData.length - 1 && { borderBottomWidth: 0 }]}
                      activeOpacity={0.7}
                      onPress={() => handleItemPress(item)}
                    >
                      <View style={styles.notifAvatar}>
                        <Text style={styles.notifAvatarText}>{item.nombre?.charAt(0) ?? '?'}</Text>
                        {!item.leida && <View style={styles.unreadDot} />}
                      </View>
                      <View style={styles.notifBody}>
                        <View style={styles.notifTopRow}>
                          <Text style={styles.notifNombre} numberOfLines={1}>
                            {item.nombre}
                            {item.rol ? <Text style={styles.notifRol}> · {item.rol}</Text> : null}
                          </Text>
                          <Text style={styles.notifHora}>{item.hora}</Text>
                        </View>
                        <Text style={[styles.notifMensaje, !item.leida && styles.notifMensajeUnread]} numberOfLines={2}>
                          {item.mensaje}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity style={styles.panelFooter} activeOpacity={0.7} onPress={verTodas}>
                <Text style={styles.panelFooterText}>Ver todas</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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

const createStyles = (colors, isDark) => StyleSheet.create({
  header: {
    height: 92,
    paddingHorizontal: 14,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: colors.shadow,
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
  centerContainer: { flex: 1, alignItems: 'center', marginHorizontal: 6 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eyebrow: { color: 'rgba(255,255,255,0.68)', fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  address: { color: WHITE, fontSize: 14.5, fontWeight: '800', marginTop: 3, maxWidth: '100%', letterSpacing: -0.1 },
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
  tipoChipText: { color: WHITE, fontSize: 11.5, fontWeight: '700' },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    borderColor: isDark ? '#1a1f3a' : INDIGO,
  },
  notifBadgeText: { color: WHITE, fontSize: 8.5, fontWeight: '900' },
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
  logoImg: { width: 30, height: 30 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  panelWrapper: { position: 'absolute', top: 98, right: 60, width: 300, alignItems: 'flex-end' },
  panelArrow: {
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
    marginRight: 18,
    marginBottom: -7,
    borderRadius: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  panel: {
    width: '100%',
    maxHeight: 360,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 10,
    shadowColor: colors.shadow,
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
    borderBottomColor: colors.divider,
  },
  panelTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  panelCountPill: { backgroundColor: colors.infoBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  panelCountText: { fontSize: 10.5, fontWeight: '800', color: colors.primary },
  panelList: { maxHeight: 320 },
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 10,
  },
  notifAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAvatarText: { color: WHITE, fontWeight: '800', fontSize: 15 },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AMBER,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  notifBody: { flex: 1 },
  notifTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  notifNombre: { fontSize: 13, fontWeight: '700', color: colors.text, flexShrink: 1 },
  notifRol: { fontSize: 11.5, fontWeight: '500', color: colors.textTertiary },
  notifHora: { fontSize: 10.5, color: colors.textTertiary, marginLeft: 6 },
  notifMensaje: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 17 },
  notifMensajeUnread: { color: colors.text, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 12.5, color: colors.textTertiary, fontWeight: '600' },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  panelFooterText: { fontSize: 12.5, fontWeight: '800', color: colors.primary },
});
