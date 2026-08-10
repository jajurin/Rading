import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/* Mismos tokens que Header y el resto de la app */
const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const NAVY = '#0A1230';
const WHITE = '#FFFFFF';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(300, SCREEN_W * 0.8);

/**
 * Props:
 * - visible: boolean, controla si el overlay está abierto
 * - onClose: () => void, se llama al tocar la X o el fondo
 * - usuario: { nombre, email, avatarUrl } opcional, para el mini header
 * - onPerfil, onPrivacidad, onPagos: callbacks de cada item
 */
export default function AjustesOverlay({
  visible,
  onClose,
  usuario,
  onPerfil,
  onPrivacidad,
  onPagos,
}) {
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateX.setValue(-PANEL_WIDTH);
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  const cerrar = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -PANEL_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose?.());
  };

  const items = [
    {
      key: 'perfil',
      icon: 'person-outline',
      label: 'Mi perfil',
      sub: 'Datos personales y preferencias',
      onPress: onPerfil,
    },
    {
      key: 'privacidad',
      icon: 'shield-checkmark-outline',
      label: 'Privacidad y seguridad',
      sub: 'Contraseña y accesos',
      onPress: onPrivacidad,
    },
    {
      key: 'pagos',
      icon: 'wallet-outline',
      label: 'Métodos de pago',
      sub: 'Tarjetas y facturación',
      onPress: onPagos,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={cerrar}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} />
        </Animated.View>

        <Animated.View
          style={[styles.panel, { transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={[INDIGO, INDIGO_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.panelHeader}
          >
            <View style={styles.glow} />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={cerrar}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={WHITE} />
            </TouchableOpacity>

            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {usuario?.nombre?.charAt(0)?.toUpperCase() ?? 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {usuario?.nombre ?? 'Mi cuenta'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {usuario?.email ?? 'Configurá tu perfil'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.menuList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 6 }}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.65}
                onPress={() => {
                  item.onPress?.();
                  cerrar();
                }}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={INDIGO} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub} numberOfLines={1}>
                    {item.sub}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="rgba(10,18,48,0.3)"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,18,48,0.45)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: WHITE,
    shadowColor: NAVY,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  panelHeader: {
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
    opacity: 0.08,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 18,
  },
  userName: {
    color: WHITE,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,18,48,0.06)',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(61,78,234,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: NAVY,
  },
  menuSub: {
    fontSize: 11,
    color: 'rgba(10,18,48,0.45)',
    marginTop: 1,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(10,18,48,0.06)',
  },
  versionText: {
    textAlign: 'center',
    color: 'rgba(10,18,48,0.3)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 10,
  },
});