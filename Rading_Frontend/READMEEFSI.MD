# Rading

Aplicación móvil desarrollada en **React Native** que conecta clientes con trabajadores. Este documento detalla la implementación de **React Context** para el Trabajo Práctico de Gestión del Estado Global.

---

## React Context: Tema claro/oscuro

### 1. Información que se comparte a través del Context

El contexto (`ThemeContext`) comparte la siguiente información y funciones con toda la aplicación:

| Valor | Descripción |
|---|---|
| `theme` / `colors` | Objeto con la paleta de colores activa (`LightTheme` o `DarkTheme`). |
| `isDark` | Booleano que indica si el modo oscuro está activo. |
| `toggleTheme(idUsuario)` | Alterna entre modo claro y oscuro y guarda la preferencia. |
| `setDarkMode(value, idUsuario)` | Establece el modo oscuro explícitamente y lo guarda. |
| `updatePreference(key, value, idUsuario)` | Guarda cualquier preferencia de configuración del usuario. |
| `syncUsuario(idUsuario)` | Informa al contexto quién es el usuario activo y carga sus preferencias. |
| `loaded` | Indica si terminó la carga inicial del tema. |

Las preferencias se **persisten en el backend** mediante los endpoints `GET` y `PUT` de `/configuracion/:idUsuario`, por lo que el tema elegido por cada usuario se conserva entre sesiones y dispositivos.

Por defecto, el tema inicial toma el esquema del sistema (`useColorScheme`) y luego se reemplaza con la preferencia guardada del usuario.

### 2. Ruta y nombre del archivo donde fue creado el Context

```
./ThemeContext.js
```

Allí se crea el contexto con `createContext(...)`, se define el componente `ThemeProvider` y se exporta el hook `useTheme`.

```jsx
const ThemeContext = createContext({ theme: LightTheme, isDark: false, /* ... */ });
```

### 3. Componente contenedor donde se ubicó el Provider

En **`./App.js`**, envolviendo a toda la aplicación (incluidos `SafeAreaProvider` y `NavigationContainer`). De esta forma, todas las pantallas del `Stack.Navigator` pueden acceder al contexto.

```jsx
export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>{/* todas las pantallas */}</Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
```

### 4. Componentes que consumen la información mediante useContext

El consumo se realiza a través del hook personalizado `useTheme()`, definido en `ThemeContext.js`, que internamente ejecuta `useContext(ThemeContext)`:

```jsx
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Todas las pantallas de la aplicación** consumen el contexto con `useTheme()` para aplicar los colores del tema activo. Ejemplos representativos:

- `Configuracion.js` y `Trabajador/ConfiguracionTrabajador.js`: leen `isDark` y modifican el modo oscuro con `setDarkMode` / `updatePreference`.
- `Login.js`: aplica los colores del tema en el formulario de ingreso.
- `Cliente/HomeCliente.js`: pantalla principal del cliente.
- `Trabajador/HomeTrabajador.js`: pantalla principal del trabajador (detallada abajo).
- `Cliente/PerfilCliente.js` y `Trabajador/PerfilTrabajador.js`: perfiles de cada tipo de usuario.
- `Cliente/Chat.js` y `Trabajador/Chattrabajador.js`: pantallas de chat.

#### Ejemplo detallado: `Trabajador/HomeTrabajador.js`

**a) Se importa el hook y se obtienen los valores del contexto:**

```jsx
import { useTheme } from '../ThemeContext';

export default function HomeTrabajador({ route, navigation }) {
  const { colors, isDark } = useTheme();
  // ...
}
```

**b) Los estilos se generan a partir del tema.** En lugar de un `StyleSheet.create` estático con colores fijos, la pantalla define una función `createStyles(colors, isDark)` y la memoriza con `useMemo`, de modo que los estilos se recalculan solo cuando cambia el tema:

```jsx
const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

const createStyles = (colors, isDark) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  dispoRow:   { backgroundColor: colors.card, borderColor: colors.border, /* ... */ },
  saludoTexto:{ color: colors.text, /* ... */ },
  resDescripcion: { color: colors.textSecondary, /* ... */ },
  overlay:    { backgroundColor: colors.overlay, /* ... */ },
});
```

**c) El tema también se aplica fuera de los estilos**, por ejemplo en la barra de estado y en el degradado del banner de resumen:

```jsx
<StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

<LinearGradient
  colors={isDark ? ['#1a2350', '#0d1330'] : franja.gradient}
  /* ... */
>
```

Gracias a esto, cuando el usuario activa el modo oscuro en Configuración, `HomeTrabajador` (igual que el resto de las pantallas) se vuelve a renderizar automáticamente con la paleta oscura, sin recibir ningún dato por props ni por parámetros de navegación.

### 5. Justificación técnica del uso de Context

La aplicación cuenta con más de 40 pantallas, divididas en flujos de **cliente** y de **trabajador**, navegadas mediante un `Stack.Navigator`. El tema visual es un dato que necesitan **todas** las pantallas y que se modifica desde **una sola** (Configuración).

Sin Context habría que:

- Pasar el tema como parámetro de navegación (`route.params`) en cada `navigate(...)`, repitiendo código en decenas de pantallas.
- Mantener sincronizado ese valor manualmente cada vez que cambia.

Usando Context:

- **Se evita el prop drilling:** cualquier pantalla accede al tema con una sola línea (`useTheme()`).
- **El cambio es instantáneo y global:** al activar el modo oscuro en Configuración, todas las pantallas se re-renderizan con la nueva paleta.
- **La lógica queda centralizada:** la carga y el guardado de preferencias en el backend viven en un único lugar (`ThemeContext.js`) en vez de estar duplicados en cada pantalla.
- **Se vincula con el usuario logueado:** `syncUsuario` garantiza que las preferencias se lean y se guarden siempre sobre el usuario activo.

Es, por lo tanto, un caso de uso real y funcional del Context, no un ejemplo artificial.

---

## Otros datos

- **Backend:** los endpoints de configuración se consumen desde `API_URL` (`./configS`).
- **Almacenamiento local:** el id del usuario se guarda con la key `rading_user_id` (sin `@`, por compatibilidad con SecureStore).