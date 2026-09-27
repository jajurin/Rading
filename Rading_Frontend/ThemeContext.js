import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useColorScheme } from 'react-native';
import API_URL from './configS';

/* ==================================================================== */
/*  PALETA DE COLORES PROFESIONAL                                        */
/* ==================================================================== */

const LightTheme = {
  primary: '#3D4EEA',
  primaryDeep: '#2432B0',
  primaryLight: '#EEF0FD',
  background: '#F2F4FC',
  surface: '#FFFFFF',
  surfaceVariant: '#F7F8FC',
  card: '#FFFFFF',
  text: '#0A1230',
  textSecondary: '#5C6478',
  textTertiary: '#8A90A6',
  textInverse: '#FFFFFF',
  border: 'rgba(61,78,234,0.12)',
  borderLight: 'rgba(10,18,48,0.06)',
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.10)',
  warning: '#F5A623',
  warningBg: 'rgba(245,166,35,0.10)',
  danger: '#E5484D',
  dangerBg: 'rgba(229,72,77,0.10)',
  info: '#3D4EEA',
  infoBg: 'rgba(61,78,234,0.10)',
  teal: '#0EA5A0',
  tealBg: 'rgba(14,165,160,0.10)',
  amber: '#F5A623',
  amberBg: 'rgba(245,166,35,0.10)',
  chipBg: '#EDEFF7',
  chipBorder: '#DFE3F2',
  chipText: '#5C6478',
  shadow: '#0A1230',
  inputBg: '#F7F8FC',
  inputBorder: '#DFE3F2',
  inputPlaceholder: '#8A90A6',
  divider: 'rgba(10,18,48,0.06)',
  overlay: 'rgba(10,18,48,0.5)',
  statusBar: 'light-content',
  statusBarBg: '#2432B0',
};

const DarkTheme = {
  primary: '#5B6CF0',
  primaryDeep: '#3D4EEA',
  primaryLight: 'rgba(91,108,240,0.15)',
  background: '#0D1117',
  surface: '#161B22',
  surfaceVariant: '#1C2128',
  card: '#161B22',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#0D1117',
  border: 'rgba(91,108,240,0.2)',
  borderLight: 'rgba(230,237,243,0.08)',
  success: '#3FB950',
  successBg: 'rgba(63,185,80,0.15)',
  warning: '#D29922',
  warningBg: 'rgba(210,153,34,0.15)',
  danger: '#F85149',
  dangerBg: 'rgba(248,81,73,0.15)',
  info: '#5B6CF0',
  infoBg: 'rgba(91,108,240,0.15)',
  teal: '#39C5CF',
  tealBg: 'rgba(57,197,207,0.15)',
  amber: '#D29922',
  amberBg: 'rgba(210,153,34,0.15)',
  chipBg: '#21262D',
  chipBorder: '#30363D',
  chipText: '#8B949E',
  shadow: '#000000',
  inputBg: '#0D1117',
  inputBorder: '#30363D',
  inputPlaceholder: '#6E7681',
  divider: 'rgba(230,237,243,0.08)',
  overlay: 'rgba(0,0,0,0.7)',
  statusBar: 'light-content',
  statusBarBg: '#0D1117',
};

/* ==================================================================== */
/*  Context                                                             */
/* ==================================================================== */

const ThemeContext = createContext({
  theme: LightTheme,
  isDark: false,
  colors: LightTheme,
  toggleTheme: () => {},
  setDarkMode: () => {},
  loaded: false,
  updatePreference: () => {},
  syncUsuario: () => {},
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef(null);

  // Carga inicial "best effort" con lo que haya en AsyncStorage. Esto es
  // solo para pintar algo razonable ANTES de que la pantalla logueada
  // confirme el usuario real vía syncUsuario(). No es la fuente de verdad.
  useEffect(() => {
    const cargarTemaInicial = async () => {
      try {
        const userId = await getUserId();
        if (userId) {
          userIdRef.current = userId;
          const resp = await fetch(`${API_URL}/configuracion/${userId}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data.modoOscuro !== undefined) setIsDark(data.modoOscuro);
          }
        }
      } catch (e) {
        console.error('[Theme] Error cargando tema inicial:', e.message);
      } finally {
        setLoaded(true);
      }
    };
    cargarTemaInicial();
  }, []);

  // Sincroniza explícitamente el ID del usuario ACTIVO. Cualquier pantalla
  // que ya sepa con certeza quién es el usuario (por props/route params)
  // debe llamar esto, para que guardar y leer preferencias apunten SIEMPRE
  // a la misma fila, sin depender de lo que haya (o no) en AsyncStorage.
  const syncUsuario = useCallback(async (idUsuario) => {
    if (!idUsuario) return;
    userIdRef.current = idUsuario;
    try {
      const resp = await fetch(`${API_URL}/configuracion/${idUsuario}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.modoOscuro !== undefined) setIsDark(data.modoOscuro);
      }
    } catch (e) {
      console.error('[Theme] Error sincronizando usuario:', e.message);
    }
  }, []);

  const savePreference = useCallback(async (key, value, idUsuarioOverride) => {
    try {
      const userId = idUsuarioOverride ?? userIdRef.current ?? await getUserId();
      if (!userId) {
        console.warn('[Theme] No hay idUsuario, no se guarda la preferencia:', key);
        return;
      }
      userIdRef.current = userId;
      const resp = await fetch(`${API_URL}/configuracion/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!resp.ok) {
        console.error('[Theme] PUT falló con status', resp.status, 'para', key);
      }
    } catch (e) {
      console.error('[Theme] Error guardando preferencia:', e.message);
    }
  }, []);

  const toggleTheme = useCallback(async (idUsuario) => {
    setIsDark((prev) => {
      const nuevo = !prev;
      savePreference('modoOscuro', nuevo, idUsuario);
      return nuevo;
    });
  }, [savePreference]);

  const setDarkMode = useCallback(async (value, idUsuario) => {
    setIsDark(value);
    await savePreference('modoOscuro', value, idUsuario);
  }, [savePreference]);

  const updatePreference = useCallback(async (key, value, idUsuario) => {
    if (key === 'modoOscuro') {
      setIsDark(value);
    }
    await savePreference(key, value, idUsuario);
  }, [savePreference]);

  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: theme,
        toggleTheme,
        setDarkMode,
        loaded,
        updatePreference,
        syncUsuario,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ★ CAMBIO: la key ya NO empieza con "@". SecureStore (usado por debajo
// en asyncStorage.js) solo acepta caracteres alfanuméricos, ".", "-" y
// "_" en las keys. El "@" hacía que guardar/leer tirara:
//   "Invalid key provided to SecureStore. Keys must not be empty and
//    contain only alphanumeric characters..."
// y eso rompía el render de pantallas como Configuración.
//
// IMPORTANTE: si en Login.js, Registro.js o algún otro archivo se guarda
// el id con la key vieja "@rading_user_id", hay que cambiarla ahí
// también para que coincida con esta.
async function getUserId() {
  try {
    const { default: AsyncStorage } = await import('./asyncStorage');
    const id = await AsyncStorage.getItem('rading_user_id');
    return id ? Number(id) : null;
  } catch {
    return null;
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { LightTheme, DarkTheme };