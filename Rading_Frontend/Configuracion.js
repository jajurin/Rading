import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import Header from './Header';
import API_URL from './configS';

/* ------------------------------------------------------------------ */
/*  Helpers de estilo (se llaman desde createStyles)                    */
/* ------------------------------------------------------------------ */

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

/* ------------------------------------------------------------------ */
/*  Componentes reutilizables                                          */
/* ------------------------------------------------------------------ */

// ★ CAMBIO: ahora recibe `styles` como prop en vez de leerlo de una
// variable global que nunca se definía (esa era la causa del
// "ReferenceError: styles is not defined").
function SettingRow({ icon, iconColor, titulo, subtitulo, onPress, rightContent, disabled, colors, styles }) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.divider }, disabled && { opacity: 0.5 }]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.65}
      disabled={disabled}
    >
      <View style={[styles.settingIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingTitulo, { color: colors.text }]}>{titulo}</Text>
        {subtitulo ? (
          <Text style={[styles.settingSubtitulo, { color: colors.textTertiary }]}>{subtitulo}</Text>
        ) : null}
      </View>
      {rightContent || <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
    </TouchableOpacity>
  );
}

// ★ CAMBIO: acepta `guardando` para mostrar un spinner chiquito pegado
// al switch y deshabilitarlo mientras ESE toggle en particular está
// guardándose (los demás switches quedan libres, no se bloquea toda la
// pantalla). También recibe `styles` como prop (ver comentario arriba).
function ToggleRow({ icon, iconColor, titulo, subtitulo, value, onValueChange, disabled, guardando, colors, styles }) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.divider }, disabled && { opacity: 0.5 }]}>
      <View style={[styles.settingIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingTitulo, { color: colors.text }]}>{titulo}</Text>
        {subtitulo ? (
          <Text style={[styles.settingSubtitulo, { color: colors.textTertiary }]}>{subtitulo}</Text>
        ) : null}
      </View>
      <View style={styles.toggleWrap}>
        {guardando && (
          <ActivityIndicator size="small" color={iconColor} style={{ marginRight: 8 }} />
        )}
        <Switch
          value={value}
          onValueChange={disabled || guardando ? undefined : onValueChange}
          trackColor={{ false: '#30363D', true: `${iconColor}40` }}
          thumbColor={value ? iconColor : '#8B949E'}
          disabled={disabled || guardando}
        />
      </View>
    </View>
  );
}

