import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../Header';
import BottomNavBarTrabajador from './Navegadortrabajador';
import API_URL from '../configS';
import { useTheme } from '../ThemeContext';

/* ==================================================================== */
/*  TOKENS                                                              */
/* ==================================================================== */

const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const NAVY = '#0A1230';
const WHITE = '#FFFFFF';
const BG = '#F2F4FC';
const GRAY_TEXT = '#5C6478';
const GRAY_SOFT = '#8A90A6';
const CARD_BORDER = 'rgba(61,78,234,0.12)';
const TEAL = '#0EA5A0';
const TEAL_DEEP = '#0B8580';
const TEAL_BG = 'rgba(14,165,160,0.10)';
const TEAL_BORDER = 'rgba(14,165,160,0.25)';
const DANGER = '#E5484D';
const AMBER = '#F5A623';
const CHIP_OFF_BG = '#EDEFF7';
const CHIP_OFF_BORDER = '#DFE3F2';
const SUCCESS = '#10B981';
const SUCCESS_BG = 'rgba(16,185,129,0.10)';
const SUCCESS_BORDER = 'rgba(16,185,129,0.25)';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_NOMBRE = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };

/* ------------------------------------------------------------------ */
/*  Pantalla principal: Configuración del Trabajador                  */
/* ------------------------------------------------------------------ */

