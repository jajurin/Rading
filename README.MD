# Rading – React Context: Modo oscuro alternable en todas las ventanas

Trabajo Práctico: **Gestión del Estado Global en Aplicaciones Web y Múltiples Pantallas**
Proyecto: **Rading** (React Native + Expo)

---

## 1. Información que se comparte a través del Context

Se comparte la **preferencia de tema (claro / oscuro)** junto con la paleta de colores activa. Gracias a esto, el **modo oscuro se puede alternar y se aplica en todas las ventanas de la aplicación** al mismo tiempo.

| Valor | Tipo | Descripción |
|---|---|---|
| `isDark` | `boolean` | Indica si el modo oscuro está activo. |
| `theme` / `colors` | `object` | Paleta activa (`LightTheme` o `DarkTheme`): `background`, `card`, `text`, `textSecondary`, `border`, `overlay`, `statusBar`, etc. |
| `toggleTheme(idUsuario?)` | `function` | Alterna entre modo claro y oscuro y guarda la preferencia. |
| `setDarkMode(value, idUsuario?)` | `function` | Fija explícitamente el modo oscuro/claro. |
| `updatePreference(key, value, idUsuario?)` | `function` | Actualiza cualquier preferencia del usuario (si la clave es `modoOscuro`, también actualiza el estado local). |
| `syncUsuario(idUsuario)` | `function` | Sincroniza el usuario activo y carga su preferencia guardada desde el backend. |
| `loaded` | `boolean` | Indica si la carga inicial de la preferencia ya terminó. |

### Persistencia
La preferencia no vive solo en memoria: se guarda por usuario en el backend.

- `GET  /configuracion/:idUsuario` → lee `modoOscuro`.
- `PUT  /configuracion/:idUsuario` → guarda `{ modoOscuro: true|false }`.

De esta forma, al volver a iniciar sesión el usuario recupera el tema que había elegido.

---

## 2. Ruta y nombre del archivo donde fue creado el Context

```
ThemeContext.js
```

(en la raíz del código fuente, junto a `App.js`; las pantallas de las subcarpetas lo importan como `../ThemeContext`).

Se crea con `createContext`:

```js
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
```

Además, el archivo define y exporta:

- `LightTheme` y `DarkTheme`: las dos paletas de colores.
- `ThemeProvider`: el componente que mantiene el estado y provee el valor.
- `useTheme`: hook personalizado que internamente ejecuta `useContext(ThemeContext)`.

---

## 3. Componente contenedor donde se ubicó el Provider

El `ThemeProvider` envuelve toda la aplicación en **`App.js`**, por encima del `NavigationContainer`, por lo que **todas las pantallas** del `Stack.Navigator` quedan dentro del Provider:

```jsx
export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            {/* Login, HomeCliente, HomeTrabajador, Configuracion, Chats, Perfiles, etc. */}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
```

---

## 4. Componentes que consumen la información mediante `useContext`

El consumo se hace a través del hook `useTheme()` (definido en `ThemeContext.js`), que es un envoltorio de `useContext(ThemeContext)`:

```js
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

Componentes que lo consumen:

| Componente | Archivo | Qué toma del Context | Para qué lo usa |
|---|---|---|---|
| **HomeTrabajador** (ejemplo principal) | `Trabajador/HomeTrabajador.js` | `colors`, `isDark` | Pintar fondo, tarjetas, textos, bordes y overlay con la paleta activa; elegir el `barStyle` de la `StatusBar`; cambiar el gradiente del banner "Tu día" según el modo. |
| **Configuracion** | `Configuracion.js` | `isDark`, `toggleTheme` / `setDarkMode`, `syncUsuario` | Mostrar y alternar el interruptor de modo oscuro. |
| **Resto de pantallas** (Login, HomeCliente, Chats, Perfiles, etc.) | `Cliente/*`, `Trabajador/*` | `colors`, `isDark` | Adaptar sus estilos al tema activo. |

> Completar/ajustar esta tabla con las pantallas que efectivamente llaman a `useTheme()` en el repositorio.

### Ejemplo: `HomeTrabajador`

```jsx
import { useTheme } from '../ThemeContext';

export default function HomeTrabajador({ route, navigation }) {
  const { colors, isDark } = useTheme();

  // Los estilos se regeneran solo cuando cambia el tema
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      {/* ... */}
      <LinearGradient
        colors={isDark ? ['#1a2350', '#0d1330'] : franja.gradient}
        style={styles.banner}
      >
        {/* ... */}
      </LinearGradient>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyBox: { backgroundColor: colors.card, borderColor: colors.border /* ... */ },
  saludoTexto: { color: colors.text /* ... */ },
  overlay: { flex: 1, backgroundColor: colors.overlay /* ... */ },
});
```

### Flujo completo

1. El usuario inicia sesión y llega a una pantalla (por ejemplo `HomeTrabajador`).
2. `ThemeProvider` carga desde el backend la preferencia `modoOscuro` de ese usuario.
3. En `Configuracion` el usuario activa o desactiva el modo oscuro (`toggleTheme` / `setDarkMode`).
4. `isDark` cambia en el Provider → **todas las pantallas que consumen el Context se vuelven a renderizar con la nueva paleta**, sin recargar ni pasar props.
5. La preferencia se guarda con `PUT /configuracion/:idUsuario`, por lo que se mantiene en el próximo inicio de sesión.

---

## 5. Justificación técnica del uso de Context

- **Es un estado verdaderamente global.** El tema afecta a todas las pantallas (Login, Home, Chats, Perfiles, Configuración, etc.) y no pertenece a ninguna en particular.
- **Evita el *prop drilling*.** Sin Context habría que pasar `isDark` y los colores por props desde `App.js` a cada pantalla y a cada subcomponente (`Header`, tarjetas, modales, etc.). Con `navigation`/`route` esto ni siquiera es cómodo: los params de navegación no están pensados para compartir estado reactivo global.
- **Cambio instantáneo y consistente.** Al alternar el modo desde `Configuracion`, cualquier pantalla ya montada en el stack se actualiza automáticamente porque todas leen la misma fuente de verdad.
- **Centralización de la lógica.** La paleta (`LightTheme` / `DarkTheme`), la carga inicial, la sincronización por usuario y la persistencia en el backend están en un único archivo (`ThemeContext.js`), lo que facilita el mantenimiento: cambiar un color o agregar una preferencia nueva se hace en un solo lugar.
- **API simple para los componentes.** El hook `useTheme()` encapsula `useContext` y valida que se use dentro del Provider, de modo que cada pantalla solo escribe `const { colors, isDark } = useTheme();`.
- **Adecuado al tamaño del problema.** El dato cambia con poca frecuencia (solo cuando el usuario alterna el tema), por lo que Context resuelve la necesidad sin agregar una librería externa como Redux.

---

## Cómo probarlo

1. Iniciar sesión en la app. Hacer cd en rading_frontend y usar npx expo star y en rading-backend usar node index.js(se requiere .env), se debe crear un perfil pero se puede usar pruebatrabajador@gmail.com holaprofe(contraseña)
2. Ir a **Configuración** y activar el **modo oscuro**.
3. Navegar por las distintas ventanas (Home, Chats, Perfil, etc.): todas se muestran con la paleta oscura.
4. Volver a Configuración y desactivarlo: todas vuelven al modo claro.
5. Cerrar sesión y volver a entrar: la preferencia se mantiene.