// ★ CAMBIO: recibe `styles` como prop.
function SectionCard({ titulo, subtitulo, children, style, colors, styles }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <View style={{ marginBottom: 4 }}>
        <Text style={[styles.cardTitulo, { color: colors.primaryDeep }]}>{titulo}</Text>
        {subtitulo ? (
          <Text style={[styles.cardSubtitulo, { color: colors.textTertiary }]}>{subtitulo}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal para cambiar contraseña                                      */
/* ------------------------------------------------------------------ */

// ★ CAMBIO: recibe `styles` como prop.
function PasswordModal({ visible, onCerrar, colors, styles }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!actual || !nueva || !confirmar) {
      Alert.alert('Completá todos los campos');
      return;
    }
    if (nueva.length < 6) {
      Alert.alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nueva !== confirmar) {
      Alert.alert('Las contraseñas no coinciden');
      return;
    }
    setGuardando(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      Alert.alert('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente');
      onCerrar();
    } catch (e) {
      Alert.alert('Error', 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={onCerrar}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.modalTitulo, { color: colors.text }]}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContent}>
              <View style={styles.passwordField}>
                <Text style={[styles.passwordLabel, { color: colors.textSecondary }]}>Contraseña actual</Text>
                <View style={[styles.passwordInputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      value={actual}
                      onChangeText={setActual}
                      secureTextEntry={!mostrarActual}
                      placeholder="••••••••"
                      placeholderTextColor={colors.inputPlaceholder}
                    />
                    <TouchableOpacity onPress={() => setMostrarActual(!mostrarActual)}>
                      <Ionicons name={mostrarActual ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </>
                </View>
              </View>

              <View style={styles.passwordField}>
                <Text style={[styles.passwordLabel, { color: colors.textSecondary }]}>Nueva contraseña</Text>
                <View style={[styles.passwordInputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      value={nueva}
                      onChangeText={setNueva}
                      secureTextEntry={!mostrarNueva}
                      placeholder="••••••••"
                      placeholderTextColor={colors.inputPlaceholder}
                    />
                    <TouchableOpacity onPress={() => setMostrarNueva(!mostrarNueva)}>
                      <Ionicons name={mostrarNueva ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </>
                </View>
              </View>

              <View style={styles.passwordField}>
                <Text style={[styles.passwordLabel, { color: colors.textSecondary }]}>Confirmar nueva contraseña</Text>
                <View style={[styles.passwordInputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      value={confirmar}
                      onChangeText={setConfirmar}
                      secureTextEntry={!mostrarConfirmar}
                      placeholder="••••••••"
                      placeholderTextColor={colors.inputPlaceholder}
                    />
                    <TouchableOpacity onPress={() => setMostrarConfirmar(!mostrarConfirmar)}>
                      <Ionicons name={mostrarConfirmar ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalCancelar, { backgroundColor: colors.chipBg }]} onPress={onCerrar} activeOpacity={0.8}>
                <Text style={[styles.modalCancelarTexto, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalGuardar, { backgroundColor: colors.primary }, guardando && { opacity: 0.7 }]}
                onPress={handleGuardar}
                activeOpacity={0.88}
                disabled={guardando}
              >
                <Text style={[styles.modalGuardarTexto, { color: colors.textInverse }]}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal para editar perfil                                           */
/* ------------------------------------------------------------------ */

// ★ CAMBIO: recibe `styles` como prop.
function ProfileModal({ visible, onCerrar, colors, navigation, usuario, styles }) {
  const irAPerfil = () => {
    onCerrar();
    navigation?.navigate?.(usuario?.tipo === 'trabajador' ? 'PerfilTrabajador' : 'PerfilScreen', { usuario });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={onCerrar}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitulo, { color: colors.text }]}>Editar perfil</Text>
            <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileContent}>
            <TouchableOpacity style={[styles.profileOption, { borderBottomColor: colors.divider }]} onPress={irAPerfil}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.profileOptionText, { color: colors.text }]}>Datos personales</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.profileOption, { borderBottomColor: colors.divider }]} onPress={irAPerfil}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
              <Text style={[styles.profileOptionText, { color: colors.text }]}>Perfil profesional</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.profileOption, { borderBottomColor: colors.divider }]} onPress={irAPerfil}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={[styles.profileOptionText, { color: colors.text }]}>Fotos</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Pantalla principal: Configuración                                  */
/* ==================================================================== */

export default function Configuracion(props) {
  const usuario = props.usuario ?? props.route?.params?.usuario;
  const navigation = props.navigation ?? null;
  const { isDark, colors, setDarkMode, updatePreference, syncUsuario } = useTheme();

  // ★ CAMBIO: esto es lo que faltaba. `createStyles` estaba definido al
  // final del archivo pero nunca se llamaba, así que `styles` no existía
  // en ningún lado (de ahí el "ReferenceError: styles is not defined").
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  /* ---------------- Estado ---------------- */
  const [notifOfertas, setNotifOfertas] = useState(true);
  const [notifMensajes, setNotifMensajes] = useState(true);
  const [notifResenas, setNotifResenas] = useState(true);
  const [notifSonido, setNotifSonido] = useState(true);
  const [notifVibracion, setNotifVibracion] = useState(true);

  const [ubicacion, setUbicacion] = useState(true);
  const [analitica, setAnalitica] = useState(false);

  const [modalPassword, setModalPassword] = useState(false);
  const [modalProfile, setModalProfile] = useState(false);

  // ★ CAMBIO: `cargando` ahora SÍ se usa para tapar los toggles hasta que
  // llegue la config real — evita el "parpadeo" de ver los defaults del
  // useState antes de que el fetch responda.
  const [cargando, setCargando] = useState(true);

  // ★ CAMBIO: qué claves están guardándose ahora mismo, para deshabilitar
  // SOLO ese switch puntual y mostrarle su spinner, sin bloquear el resto.
  const [guardandoKeys, setGuardandoKeys] = useState({});

  // ★ CAMBIO: cola de guardado por clave. Cada clave tiene su propia
  // promesa encadenada, así dos toggles rápidos del MISMO switch se
  // ejecutan en el orden en que se tocaron (nunca se pisan al revés),
  // mientras que switches DISTINTOS se guardan en paralelo sin bloquearse
  // entre sí.
  const colasRef = useRef({});

  const isTrabajador = usuario?.tipo === 'trabajador';

  const encolarGuardado = useCallback((key, fn) => {
    const colaAnterior = colasRef.current[key] || Promise.resolve();
    setGuardandoKeys((prev) => ({ ...prev, [key]: true }));

    const nuevaCola = colaAnterior
      .catch(() => {}) // si la anterior falló, igual seguimos con esta
      .then(fn)
      .catch((e) => {
        console.error(`[Configuracion] Error guardando ${key}:`, e?.message);
      })
      .finally(() => {
        // Solo apagamos el spinner si esta sigue siendo la última
        // operación encolada para esta clave (evita parpadeos si ya
        // hay otra en curso).
        if (colasRef.current[key] === nuevaCola) {
          setGuardandoKeys((prev) => {
            const copia = { ...prev };
            delete copia[key];
            return copia;
          });
        }
      });

    colasRef.current[key] = nuevaCola;
    return nuevaCola;
  }, []);

  /* ---------------- Cargar configuración del backend ---------------- */
  const cargarConfiguracion = async () => {
    if (!usuario?.id) {
      setCargando(false);
      return;
    }
    try {
      if (usuario?.id) await syncUsuario(usuario.id);
      const resp = await fetch(`${API_URL}/configuracion/${usuario.id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.modoOscuro !== undefined) setDarkMode(data.modoOscuro, usuario.id);
      if (data.notifOfertas !== undefined) setNotifOfertas(data.notifOfertas);
      if (data.notifMensajes !== undefined) setNotifMensajes(data.notifMensajes);
      if (data.notifResenas !== undefined) setNotifResenas(data.notifResenas);
      if (data.notifSonido !== undefined) setNotifSonido(data.notifSonido);
      if (data.notifVibracion !== undefined) setNotifVibracion(data.notifVibracion);
      if (data.ubicacionHabilitada !== undefined) setUbicacion(data.ubicacionHabilitada);
      if (data.datosUso !== undefined) setAnalitica(data.datosUso);
    } catch (e) {
      console.error('[Configuracion] Error cargando:', e.message);
    } finally {
      setCargando(false);
    }
  };

  React.useEffect(() => {
    cargarConfiguracion();
  }, [usuario?.id]);

  /* ---------------- Handlers ---------------- */
  // ★ CAMBIO: cada handler actualiza el estado local al toque (feedback
  // inmediato) y ENCOLA el guardado real contra el backend, mostrando el
  // spinner de esa fila mientras está en vuelo.
  const handleToggleTheme = () => {
    const nuevo = !isDark;
    setDarkMode(nuevo, usuario?.id);
    encolarGuardado('modoOscuro', () =>
      fetch(`${API_URL}/configuracion/${usuario?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modoOscuro: nuevo }),
      })
    );
  };

  const hacerToggle = (key, setter, valor) => {
    setter(valor);
    encolarGuardado(key, () => updatePreference(key, valor, usuario?.id));
  };

  const handleToggleOfertas = (v) => hacerToggle('notifOfertas', setNotifOfertas, v);
  const handleToggleMensajes = (v) => hacerToggle('notifMensajes', setNotifMensajes, v);
  const handleToggleResenas = (v) => hacerToggle('notifResenas', setNotifResenas, v);
  const handleToggleSonido = (v) => hacerToggle('notifSonido', setNotifSonido, v);
  const handleToggleVibracion = (v) => hacerToggle('notifVibracion', setNotifVibracion, v);
  const handleToggleUbicacion = (v) => hacerToggle('ubicacionHabilitada', setUbicacion, v);
  const handleToggleAnalitica = (v) => hacerToggle('datosUso', setAnalitica, v);

  const confirmarCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => navigation?.navigate?.('Login') },
    ]);
  };

  /* ---------------- Render ---------------- */
  const irAtras = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      const destino = usuario?.tipo === 'trabajador' ? 'HomeTrabajador' : 'HomeCliente';
      navigation?.navigate?.(destino, { usuario });
    }
  };

  // ★ CAMBIO: mientras carga la config inicial, mostramos un loader en vez
  // de los toggles con sus valores default — así no hay parpadeo ni
  // sensación de "se resetea solo".
  if (cargando) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Header usuario={usuario} />
        <View style={styles.loaderFull}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
            Cargando configuración...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header usuario={usuario} />

      <View style={[styles.backBar, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={irAtras}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backTexto, { color: colors.primary }]}>Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.backTitulo, { color: colors.text }]}>Configuración</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Apariencia ---------- */}
        <SectionCard
          titulo="Apariencia"
          subtitulo="Personalizá el aspecto de la app"
          colors={colors}
          styles={styles}
        >
          <ToggleRow
            icon={isDark ? 'moon' : 'sunny'}
            iconColor={colors.primary}
            titulo="Modo oscuro"
            subtitulo={isDark ? 'Activado — paleta oscura' : 'Desactivado — paleta clara'}
            value={isDark}
            onValueChange={handleToggleTheme}
            guardando={!!guardandoKeys.modoOscuro}
            colors={colors}
            styles={styles}
          />
        </SectionCard>

        {/* ---------- Notificaciones ---------- */}
        <SectionCard
          titulo="Notificaciones"
          subtitulo="Elegí qué avisos querés recibir"
          colors={colors}
          styles={styles}
        >
          <ToggleRow
            icon="briefcase-outline"
            titulo="Ofertas de trabajo"
            subtitulo="Nuevos trabajos disponibles"
            value={notifOfertas}
            onValueChange={handleToggleOfertas}
            guardando={!!guardandoKeys.notifOfertas}
            colors={colors}
            styles={styles}
          />
          <ToggleRow
            icon="chatbubble-outline"
            titulo="Mensajes"
            subtitulo="Nuevos mensajes de chat"
            value={notifMensajes}
            onValueChange={handleToggleMensajes}
            guardando={!!guardandoKeys.notifMensajes}
            colors={colors}
            styles={styles}
          />
          <ToggleRow
            icon="star-outline"
            iconColor={colors.warning}
            titulo="Reseñas"
            subtitulo="Cuando te califican"
            value={notifResenas}
            onValueChange={handleToggleResenas}
            guardando={!!guardandoKeys.notifResenas}
            colors={colors}
            styles={styles}
          />
          <ToggleRow
            icon="volume-high-outline"
            titulo="Sonido"
            subtitulo="Reproducir sonido"
            value={notifSonido}
            onValueChange={handleToggleSonido}
            guardando={!!guardandoKeys.notifSonido}
            colors={colors}
            styles={styles}
          />
          <ToggleRow
            icon="phone-portrait-outline"
            titulo="Vibración"
            subtitulo="Vibrar con notificaciones"
            value={notifVibracion}
            onValueChange={handleToggleVibracion}
            guardando={!!guardandoKeys.notifVibracion}
            colors={colors}
            styles={styles}
          />
        </SectionCard>

        {/* ---------- Privacidad y datos ---------- */}
        <SectionCard
          titulo="Privacidad y datos"
          subtitulo="Controlá tu información"
          colors={colors}
          styles={styles}
        >
          <ToggleRow
            icon="location-outline"
            iconColor={colors.danger}
            titulo="Ubicación"
            subtitulo="Acceder a tu ubicación"
            value={ubicacion}
            onValueChange={handleToggleUbicacion}
            guardando={!!guardandoKeys.ubicacionHabilitada}
            colors={colors}
            styles={styles}
          />
          <ToggleRow
            icon="analytics-outline"
            iconColor={colors.teal}
            titulo="Datos de uso"
            subtitulo="Ayudanos a mejorar la app"
            value={analitica}
            onValueChange={handleToggleAnalitica}
            guardando={!!guardandoKeys.datosUso}
            colors={colors}
            styles={styles}
          />
        </SectionCard>

        {/* ---------- Cuenta ---------- */}
        <SectionCard
          titulo="Cuenta"
          subtitulo="Gestioná tu cuenta"
          colors={colors}
          styles={styles}
        >
          <SettingRow
            icon="person-outline"
            titulo="Editar perfil"
            subtitulo="Modificá tus datos"
            onPress={() => setModalProfile(true)}
            colors={colors}
            styles={styles}
          />
          <SettingRow
            icon="lock-closed-outline"
            titulo="Cambiar contraseña"
            subtitulo="Actualizá tu contraseña"
            onPress={() => setModalPassword(true)}
            colors={colors}
            styles={styles}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor={colors.teal}
            titulo="Verificación en dos pasos"
            subtitulo="Protección extra"
            onPress={() => Alert.alert('Próximamente', 'Disponible pronto')}
            colors={colors}
            styles={styles}
          />
        </SectionCard>

        {/* ---------- Ayuda ---------- */}
        <SectionCard titulo="Ayuda y soporte" colors={colors} styles={styles}>
          <SettingRow
            icon="help-circle-outline"
            titulo="Centro de ayuda"
            subtitulo="Preguntas frecuentes"
            onPress={() => Alert.alert('Ayuda', 'Ayuda disponible pronto')}
            colors={colors}
            styles={styles}
          />
          <SettingRow
            icon="mail-outline"
            titulo="Contacto"
            subtitulo="Escribinos"
            onPress={() => Alert.alert('Contacto', 'soporte@rading.com')}
            colors={colors}
            styles={styles}
          />
          <SettingRow
            icon="document-text-outline"
            titulo="Términos y condiciones"
            subtitulo="Información legal"
            onPress={() => Alert.alert('Términos', 'Términos disponibles en la web')}
            colors={colors}
            styles={styles}
          />
          <SettingRow
            icon="shield-outline"
            titulo="Política de privacidad"
            subtitulo="Cómo usamos tus datos"
            onPress={() => Alert.alert('Privacidad', 'Política disponible en la web')}
            colors={colors}
            styles={styles}
          />
        </SectionCard>

        {/* ---------- Info de la app ---------- */}
        <SectionCard titulo="Acerca de Rading" colors={colors} styles={styles}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Versión</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Build</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>2026.01</Text>
          </View>
        </SectionCard>

        {/* ---------- Cerrar sesión ---------- */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: `${colors.danger}30` }]}
            onPress={confirmarCerrarSesion}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.logoutTexto, { color: colors.danger }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ---------- Modales ---------- */}
      <PasswordModal
        visible={modalPassword}
        onCerrar={() => setModalPassword(false)}
        colors={colors}
        styles={styles}
      />
      <ProfileModal
        visible={modalProfile}
        onCerrar={() => setModalProfile(false)}
        colors={colors}
        navigation={navigation}
        usuario={usuario}
        styles={styles}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Estilos                                                            */