export default function ConfiguracionTrabajador(props) {
  const { colors, isDark } = useTheme();
  const usuario = props.usuario ?? props.route?.params?.usuario;
  const navigation = props.navigation ?? null;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  /* ---------------- Estado ---------------- */
  const [disponible, setDisponible] = useState(true);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('18:00');
  const [diasDisponibles, setDiasDisponibles] = useState(['L', 'M', 'X', 'J', 'V']);
  const [radioCobertura, setRadioCobertura] = useState(5);

  const [notifOfertas, setNotifOfertas] = useState(true);
  const [notifEmergencias, setNotifEmergencias] = useState(true);
  const [notifMensajes, setNotifMensajes] = useState(true);
  const [notifResenas, setNotifResenas] = useState(true);
  const [notifSonido, setNotifSonido] = useState(true);
  const [notifVibracion, setNotifVibracion] = useState(true);

  const [atiendeEmergencias, setAtiendeEmergencias] = useState(false);
  const [aceptaSubastas, setAceptaSubastas] = useState(true);
  const [aceptaFijos, setAceptaFijos] = useState(true);
  const [visibilidadPerfil, setVisibilidadPerfil] = useState(true);

  const [modalHorario, setModalHorario] = useState(false);
  const [modalDias, setModalDias] = useState(false);
  const [modalRadio, setModalRadio] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);

  const [cargando, setCargando] = useState(false);

  /* ---------------- Cargar configuración ---------------- */
  const cargarConfiguracion = useCallback(async () => {
    setCargando(true);
    try {
      // Aquí iría la llamada al backend para cargar la configuración del trabajador
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  /* ---------------- Handlers ---------------- */
  const toggleDisponibilidad = async (valor) => {
    setDisponible(valor);
    try {
      // PATCH al backend
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la disponibilidad');
      setDisponible(!valor);
    }
  };

  const guardarHorario = async (inicio, fin) => {
    setHorarioInicio(inicio);
    setHorarioFin(fin);
    setModalHorario(false);
  };

  const guardarDias = async (dias) => {
    setDiasDisponibles(dias);
    setModalDias(false);
  };

  const guardarRadio = async (radio) => {
    setRadioCobertura(radio);
    setModalRadio(false);
  };

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => navigation?.navigate?.('Login') },
      ]
    );
  };

  // Componentes movidos dentro del componente principal
  const SettingRow = ({ icon, iconColor = INDIGO, titulo, subtitulo, onPress, rightContent, disabled }) => (
    <TouchableOpacity
      style={[styles.settingRow, disabled && { opacity: 0.5 }]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.65}
      disabled={disabled}
    >
      <View style={[styles.settingIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.settingSubtitulo}>{subtitulo}</Text> : null}
      </View>
      {rightContent || (
        <Ionicons name="chevron-forward" size={16} color="rgba(10,18,48,0.25)" />
      )}
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, iconColor = INDIGO, titulo, subtitulo, value, onValueChange, disabled }) => (
    <View style={[styles.settingRow, disabled && { opacity: 0.5 }]}>
      <View style={[styles.settingIconWrap, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.settingSubtitulo}>{subtitulo}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        trackColor={{ false: CHIP_OFF_BORDER, true: TEAL_BORDER }}
        thumbColor={value ? TEAL : WHITE}
        disabled={disabled}
      />
    </View>
  );

  const SectionCard = ({ titulo, subtitulo, children, style }) => (
    <View style={[styles.card, style]}>
      <View style={{ marginBottom: 4 }}>
        <Text style={styles.cardTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.cardSubtitulo}>{subtitulo}</Text> : null}
      </View>
      {children}
    </View>
  );

  const HorarioModal = ({ visible, horaInicio, horaFin, onCerrar, onGuardar }) => {
    const [inicio, setInicio] = useState(horaInicio);
    const [fin, setFin] = useState(horaFin);

    useEffect(() => {
      if (visible) {
        setInicio(horaInicio);
        setFin(horaFin);
      }
    }, [visible, horaInicio, horaFin]);

    const horas = [];
    for (let h = 0; h < 24; h++) {
      horas.push(`${String(h).padStart(2, '0')}:00`);
    }

    const minutos = ['00', '15', '30', '45'];

    const renderPicker = (valor, onChange, label) => {
      const [h, m] = valor.split(':');
      return (
        <View style={styles.horarioPickerWrap}>
          <Text style={styles.horarioLabel}>{label}</Text>
          <View style={styles.horarioPickerRow}>
            <View style={styles.horarioWheel}>
              {horas.map((hh) => (
                <TouchableOpacity
                  key={hh}
                  style={[styles.horarioOption, h === hh.split(':')[0] && styles.horarioOptionActive]}
                  onPress={() => onChange(`${hh.split(':')[0]}:${m}`)}
                >
                  <Text style={[styles.horarioOptionText, h === hh.split(':')[0] && styles.horarioOptionTextActive]}>
                    {hh}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.horarioWheel}>
              {minutos.map((mm) => (
                <TouchableOpacity
                  key={mm}
                  style={[styles.horarioOption, m === mm && styles.horarioOptionActive]}
                  onPress={() => onChange(`${h}:${mm}`)}
                >
                  <Text style={[styles.horarioOptionText, m === mm && styles.horarioOptionTextActive]}>
                    {mm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
        <Pressable style={styles.modalOverlay} onPress={onCerrar}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Horario de atención</Text>
                <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={GRAY_TEXT} />
                </TouchableOpacity>
              </View>

              <View style={styles.horarioContent}>
                {renderPicker(inicio, setInicio, 'Desde')}
                <View style={styles.horarioSep} />
                {renderPicker(fin, setFin, 'Hasta')}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelar} onPress={onCerrar} activeOpacity={0.8}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalGuardar} onPress={() => onGuardar(inicio, fin)} activeOpacity={0.88}>
                  <Text style={styles.modalGuardarTexto}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  };

  const DiasModal = ({ visible, diasActivos, onCerrar, onGuardar }) => {
    const [dias, setDias] = useState(diasActivos);

    useEffect(() => {
      if (visible) setDias(diasActivos);
    }, [visible, diasActivos]);

    const toggleDia = (d) => {
      setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
        <Pressable style={styles.modalOverlay} onPress={onCerrar}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Días disponibles</Text>
                <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={GRAY_TEXT} />
                </TouchableOpacity>
              </View>

              <View style={styles.diasModalGrid}>
                {DIAS.map((d) => {
                  const activo = dias.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.diaModalChip, activo && styles.diaModalChipActivo]}
                      onPress={() => toggleDia(d)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.diaModalChipTexto, activo && styles.diaModalChipTextoActivo]}>
                        {DIAS_NOMBRE[d]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelar} onPress={onCerrar} activeOpacity={0.8}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalGuardar} onPress={() => onGuardar(dias)} activeOpacity={0.88}>
                  <Text style={styles.modalGuardarTexto}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  };

  const RadioModal = ({ visible, valorActual, onCerrar, onGuardar }) => {
    const [valor, setValor] = useState(String(valorActual));

    useEffect(() => {
      if (visible) setValor(String(valorActual));
    }, [visible, valorActual]);

    const opciones = [1, 2, 3, 5, 8, 10, 15, 20, 30, 50];

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
        <Pressable style={styles.modalOverlay} onPress={onCerrar}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Radio de cobertura</Text>
                <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={GRAY_TEXT} />
                </TouchableOpacity>
              </View>

              <Text style={styles.radioSubtitle}>
                ¿A qué distancia estás dispuesto a viajar para un trabajo?
              </Text>

              <View style={styles.radioGrid}>
                {opciones.map((km) => {
                  const activo = Number(valor) === km;
                  return (
                    <TouchableOpacity
                      key={km}
                      style={[styles.radioChip, activo && styles.radioChipActivo]}
                      onPress={() => setValor(String(km))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.radioChipTexto, activo && styles.radioChipTextoActivo]}>
                        {km} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelar} onPress={onCerrar} activeOpacity={0.8}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalGuardar} onPress={() => onGuardar(Number(valor))} activeOpacity={0.88}>
                  <Text style={styles.modalGuardarTexto}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  };

  const PasswordModal = ({ visible, onCerrar }) => {
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
        // Aquí iría la llamada al backend para cambiar la contraseña
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
        <Pressable style={styles.modalOverlay} onPress={onCerrar}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Cambiar contraseña</Text>
                <TouchableOpacity onPress={onCerrar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={GRAY_TEXT} />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContent}>
                <View style={styles.passwordField}>
                  <Text style={styles.passwordLabel}>Contraseña actual</Text>
                  <View style={styles.passwordInputRow}>
                    <TextInput
                      style={styles.passwordInput}
                      value={actual}
                      onChangeText={setActual}
                      secureTextEntry={!mostrarActual}
                      placeholder="••••••••"
                      placeholderTextColor={GRAY_SOFT}
                    />
                    <TouchableOpacity onPress={() => setMostrarActual(!mostrarActual)}>
                      <Ionicons name={mostrarActual ? 'eye-off' : 'eye'} size={18} color={GRAY_SOFT} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordField}>
                  <Text style={styles.passwordLabel}>Nueva contraseña</Text>
                  <View style={styles.passwordInputRow}>
                    <TextInput
                      style={styles.passwordInput}
                      value={nueva}
                      onChangeText={setNueva}
                      secureTextEntry={!mostrarNueva}
                      placeholder="••••••••"
                      placeholderTextColor={GRAY_SOFT}
                    />
                    <TouchableOpacity onPress={() => setMostrarNueva(!mostrarNueva)}>
                      <Ionicons name={mostrarNueva ? 'eye-off' : 'eye'} size={18} color={GRAY_SOFT} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordField}>
                  <Text style={styles.passwordLabel}>Confirmar nueva contraseña</Text>
                  <View style={styles.passwordInputRow}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmar}
                      onChangeText={setConfirmar}
                      secureTextEntry={!mostrarConfirmar}
                      placeholder="••••••••"
                      placeholderTextColor={GRAY_SOFT}
                    />
                    <TouchableOpacity onPress={() => setMostrarConfirmar(!mostrarConfirmar)}>
                      <Ionicons name={mostrarConfirmar ? 'eye-off' : 'eye'} size={18} color={GRAY_SOFT} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelar} onPress={onCerrar} activeOpacity={0.8}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalGuardar, guardando && { opacity: 0.7 }]}
                  onPress={handleGuardar}
                  activeOpacity={0.88}
                  disabled={guardando}
                >
                  <Text style={styles.modalGuardarTexto}>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    );
  };

  /* ---------------- Render ---------------- */
  return (
    <View style={styles.root}>
      <Header usuario={usuario} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Disponibilidad ---------- */}
        <SectionCard
          titulo="Disponibilidad"
          subtitulo="Controlá cuándo recibís ofertas de trabajo"
        >
          <ToggleRow
            icon="power"
            iconColor={disponible ? SUCCESS : GRAY_SOFT}
            titulo="Disponible para trabajar"
            subtitulo={disponible ? 'Recibiendo ofertas' : 'No estás recibiendo ofertas'}
            value={disponible}
            onValueChange={toggleDisponibilidad}
          />
        </SectionCard>

        {/* ---------- Horarios y cobertura ---------- */}
        <SectionCard
          titulo="Horarios y cobertura"
          subtitulo="Cuándo y dónde querés trabajar"
        >
          <SettingRow
            icon="time-outline"
            titulo="Horario de atención"
            subtitulo={`${horarioInicio} a ${horarioFin} hs`}
            onPress={() => setModalHorario(true)}
          />
          <SettingRow
            icon="calendar-outline"
            titulo="Días disponibles"
            subtitulo={diasDisponibles.map((d) => DIAS_NOMBRE[d]).join(', ')}
            onPress={() => setModalDias(true)}
          />
          <SettingRow
            icon="navigate-outline"
            titulo="Radio de cobertura"
            subtitulo={`Hasta ${radioCobertura} km de distancia`}
            onPress={() => setModalRadio(true)}
          />
        </SectionCard>

        {/* ---------- Preferencias de trabajo ---------- */}
        <SectionCard
          titulo="Preferencias de trabajo"
          subtitulo="Definí qué tipo de trabajos querés recibir"
        >
          <ToggleRow
            icon="flash"
            iconColor={AMBER}
            titulo="Atender emergencias"
            subtitulo="Trabajos urgentes fuera de tu horario"
            value={atiendeEmergencias}
            onValueChange={setAtiendeEmergencias}
          />
          <ToggleRow
            icon="hammer-outline"
            titulo="Trabajos con precio fijo"
            subtitulo="Ofertas con precio establecido"
            value={aceptaFijos}
            onValueChange={setAceptaFijos}
          />
          <ToggleRow
            icon="trophy-outline"
            titulo="Participar en subastas"
            subtitulo="Ofertas por competencia de precios"
            value={aceptaSubastas}
            onValueChange={setAceptaSubastas}
          />
          <ToggleRow
            icon="eye-outline"
            titulo="Perfil visible"
            subtitulo="Los clientes pueden ver tu perfil"
            value={visibilidadPerfil}
            onValueChange={setVisibilidadPerfil}
          />
        </SectionCard>

        {/* ---------- Notificaciones ---------- */}
        <SectionCard
          titulo="Notificaciones"
          subtitulo="Elegí qué avisos querés recibir"
        >
          <ToggleRow
            icon="briefcase-outline"
            titulo="Nuevas ofertas de trabajo"
            subtitulo="Cuando hay trabajos disponibles en tu zona"
            value={notifOfertas}
            onValueChange={setNotifOfertas}
          />
          <ToggleRow
            icon="alert-circle-outline"
            iconColor={DANGER}
            titulo="Emergencias"
            subtitulo="Trabajos urgentes que coincidan con tu perfil"
            value={notifEmergencias}
            onValueChange={setNotifEmergencias}
          />
          <ToggleRow
            icon="chatbubble-outline"
            titulo="Mensajes"
            subtitulo="Nuevos mensajes de clientes"
            value={notifMensajes}
            onValueChange={setNotifMensajes}
          />
          <ToggleRow
            icon="star-outline"
            iconColor={AMBER}
            titulo="Reseñas"
            subtitulo="Cuando un cliente te califica"
            value={notifResenas}
            onValueChange={setNotifResenas}
          />
          <ToggleRow
            icon="volume-high-outline"
            titulo="Sonido"
            subtitulo="Reproducir sonido con las notificaciones"
            value={notifSonido}
            onValueChange={setNotifSonido}
          />
          <ToggleRow
            icon="phone-portrait-outline"
            titulo="Vibración"
            subtitulo="Vibrar con las notificaciones"
            value={notifVibracion}
            onValueChange={setNotifVibracion}
          />
        </SectionCard>

        {/* ---------- Seguridad ---------- */}
        <SectionCard
          titulo="Seguridad"
          subtitulo="Protegé tu cuenta"
        >
          <SettingRow
            icon="lock-closed-outline"
            titulo="Cambiar contraseña"
            subtitulo="Actualizá tu contraseña de acceso"
            onPress={() => setModalPassword(true)}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor={TEAL}
            titulo="Verificación en dos pasos"
            subtitulo="Agregá una capa extra de seguridad"
            onPress={() => Alert.alert('Próximamente', 'La verificación en dos pasos estará disponible pronto')}
          />
        </SectionCard>

        {/* ---------- Cuenta ---------- */}
        <SectionCard
          titulo="Cuenta"
          subtitulo="Opciones de tu cuenta"
        >
          <SettingRow
            icon="person-outline"
            titulo="Editar perfil"
            subtitulo="Modificá tus datos personales y profesionales"
            onPress={() => navigation?.navigate?.('PerfilTrabajador', { usuario })}
          />
          <SettingRow
            icon="help-circle-outline"
            titulo="Ayuda y soporte"
            subtitulo="Contactanos si tenés dudas"
            onPress={() => Alert.alert('Soporte', 'Escribinos a soporte@rading.com')}
          />
          <SettingRow
            icon="document-text-outline"
            titulo="Términos y condiciones"
            subtitulo="Información legal de la plataforma"
            onPress={() => Alert.alert('Términos', 'Los términos y condiciones están disponibles en nuestra web')}
          />
        </SectionCard>

        {/* ---------- Cerrar sesión ---------- */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmarCerrarSesion} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={DANGER} />
            <Text style={styles.logoutTexto}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBarTrabajador usuario={usuario} pantallaActiva="configuracion" />

      {/* ---------- Modales ---------- */}
      <HorarioModal
        visible={modalHorario}
        horaInicio={horarioInicio}
        horaFin={horarioFin}
        onCerrar={() => setModalHorario(false)}
        onGuardar={guardarHorario}
      />

      <DiasModal
        visible={modalDias}
        diasActivos={diasDisponibles}
        onCerrar={() => setModalDias(false)}
        onGuardar={guardarDias}
      />

      <RadioModal
        visible={modalRadio}
        valorActual={radioCobertura}
        onCerrar={() => setModalRadio(false)}
        onGuardar={guardarRadio}
      />

      <PasswordModal
        visible={modalPassword}
        onCerrar={() => setModalPassword(false)}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Estilos                                                            */
