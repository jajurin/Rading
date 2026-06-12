import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
// 1. Importamos los componentes necesarios para el SVG
import Svg, { G, Path } from 'react-native-svg';

const Icons = {
  Home: ({ color, size = 22 }) => (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
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
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={color}
    >
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Path 
          d="M19.778,4.222A11,11,0,1,1,12,1a1,1,0,0,1,1,1v8.277a2,2,0,1,1-2,0V7.621a4.49,4.49,0,1,0,4.182,1.2A1,1,0,0,1,16.6,7.4,6.505,6.505,0,1,1,11,5.585V3.055a9,9,0,1,0,7.364,2.581,1,1,0,1,1,1.414-1.414Z" 
        />
      </G>
    </Svg>
  ),

  Chat: ({ color, size = 22 }) => (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <G id="SVGRepo_bgCarrier" strokeWidth="0" />
      <G id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <G id="SVGRepo_iconCarrier">
        <Path 
          d="M8 10.5H16" 
          stroke={color} 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
        <Path 
          d="M8 14H13.5" 
          stroke={color} 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
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
    // Reemplazá esta línea con tu imagen
    null
  ),
};
const THEME = {
  bg: '#e4e2e2',
  border: 'rgba(0, 0, 0, 0.06)',
  accent: '#ff6363',
  accentGlow: 'rgba(102, 102, 102, 0.35)',
  accentLight: '#004AC6',
  textInactive: '#8d8d94',
  fabBg: '#004AC6',
  fabShadow: '#004AC6',
};

const NAV_ITEMS = [
  { key: 'inicio',   label: 'Inicio',   Icon: Icons.Home    },
  { key: 'busqueda', label: 'Busqueda', Icon: Icons.Search  },
  { key: 'chats',    label: 'Chats',    Icon: Icons.Chat    },
  { key: 'perfil',   label: 'Perfil',   Icon: Icons.Profile },
];

function NavTabItem({ item, isActive, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

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
      Animated.spring(translateY, {
        toValue: isActive ? -2 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 8,
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
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale: scaleAnim }, { translateY }] },
        ]}
      >
        <Animated.View
          style={[styles.activePill, { opacity: opacityAnim }]}
          pointerEvents="none"
        />

        <item.Icon
          color={isActive ? THEME.accentLight : THEME.textInactive}
          size={22}
        />

        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? THEME.accentLight : THEME.textInactive,
              opacity: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ]}
        >
          {item.label}
        </Animated.Text>

        <Animated.View style={[styles.activeDot, { opacity: opacityAnim }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function FabButton({ onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, tension: 200, friction: 6 }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.fabWrapper}
    >
      <Animated.View style={[styles.fabButton, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.Text style={[styles.fabIcon, { transform: [{ rotate }] }]}>
          +
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNavBar() {
  const [activeTab, setActiveTab] = useState('inicio');

  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2, 4);

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />
      <View style={styles.bar}>
        <View style={styles.tabGroup}>
          {leftItems.map(item => (
            <NavTabItem
              key={item.key}
              item={item}
              isActive={activeTab === item.key}
              onPress={() => setActiveTab(item.key)}
            />
          ))}
        </View>

        <FabButton onPress={() => console.log('FAB pressed')} />

        <View style={styles.tabGroup}>
          {rightItems.map(item => (
            <NavTabItem
              key={item.key}
              item={item}
              isActive={activeTab === item.key}
              onPress={() => setActiveTab(item.key)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.bg,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  topBorder: {
    height: 1,
    backgroundColor: THEME.border,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    overflow: 'hidden',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activePill: {
    position: 'absolute',
    width: 72,
    height: 52,
    alignSelf: 'center',
    backgroundColor: 'rgba(6, 139, 216, 0.13)',
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.accentLight,
    marginTop: 1,
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginBottom: 4,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: THEME.fabBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.fabShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 14,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
    fontWeight: '300',
    marginTop: -2,
  },
});