/* ------------------------------------------------------------------ */

const createStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ★ CAMBIO: loader inicial de pantalla completa
  loaderFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: '600',
  },

  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backTexto: { fontSize: 14, fontWeight: '700' },
  backTitulo: { fontSize: 16, fontWeight: '800' },
  card: {
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitulo: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  cardSubtitulo: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitulo: { fontSize: 13.5, fontWeight: '700' },
  settingSubtitulo: { fontSize: 11, marginTop: 1, fontWeight: '500' },

  // ★ CAMBIO: wrapper para alinear spinner + switch
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700' },
  infoDivider: { height: 1, marginVertical: 4 },
  logoutSection: { paddingHorizontal: 16, paddingTop: 24 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  logoutTexto: { fontSize: 14, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitulo: { fontSize: 16, fontWeight: '800' },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 18,
    paddingTop: 14,
  },
  modalCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelarTexto: { fontSize: 14, fontWeight: '700' },
  modalGuardar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalGuardarTexto: { fontSize: 14, fontWeight: '700' },
  passwordContent: { padding: 18, gap: 14 },
  passwordField: { gap: 6 },
  passwordLabel: { fontSize: 12, fontWeight: '700' },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  profileContent: { padding: 18, gap: 4 },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  profileOptionText: { flex: 1, fontSize: 14, fontWeight: '600' },
});