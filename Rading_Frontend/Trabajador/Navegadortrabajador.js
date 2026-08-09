import React, { useState, useRef, useEffect } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
// 1. Importamos los componentes necesarios para el SVG
import Svg, { G, Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';


const Icons = {
  Home: ({ color, size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Path
          d="M5 9.77746V16.2C5 17.8802 5 18.7203 5.32698 19.362C5.6146 19.9265 6.07354 20.3854 6.63803 20.673C7.27976 21 8.11984 21 9.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7203 19 17.8802 19 16.2V5.00002M21 12L15.5668 5.96399C14.3311 4.59122 13.7133 3.90484 12.9856 3.65144C12.3466 3.42888 11.651 3.42893 11.0119 3.65159C10.2843 3.90509 9.66661 4.59157 8.43114 5.96452L3 12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  ),

  Search: ({ color, size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Path d="M19.778,4.222A11,11,0,1,1,12,1a1,1,0,0,1,1,1v8.277a2,2,0,1,1-2,0V7.621a4.49,4.49,0,1,0,4.182,1.2A1,1,0,0,1,16.6,7.4,6.505,6.505,0,1,1,11,5.585V3.055a9,9,0,1,0,7.364,2.581,1,1,0,1,1,1.414-1.414Z" />
      </G>
    </Svg>
  ),

  Chat: ({ color, size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Path d="M8 10.5H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 14H13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path
          d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 10.1786 21.513 8.47087 20.6622 7"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  ),

  Profile: ({ color, size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Path
          d="M8 7C9.65685 7 11 5.65685 11 4C11 2.34315 9.65685 1 8 1C6.34315 1 5 2.34315 5 4C5 5.65685 6.34315 7 8 7Z"
          fill={color}
        />
        <Path d="M14 12C14 10.3431 12.6569 9 11 9H5C3.34315 9 2 10.3431 2 12V15H14V12Z" fill={color} />
      </G>
    </Svg>
  ),

  // Icono de radar para el fab de Trabajador: anillos concéntricos +
  // un "barrido" saliendo del centro, para que se lea como radar/scan.
  Radar: ({ color, size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.4" opacity="0.35" />
        <Circle cx="12" cy="12" r="5.6" stroke={color} strokeWidth="1.4" opacity="0.55" />
        <Circle cx="12" cy="12" r="1.7" fill={color} />
        <Path d="M12 12L17.2 6.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path
          d="M12 5.2C15.7555 5.2 18.8 8.2445 18.8 12"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.85"
        />
      </G>
    </Svg>
  ),
};

// Paleta alineada con el resto de la app (Home, Chats)
const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d47a8';
const BLUE_LIGHT = '#3b7ff0';

const THEME = {
  bar: '#FFFFFF',
  border: 'rgba(21,101,216,0.08)',
  textInactive: '#9AA5B5',
  active: BLUE_DARK,
  pill: 'rgba(21,101,216,0.14)',
  pillBorder: 'rgba(21,101,216,0.22)',
  fabBg: BLUE_DARK,
  fabBgBright: '#1f6fe6',
  fabHighlight: BLUE_LIGHT,
  fabShadow: BLUE_DARK,
  fabGlow: 'rgba(21,101,216,0.55)',
};

// Radio de búsqueda que usa el botón radar para pedirle ofertas cercanas
// al Trabajador. Lo dejamos como constante para poder ajustarlo fácil.
const RADIO_BUSQUEDA_KM = 5;

// Cada tab define a qué pantalla del Stack.Navigator (App.js) navega.
// screen: null  ->  la pantalla todavía no existe, así que el tab queda
// "en blanco": se marca como activo visualmente pero NO navega a nada,
// para no romper la app. Apenas crees ChatsTrabajador / PerfilTrabajador,
// completá el campo screen acá y ya queda andando.
const NAV_ITEMS = [
  { key: 'inicio',   label: 'Inicio',  Icon: Icons.Home,    screen: 'HomeTrabajador' },
{ key: 'busqueda', label: 'Ofertas', Icon: Icons.Search, screen: 'MisOfertasTrabajador' },  { key: 'fab',      label: null,      Icon: Icons.Radar,   screen: null },
  { key: 'chats',    label: 'Chats',   Icon: Icons.Chat,    screen: 'PreviaChatTrabajador' },
  { key: 'perfil',   label: 'Perfil',  Icon: Icons.Profile, screen: null }, // TODO: crear PerfilTrabajador
];

const FAB_INDEX = NAV_ITEMS.findIndex((i) => i.key === 'fab');
const FAB_RING_SIZE = 60;

function NavTabItem({ item, isActive, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.05 : 1,
        useNativeDriver: true,
        tension: 180,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 200,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.05 : 1,
      useNativeDriver: true,
      tension: 180,
      friction: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
        <item.Icon color={isActive ? THEME.active : THEME.textInactive} size={21} />

        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? THEME.active : THEME.textInactive,
              fontWeight: isActive ? '700' : '600',
              opacity: opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
            },
          ]}
        >
          {item.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function FabButton({ onPress, isActive, transitPulseKey }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;   // flash al tocar / al pasar de largo
  const glowRing = useRef(new Animated.Value(0)).current;   // anillo expansivo del flash
  const breathe = useRef(new Animated.Value(0)).current;    // brillo "respirando" mientras está activo
  const breatheLoop = useRef(null);

  const fireFlash = () => {
    glowAnim.setValue(1);
    glowRing.setValue(0);
    Animated.timing(glowAnim, { toValue: 0, duration: 550, useNativeDriver: false }).start();
    Animated.timing(glowRing, { toValue: 1, duration: 550, useNativeDriver: true }).start();
  };

  // Brillo persistente en "respiración" mientras el fab es el tab activo,
  // así se identifica de un vistazo que estás parado ahí. Como es un
  // radar, este pulso también ayuda a que se sienta "escaneando".
  useEffect(() => {
    if (isActive) {
      breatheLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(breathe, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      );
      breatheLoop.current.start();
    } else {
      breatheLoop.current && breatheLoop.current.stop();
      Animated.timing(breathe, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    return () => breatheLoop.current && breatheLoop.current.stop();
  }, [isActive]);

  // Cuando la gota "pasa de largo" por el fab (sin quedarse ahí), tiramos
  // un flash cortito para que se sienta el recorrido fluido.
  useEffect(() => {
    if (transitPulseKey > 0) fireFlash();
  }, [transitPulseKey]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 6 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 160, friction: 7 }).start();
    fireFlash();
  };

  const ringScale = glowRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = glowRing.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.fabZone}>
        {/* Brillo persistente mientras el fab está activo */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fabBreatheRing,
            { opacity: isActive ? breatheOpacity : 0, transform: [{ scale: breatheScale }] },
          ]}
        />
        {/* Flash expansivo al tocar (o al pasar de largo) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fabGlowRing,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.fabButton,
            {
              backgroundColor: isActive ? THEME.fabBgBright : THEME.fabBg,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[styles.fabFlashOverlay, { opacity: glowAnim }]}
            pointerEvents="none"
          />
          <View style={styles.fabHighlight} pointerEvents="none" />
          <Icons.Radar color="#FFFFFF" size={22} />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Barra de navegación inferior para Trabajador.
 *
 * Props:
 * - usuario: objeto del usuario logueado (se lo pasamos a las pantallas
 *   a las que navegamos, porque varias lo necesitan).
 * - pantallaActiva: opcional. Le decís desde qué pantalla la estás
 *   renderizando ('inicio' | 'busqueda' | 'fab' | 'chats' | 'perfil') para
 *   que se marque el tab correcto como activo. Si no lo pasás, arranca en 'inicio'.
 * - onRadarPress: opcional. Función que se dispara al tocar el botón
 *   central en vez de la navegación por default. Útil si querés, por
 *   ejemplo, abrir un overlay/loader de "buscando ofertas..." en la misma
 *   pantalla sin navegar. Si no la pasás, navega a BuscadorTrabajador
 *   mandando { modoRadar: true, radioKm: RADIO_BUSQUEDA_KM }.
 */
export default function BottomNavBarTrabajador({ usuario, pantallaActiva, onRadarPress }) {
  const [activeTab, setActiveTab] = useState(pantallaActiva || 'inicio');
  const [rowWidth, setRowWidth] = useState(0);
  const [fabTransitPulse, setFabTransitPulse] = useState(0);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const pillX = useRef(new Animated.Value(0)).current;
  const pillStretch = useRef(new Animated.Value(1)).current; // efecto "gota" al deslizar
  const fabActiveAnim = useRef(new Animated.Value(pantallaActiva === 'fab' ? 1 : 0)).current;

  useEffect(() => {
    if (pantallaActiva) setActiveTab(pantallaActiva);
  }, [pantallaActiva]);

  const activeIndex = NAV_ITEMS.findIndex((i) => i.key === activeTab);
  const isFabActive = activeTab === 'fab';

  const slotWidth = rowWidth / NAV_ITEMS.length || 0;

  useEffect(() => {
    if (!rowWidth || activeIndex < 0) return;
    const targetX = activeIndex * slotWidth;

    // Se estira un poco en el sentido del movimiento y vuelve a su forma,
    // como una gota que se desliza y se acomoda.
    Animated.sequence([
      Animated.timing(pillStretch, { toValue: 1.22, duration: 110, useNativeDriver: true }),
      Animated.spring(pillStretch, { toValue: 1, useNativeDriver: true, tension: 220, friction: 10 }),
    ]).start();

    Animated.spring(pillX, {
      toValue: targetX,
      useNativeDriver: true,
      tension: 140,
      friction: 16,
    }).start();

    Animated.timing(fabActiveAnim, {
      toValue: isFabActive ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, rowWidth]);

  // Detecta cuando la gota está "pasando de largo" por el slot del fab
  // (por ejemplo: vas de Perfil a Inicio) para tirarle un pequeño brillo
  // de paso, sin que el fab quede marcado como activo.
  useEffect(() => {
    if (!rowWidth || FAB_INDEX < 0) return;
    const fabStart = FAB_INDEX * slotWidth;
    const fabEnd = fabStart + slotWidth;
    let wasInside = false;

    const id = pillX.addListener(({ value }) => {
      const center = value + slotWidth / 2;
      const isInside = center >= fabStart && center <= fabEnd;
      if (isInside && !wasInside && activeTab !== 'fab') {
        setFabTransitPulse((k) => k + 1);
      }
      wasInside = isInside;
    });

    return () => pillX.removeListener(id);
  }, [rowWidth, activeTab]);

  // Navegación normal para los tabs de texto. Si la pantalla todavía no
  // existe (screen === null) no navegamos a ningún lado: solo se marca
  // el tab como activo visualmente, para que no rompa la app.
  const irA = (item) => {
    setActiveTab(item.key);
    if (item.screen) {
      navigation.navigate(item.screen, { usuario });
    }
  };

  // El fab no navega como los demás tabs: dispara la búsqueda por radar
  // (o el callback que le pases por prop) y se marca como activo.
  const irAlRadar = () => {
    setActiveTab('fab');
    if (onRadarPress) {
      onRadarPress({ radioKm: RADIO_BUSQUEDA_KM });
    } else {
      navigation.navigate('OfertasCercanasTrabajador', {
        usuario,
        radioKm: RADIO_BUSQUEDA_KM,
      });
    }
  };

  // Ancho fijo por slot: cada tab (incluido el primero y el último) ocupa
  // todo su carril, tocando el borde de la barra en los extremos y la
  // mitad de camino hacia el vecino en el resto. Circular alrededor del fab.
  const pillWidth = slotWidth || 1;

  const rectOpacity = fabActiveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const circleOpacity = fabActiveAnim;
  const circleOffsetX = slotWidth ? (slotWidth - FAB_RING_SIZE) / 2 : 0;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.container}>
        <View style={styles.bar}>
          <View
            style={styles.tabsRow}
            onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
          >
            {/* Gota rectangular: usada mientras el activo es un tab de texto */}
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  width: pillWidth,
                  opacity: rectOpacity,
                  transform: [{ translateX: pillX }, { scaleX: pillStretch }],
                },
              ]}
              pointerEvents="none"
            />

            {/* Gota circular: se arma alrededor del fab cuando es el activo */}
            <Animated.View
              style={[
                styles.slidingCircle,
                {
                  opacity: circleOpacity,
                  transform: [
                    { translateX: pillX },
                    { translateX: circleOffsetX },
                    { scale: pillStretch },
                  ],
                },
              ]}
              pointerEvents="none"
            />

            {NAV_ITEMS.map((item) =>
              item.key === 'fab' ? (
                <FabButton
                  key={item.key}
                  onPress={irAlRadar}
                  isActive={isFabActive}
                  transitPulseKey={fabTransitPulse}
                />
              ) : (
                <NavTabItem
                  key={item.key}
                  item={item}
                  isActive={activeTab === item.key}
                  onPress={() => irA(item)}
                />
              )
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    backgroundColor: THEME.bar,
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0d47a8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  slidingPill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 52,
    backgroundColor: THEME.pill,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.pillBorder,
  },
  slidingCircle: {
    position: 'absolute',
    top: (52 - FAB_RING_SIZE) / 2,
    left: 0,
    width: FAB_RING_SIZE,
    height: FAB_RING_SIZE,
    borderRadius: FAB_RING_SIZE / 2,
    backgroundColor: THEME.pill,
    borderWidth: 1,
    borderColor: THEME.pillBorder,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 52,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },

  // ---- Botón central (radar), en línea con los demás, misma altura ----
  fabZone: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: THEME.fabShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  fabFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.fabBgBright,
  },
  fabHighlight: {
    position: 'absolute',
    top: -12,
    left: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.fabHighlight,
    opacity: 0.55,
  },
  fabGlowRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: THEME.fabGlow,
  },
  fabBreatheRing: {
    position: 'absolute',
    width: FAB_RING_SIZE + 6,
    height: FAB_RING_SIZE + 6,
    borderRadius: (FAB_RING_SIZE + 6) / 2,
    backgroundColor: THEME.fabGlow,
  },
});