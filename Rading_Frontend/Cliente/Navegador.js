import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

const Icons = {
  Home: ({ color, size = 22 }) => (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>⌂</Text>
  ),
  Search: ({ color, size = 22 }) => (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>⌕</Text>
  ),
  Chat: ({ color, size = 22 }) => (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>✉</Text>
  ),
  Profile: ({ color, size = 22 }) => (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>◯</Text>
  ),
};

const THEME = {
  bg: '#8b8b8b',
  border: 'rgba(0, 0, 0, 0.06)',
  accent: '#ff6363',
  accentGlow: 'rgba(108,99,255,0.35)',
  accentLight: '#A89BFF',
  textInactive: '#28288d',
  fabBg: '#2300e9',
  fabShadow: '#0900b9',
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
        toValue: isActive ? 1.1 : 1,
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
        toValue: isActive ? -3 : 0,
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
      toValue: isActive ? 1.1 : 1,
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
        <Animated.View style={[styles.activePill, { opacity: opacityAnim }]} />

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
        <View style={styles.fabGlow} />
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
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 139, 216, 0.12)',
    borderRadius: 12,
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
  fabGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.accentGlow,
    opacity: 0.4,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
    fontWeight: '300',
    marginTop: -2,
  },
});