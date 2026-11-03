import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Platform, KeyboardAvoidingView, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from './asyncStorage';
import API_URL from './configS';
import axios from 'axios';
import { useTheme } from './ThemeContext';

const BLUE      = '#1565D8';
const BLUE_DARK = '#0D47A8';
const BLUE_SOFT = '#EAF1FD';
const DANGER    = '#E53E3E';
const OK        = '#2F9E5B';

// ─── Geocoding (funciona en web y en mobile) ───────────────────────────────
// En WEB el navegador NO permite setear "User-Agent" y los headers custom
// disparan preflight de CORS, así que ahí no se manda ningún header.
// En MOBILE (React Native) no hay CORS y Nominatim pide un User-Agent propio.
// Cambiá el contacto por un mail/URL real de tu app (lo pide la política de uso).
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 1000; // Nominatim permite máx. 1 request por segundo

const buscarEnNominatim = (texto, signal) =>
  axios.get(NOMINATIM_URL, {
    params: {
      q: texto,
      format: 'json',
      addressdetails: 1,
      limit: 5,
      countrycodes: 'ar',
      'accept-language': 'es', // como parámetro, no como header
    },
    headers: Platform.OS === 'web' ? {} : { 'User-Agent': 'RadingApp/1.0 (contacto@rading.app)' },
    signal,
    timeout: 8000,
  });