/* ------------------------------------------------------------------ */

const createStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },

  /* Cards */
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitulo: { fontSize: 15.5, fontWeight: '800', color: INDIGO_DEEP, letterSpacing: -0.2 },
  cardSubtitulo: { fontSize: 11.5, color: colors.textTertiary, fontWeight: '600', marginTop: 2 },

  /* Setting rows */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitulo: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  settingSubtitulo: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
    fontWeight: '500',
  },

  /* Logout */
  logoutSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.2)',
  },
  logoutTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: DANGER,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.borderLight,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
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
    backgroundColor: CHIP_OFF_BG,
    alignItems: 'center',
  },
  modalCancelarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalGuardar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: INDIGO,
    alignItems: 'center',
  },
  modalGuardarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE,
  },

  /* Horario modal */
  horarioContent: {
    padding: 18,
  },
  horarioPickerWrap: {
    marginBottom: 8,
  },
  horarioLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horarioPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  horarioWheel: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
  },
  horarioOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  horarioOptionActive: {
    backgroundColor: INDIGO,
  },
  horarioOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  horarioOptionTextActive: {
    color: WHITE,
  },
  horarioSep: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },

  /* Días modal */
  diasModalGrid: {
    padding: 18,
    gap: 10,
  },
  diaModalChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
    alignItems: 'center',
  },
  diaModalChipActivo: {
    backgroundColor: INDIGO,
    borderColor: INDIGO,
  },
  diaModalChipTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  diaModalChipTextoActivo: {
    color: WHITE,
  },

  /* Radio modal */
  radioSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 18,
    paddingTop: 4,
    lineHeight: 18,
  },
  radioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 18,
  },
  radioChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: CHIP_OFF_BG,
    borderWidth: 1,
    borderColor: CHIP_OFF_BORDER,
  },
  radioChipActivo: {
    backgroundColor: INDIGO,
    borderColor: INDIGO,
  },
  radioChipTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  radioChipTextoActivo: {
    color: WHITE,
  },

  /* Password modal */
  passwordContent: {
    padding: 18,
    gap: 14,
  },
  passwordField: {
    gap: 6,
  },
  passwordLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
});