// ─── InputField reutilizable ───────────────────────────────────────────────
// Arma sus propios estilos, no hace falta pasarle "inputStyles".
function InputField({
  label, placeholder, secureTextEntry, keyboardType, value, onChangeText,
  error, editable = true, icon, rightSlot,
}) {
  const { colors, isDark } = useTheme();
  const inputStyles = useMemo(() => createInputStyles(colors, isDark), [colors, isDark]);
  const [focus, setFocus] = useState(false);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View
        style={[
          inputStyles.box,
          focus && inputStyles.boxFocus,
          error && inputStyles.boxError,
          !editable && inputStyles.boxDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={17}
            color={error ? DANGER : focus ? BLUE : colors.textTertiary}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={inputStyles.input}
          autoCapitalize="none"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {rightSlot}
      </View>
      {error ? (
        <View style={inputStyles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={DANGER} />
          <Text style={inputStyles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Encabezado de sección ─────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, styles }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={15} color={BLUE_DARK} />
      </View>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────
export default function Registrarse({ route, navigation }) {
  const { colors, isDark, syncUsuario } = useTheme();

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: '', apellido: '', dni: '', fechaNac: '',
      email: '', telefono: '', direccion: '',
      contrasena: '', repetirContrasena: '',
    },
    mode: 'onSubmit',
  });

  // lat/lng no se validan como campo de formulario
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [verPass, setVerPass] = useState(false);
  const [verPass2, setVerPass2] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // ── Dirección
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [direccionValidada, setDireccionValidada] = useState(false);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const direccionValidadaRef = useRef(false); // el ref evita leer un valor viejo en `validate`
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  // ── Fecha
  const [mostrarPickerModal, setMostrarPickerModal] = useState(false);
  const [diaTemp, setDiaTemp] = useState('');
  const [mesTemp, setMesTemp] = useState('');
  const [anioTemp, setAnioTemp] = useState('');

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const inputStyles = useMemo(() => createInputStyles(colors, isDark), [colors, isDark]);

  // Limpiar timers y requests pendientes al salir de la pantalla
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── Helpers de validación
  const validarDNI      = (dni) => { const s = dni.replace(/\D/g, ''); return s.length >= 7 && s.length <= 8; };
  const validarTelefono = (tel) => { const s = tel.replace(/\D/g, ''); return s.length >= 10 && s.length <= 13; };
  const calcularEdad    = (f)   => {
    const hoy = new Date(); const nac = new Date(f);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  // ── Fecha modal
  const confirmarFecha = () => {
    const dia = parseInt(diaTemp), mes = parseInt(mesTemp), anio = parseInt(anioTemp);
    if (!dia || !mes || !anio || dia < 1 || dia > 31 || mes < 1 || mes > 12 || anio < 1900 || anio > new Date().getFullYear()) {
      alert('Ingresá una fecha válida'); return;
    }
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (isNaN(new Date(fechaStr).getTime())) { alert('Fecha inválida'); return; }
    setValue('fechaNac', fechaStr, { shouldValidate: true });
    setMostrarPickerModal(false);
  };

  // ── Dirección autocomplete
  const buscarDireccion = (texto, onChange) => {
    onChange(texto);
    direccionValidadaRef.current = false;
    setDireccionValidada(false);
    setLat(null);
    setLng(null);
    setErrorBusqueda('');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (texto.trim().length < 4) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      setBuscandoDireccion(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const miId = ++requestIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      setBuscandoDireccion(true);
      try {
        const res = await buscarEnNominatim(texto.trim(), controller.signal);
        // Si mientras esperaba el usuario siguió escribiendo, ignoramos esta respuesta
        if (miId !== requestIdRef.current) return;
        setSugerencias(res.data);
        setMostrarSugerencias(true);
      } catch (e) {
        if (axios.isCancel?.(e) || e.name === 'CanceledError' || e.name === 'AbortError') return;
        if (miId !== requestIdRef.current) return;
        setSugerencias([]);
        if (e.response?.status === 429) {
          setErrorBusqueda('Demasiadas búsquedas seguidas. Esperá unos segundos y probá de nuevo.');
        } else {
          setErrorBusqueda('No se pudo buscar la dirección. Revisá tu conexión.');
        }
      } finally {
        if (miId === requestIdRef.current) setBuscandoDireccion(false);
      }
    }, DEBOUNCE_MS);
  };

  const elegirDireccion = (item) => {
    // Primero marcamos como validada (ref), después seteamos el valor y validamos
    direccionValidadaRef.current = true;
    setDireccionValidada(true);
    setValue('direccion', item.display_name, { shouldValidate: true });
    clearErrors('direccion');
    setLat(parseFloat(item.lat));
    setLng(parseFloat(item.lon));
    setSugerencias([]);
    setMostrarSugerencias(false);
    setErrorBusqueda('');
  };

  // ── Submit
  const onSubmit = async (data) => {
    setEnviando(true);
    try {
      const response = await fetch(`${API_URL}/usuario/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre.trim(), apellido: data.apellido.trim(),
          email: data.email.trim(), direccion: data.direccion.trim(),
          lat, lng,
          contrasena: data.contrasena, telefono: data.telefono.trim(),
          fechaNac: data.fechaNac, dni: data.dni.replace(/\D/g, ''),
        }),
      });
      const respData = await response.json();
      if (!response.ok) { alert(respData.message || 'Error al registrar'); return; }

      if (respData.idUsuario) {
        await AsyncStorage.setItem('@rading_user_id', String(respData.idUsuario));
        syncUsuario(respData.idUsuario);
      }

      navigation.navigate('TipoUsuario', { idUsuario: respData.idUsuario, email: data.email });
    } catch (error) {
      alert('No se pudo conectar al servidor');
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: BLUE }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}
        <LinearGradient colors={[BLUE_DARK, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="person-add" size={22} color="#fff" />
          </View>
          <Text style={styles.tagline}>Creá tu cuenta</Text>
          <Text style={styles.subtitle}>Sumate a Rading en menos de 2 minutos</Text>
        </LinearGradient>

        <View style={styles.card}>

          {/* ── IDENTIDAD ── */}
          <SectionHeader icon="person" title="Identidad" subtitle="Tus datos personales" styles={styles} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Controller
                control={control}
                name="nombre"
                rules={{
                  required: 'Ingresá un nombre válido',
                  validate: (v) => v.trim().length >= 2 || 'Ingresá un nombre válido',
                }}
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Nombre" placeholder="Juan" icon="person-outline"
                    value={value} onChangeText={onChange} error={errors.nombre?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="apellido"
                rules={{
                  required: 'Ingresá un apellido válido',
                  validate: (v) => v.trim().length >= 2 || 'Ingresá un apellido válido',
                }}
                render={({ field: { value, onChange } }) => (
                  <InputField
                    label="Apellido" placeholder="García" icon="person-outline"
                    value={value} onChangeText={onChange} error={errors.apellido?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="dni"
            rules={{
              required: 'El DNI debe tener 7 u 8 dígitos',
              validate: (v) => validarDNI(v) || 'El DNI debe tener 7 u 8 dígitos',
            }}
            render={({ field: { value, onChange } }) => (
              <InputField
                label="DNI / Documento" placeholder="00000000" icon="card-outline" keyboardType="numeric"
                value={value} onChangeText={onChange} error={errors.dni?.message}
              />
            )}
          />

          {/* Fecha de nacimiento */}
          <Controller
            control={control}
            name="fechaNac"
            rules={{
              required: 'Seleccioná tu fecha de nacimiento',
              validate: (v) => (v && calcularEdad(v) >= 18) || 'Debés tener al menos 18 años',
            }}
            render={({ field: { value } }) => (
              <View style={inputStyles.wrapper}>
                <Text style={inputStyles.label}>Fecha de nacimiento</Text>
                <TouchableOpacity
                  onPress={() => setMostrarPickerModal(true)}
                  style={[inputStyles.box, errors.fechaNac && inputStyles.boxError]}
                >
                  <Ionicons name="calendar-outline" size={17} color={errors.fechaNac ? DANGER : colors.textTertiary} style={{ marginRight: 10 }} />
                  <Text style={[{ flex: 1, fontSize: 14.5, paddingVertical: 8 }, value ? { color: colors.text } : { color: colors.inputPlaceholder }]}>
                    {value || 'Seleccioná tu fecha'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
                {errors.fechaNac ? (
                  <View style={inputStyles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={DANGER} />
                    <Text style={inputStyles.errorText}>{errors.fechaNac.message}</Text>
                  </View>
                ) : null}
              </View>
            )}
          />

          {/* Modal fecha */}
          <Modal visible={mostrarPickerModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="calendar" size={20} color="#fff" />
                </View>
                <Text style={styles.modalTitulo}>Fecha de nacimiento</Text>
                <View style={styles.modalRow}>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Día</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor={colors.inputPlaceholder} value={diaTemp} onChangeText={setDiaTemp} />
                  </View>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Mes</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor={colors.inputPlaceholder} value={mesTemp} onChangeText={setMesTemp} />
                  </View>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Año</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={4} placeholder="AAAA" placeholderTextColor={colors.inputPlaceholder} value={anioTemp} onChangeText={setAnioTemp} />
                  </View>
                </View>
                <View style={styles.modalBotones}>
                  <TouchableOpacity style={styles.modalCancelar} onPress={() => setMostrarPickerModal(false)}>
                    <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirmar} onPress={confirmarFecha}>
                    <Text style={styles.modalConfirmarTexto}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ── CONTACTO ── */}
          <SectionHeader icon="call" title="Contacto" subtitle="Cómo te encontramos" styles={styles} />

          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Ingresá un correo válido (ej: usuario@mail.com)',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Ingresá un correo válido (ej: usuario@mail.com)',
              },
            }}
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Correo electrónico" placeholder="correo@ejemplo.com" icon="mail-outline" keyboardType="email-address"
                value={value} onChangeText={onChange} error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="telefono"
            rules={{
              required: 'Ingresá un teléfono válido (mínimo 10 dígitos)',
              validate: (v) => validarTelefono(v) || 'Ingresá un teléfono válido (mínimo 10 dígitos)',
            }}
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Número de teléfono" placeholder="+54 9 11 0000-0000" icon="call-outline" keyboardType="phone-pad"
                value={value} onChangeText={onChange} error={errors.telefono?.message}
              />
            )}
          />

          {/* Dirección con autocomplete */}
          <Controller
            control={control}
            name="direccion"
            rules={{
              required: 'Seleccioná una dirección de la lista',
              validate: () => direccionValidadaRef.current || 'Seleccioná una dirección de la lista',
            }}
            render={({ field: { value, onChange } }) => (
              <View style={inputStyles.wrapper}>
                <Text style={inputStyles.label}>Dirección</Text>
                <View style={[inputStyles.box, errors.direccion && inputStyles.boxError]}>
                  <Ionicons name="location-outline" size={17} color={errors.direccion ? DANGER : colors.textTertiary} style={{ marginRight: 10 }} />
                  <TextInput
                    placeholder="Av. Siempre Viva 123"
                    placeholderTextColor={colors.inputPlaceholder}
                    style={inputStyles.input}
                    value={value}
                    onChangeText={(texto) => buscarDireccion(texto, onChange)}
                    autoCapitalize="none"
                  />
                  {buscandoDireccion && <Text style={styles.verTexto}>Buscando…</Text>}
                  {direccionValidada && <Ionicons name="checkmark-circle" size={18} color={OK} />}
                </View>

                {errors.direccion ? (
                  <View style={inputStyles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={DANGER} />
                    <Text style={inputStyles.errorText}>{errors.direccion.message}</Text>
                  </View>
                ) : null}

                {errorBusqueda ? (
                  <View style={inputStyles.errorRow}>
                    <Ionicons name="information-circle" size={12} color={DANGER} />
                    <Text style={inputStyles.errorText}>{errorBusqueda}</Text>
                  </View>
                ) : null}

                {mostrarSugerencias && sugerencias.length > 0 && (
                  <View style={styles.sugerenciasContainer}>
                    {sugerencias.map((item, idx) => (
                      <TouchableOpacity
                        key={item.place_id}
                        style={[styles.sugerenciaItem, idx === sugerencias.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => elegirDireccion(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="location" size={14} color={BLUE} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={styles.sugerenciaTexto} numberOfLines={2}>{item.display_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {mostrarSugerencias && !buscandoDireccion && sugerencias.length === 0 && !errorBusqueda && value.trim().length >= 4 && (
                  <Text style={[styles.sugerenciaTexto, { marginTop: 8 }]}>
                    No encontramos esa dirección. Probá agregando la ciudad.
                  </Text>
                )}
              </View>
            )}
          />

          {/* ── SEGURIDAD ── */}
          <SectionHeader icon="lock-closed" title="Seguridad" subtitle="Protegé tu cuenta" styles={styles} />

          <Controller
            control={control}
            name="contrasena"
            rules={{
              required: 'La contraseña debe tener al menos 8 caracteres',
              minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
            }}
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                icon="key-outline"
                secureTextEntry={!verPass}
                value={value}
                onChangeText={onChange}
                error={errors.contrasena?.message}
                rightSlot={
                  <TouchableOpacity onPress={() => setVerPass(v => !v)} hitSlop={8}>
                    <Text style={styles.verTexto}>{verPass ? 'Ocultar' : 'Ver'}</Text>
                  </TouchableOpacity>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="repetirContrasena"
            rules={{
              required: 'Las contraseñas no coinciden',
              validate: (v) => v === getValues('contrasena') || 'Las contraseñas no coinciden',
            }}
            render={({ field: { value, onChange } }) => (
              <InputField
                label="Repetir contraseña"
                placeholder="Confirmá tu clave"
                icon="key-outline"
                secureTextEntry={!verPass2}
                value={value}
                onChangeText={onChange}
                error={errors.repetirContrasena?.message}
                rightSlot={
                  <TouchableOpacity onPress={() => setVerPass2(v => !v)} hitSlop={8}>
                    <Text style={styles.verTexto}>{verPass2 ? 'Ocultar' : 'Ver'}</Text>
                  </TouchableOpacity>
                }
              />
            )}
          />

          {/* Términos */}
          <View style={styles.termsContainer}>
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.textTertiary} style={{ marginRight: 5 }} />
            <Text style={styles.termsText}>Al registrarte aceptás nuestros </Text>
            <View style={styles.termsLinkRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Terminos')}>
                <Text style={styles.termsLink}>Términos</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> y </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Privacidad')}>
                <Text style={styles.termsLink}>Privacidad</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón continuar */}
          <TouchableOpacity activeOpacity={0.88} onPress={handleSubmit(onSubmit)} disabled={enviando}>
            <LinearGradient
              colors={[BLUE, BLUE_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.boton, enviando && { opacity: 0.75 }]}
            >
              <Text style={styles.botonTexto}>{enviando ? 'Creando cuenta...' : 'Continuar'}</Text>
              {!enviando && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLinkRow} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>
              ¿Ya tenés cuenta? <Text style={styles.loginLinkBold}>Iniciar sesión</Text>
            </Text>
          </TouchableOpacity>

        </View>
        <StatusBar style={colors.statusBar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createInputStyles = (colors, isDark) => StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: BLUE_DARK, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 7,
  },
  box: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  boxFocus: { borderColor: BLUE, backgroundColor: isDark ? colors.surfaceVariant : '#fff' },
  boxError: { borderColor: DANGER, backgroundColor: isDark ? 'rgba(229,62,62,0.1)' : '#FDF1F1' },
  boxDisabled: { backgroundColor: isDark ? 'rgba(47,158,91,0.1)' : '#EAF7F0' },
  input: { flex: 1, color: colors.text, fontSize: 14.5, paddingVertical: Platform.OS === 'ios' ? 0 : 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  errorText: { color: DANGER, fontSize: 11.5, fontWeight: '500', flexShrink: 1 },
});

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 60,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  tagline: { color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: '500' },

  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: -34,
    borderRadius: 26,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4, gap: 10 },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: BLUE_SOFT,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { color: colors.text, fontSize: 14.5, fontWeight: '800' },
  sectionSubtitle: { color: colors.textTertiary, fontSize: 11.5, marginTop: 1 },

  row: { flexDirection: 'row' },

  verTexto: { color: BLUE, fontSize: 12, fontWeight: '700' },

  // Dirección
  sugerenciasContainer: {
    backgroundColor: colors.card, borderRadius: 14, marginTop: 8,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    overflow: 'hidden',
  },
  sugerenciaItem: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  sugerenciaTexto: { flex: 1, color: colors.text, fontSize: 12.5, lineHeight: 17 },

  // Términos
  termsContainer: {
    marginTop: 6, marginBottom: 20,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: 12, padding: 10,
  },
  termsText: { color: colors.textSecondary, fontSize: 12 },
  termsLinkRow: { flexDirection: 'row' },
  termsLink: { color: BLUE, fontWeight: '700', fontSize: 12, textDecorationLine: 'underline' },

  // Botón
  boton: {
    height: 54, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: BLUE_DARK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  botonTexto: { color: 'white', fontWeight: '800', fontSize: 15.5 },

  loginLinkRow: { marginTop: 16, alignItems: 'center' },
  loginLinkText: { color: colors.textTertiary, fontSize: 12.5 },
  loginLinkBold: { color: BLUE, fontWeight: '800' },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, width: '86%', alignItems: 'center' },
  modalIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 20, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, width: '100%' },
  modalInputGroup: { flex: 1, alignItems: 'center', marginHorizontal: 6 },
  modalLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  modalInput: {
    backgroundColor: colors.inputBg, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8,
    fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', width: '100%',
    borderWidth: 1, borderColor: colors.border,
  },
  modalBotones: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelar: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  modalCancelarTexto: { color: colors.textSecondary, fontWeight: '700' },
  modalConfirmar: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center' },
  modalConfirmarTexto: { color: 'white', fontWeight: '800' },
});