import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, Platform, KeyboardAvoidingView, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import API_URL from './configS';
import axios from 'axios';

const BLUE      = '#1565D8';
const BLUE_DARK = '#0D47A8';
const BLUE_SOFT = '#EAF1FD';
const INK       = '#1A202C';
const MUTED     = '#8A94A6';
const DANGER    = '#E53E3E';
const OK        = '#2F9E5B';

// ─── InputField reutilizable (sin cambios) ─────────────────────────────────
function InputField({
  label, placeholder, secureTextEntry, keyboardType, value, onChangeText,
  error, editable = true, icon, rightSlot,
}) {
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
            color={error ? DANGER : focus ? BLUE : MUTED}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#A6AEBD"
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

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    color: BLUE_DARK, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 7,
  },
  box: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  boxFocus: { borderColor: BLUE, backgroundColor: '#fff' },
  boxError: { borderColor: DANGER, backgroundColor: '#FDF1F1' },
  boxDisabled: { backgroundColor: '#EAF7F0' },
  input: { flex: 1, color: INK, fontSize: 14.5, paddingVertical: Platform.OS === 'ios' ? 0 : 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  errorText: { color: DANGER, fontSize: 11.5, fontWeight: '500' },
});

// ─── Encabezado de sección (sin cambios) ───────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
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
  // ── react-hook-form: reemplaza el useState(form) + useState(errores) manual
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: '', apellido: '', dni: '', fechaNac: '',
      email: '', telefono: '', direccion: '',
      contrasena: '', repetirContrasena: '',
    },
    mode: 'onSubmit',
  });

  // lat/lng no se validan como campo de formulario, siguen como estado aparte
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
  const debounceRef = useRef(null);

  // ── Fecha
  const [mostrarPickerModal, setMostrarPickerModal] = useState(false);
  const [diaTemp, setDiaTemp] = useState('');
  const [mesTemp, setMesTemp] = useState('');
  const [anioTemp, setAnioTemp] = useState('');

  // ── Helpers de validación (mismas reglas de antes, usadas dentro de `rules`)
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
    // antes: setForm(...). ahora: setValue de react-hook-form, con validación disparada
    setValue('fechaNac', fechaStr, { shouldValidate: true });
    setMostrarPickerModal(false);
  };

  // ── Dirección autocomplete (misma lógica, ahora recibe el onChange del Controller)
  const buscarDireccion = (texto, onChange) => {
    onChange(texto);
    setDireccionValidada(false);
    setLat(null);
    setLng(null);
    if (texto.length < 4) { setSugerencias([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setBuscandoDireccion(true);
      try {
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q: texto, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'ar' },
          headers: { 'Accept-Language': 'es', 'User-Agent': 'RadingApp/1.0' },
        });
        setSugerencias(res.data);
        setMostrarSugerencias(true);
      } catch (e) {
        console.error(e);
      } finally {
        setBuscandoDireccion(false);
      }
    }, 600);
  };

  const elegirDireccion = (item) => {
    setValue('direccion', item.display_name, { shouldValidate: true });
    setLat(parseFloat(item.lat));
    setLng(parseFloat(item.lon));
    setSugerencias([]);
    setMostrarSugerencias(false);
    setDireccionValidada(true);
  };

  // ── Submit: handleSubmit de RHF ya corrió todas las `rules` antes de llegar acá
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

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
          <SectionHeader icon="person" title="Identidad" subtitle="Tus datos personales" />

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

          {/* Fecha de nacimiento — campo custom, se controla con Controller igual */}
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
                  <Ionicons name="calendar-outline" size={17} color={errors.fechaNac ? DANGER : MUTED} style={{ marginRight: 10 }} />
                  <Text style={[{ flex: 1, fontSize: 14.5, paddingVertical: 8 }, value ? { color: INK } : { color: '#A6AEBD' }]}>
                    {value || 'Seleccioná tu fecha'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#C7D2E3" />
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

          {/* Modal fecha (sin cambios) */}
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
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor="#B7C0D1" value={diaTemp} onChangeText={setDiaTemp} />
                  </View>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Mes</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor="#B7C0D1" value={mesTemp} onChangeText={setMesTemp} />
                  </View>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Año</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={4} placeholder="AAAA" placeholderTextColor="#B7C0D1" value={anioTemp} onChangeText={setAnioTemp} />
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
          <SectionHeader icon="call" title="Contacto" subtitle="Cómo te encontramos" />

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

          {/* Dirección con autocomplete — mismo mecanismo de siempre, ahora controlado por RHF */}
          <Controller
            control={control}
            name="direccion"
            rules={{
              required: 'Seleccioná una dirección de la lista',
              validate: () => direccionValidada || 'Seleccioná una dirección de la lista',
            }}
            render={({ field: { value, onChange } }) => (
              <View style={inputStyles.wrapper}>
                <Text style={inputStyles.label}>Dirección</Text>
                <View style={[inputStyles.box, errors.direccion && inputStyles.boxError]}>
                  <Ionicons name="location-outline" size={17} color={errors.direccion ? DANGER : MUTED} style={{ marginRight: 10 }} />
                  <TextInput
                    placeholder="Av. Siempre Viva 123"
                    placeholderTextColor="#A6AEBD"
                    style={inputStyles.input}
                    value={value}
                    onChangeText={(texto) => buscarDireccion(texto, onChange)}
                    autoCapitalize="none"
                  />
                  {direccionValidada && <Ionicons name="checkmark-circle" size={18} color={OK} />}
                </View>
                {errors.direccion ? (
                  <View style={inputStyles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={DANGER} />
                    <Text style={inputStyles.errorText}>{errors.direccion.message}</Text>
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
              </View>
            )}
          />

          {/* ── SEGURIDAD ── */}
          <SectionHeader icon="lock-closed" title="Seguridad" subtitle="Protegé tu cuenta" />

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
              validate: (v) => v === watch('contrasena') || 'Las contraseñas no coinciden',
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

          {/* Términos (sin cambios) */}
          <View style={styles.termsContainer}>
            <Ionicons name="shield-checkmark-outline" size={13} color={MUTED} style={{ marginRight: 5 }} />
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

          {/* Botón continuar — ahora dispara handleSubmit(onSubmit) de RHF */}
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
        <StatusBar style="light" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5FA' },

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
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -34,
    borderRadius: 26,
    padding: 24,
    shadowColor: BLUE_DARK,
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
  sectionTitle: { color: INK, fontSize: 14.5, fontWeight: '800' },
  sectionSubtitle: { color: MUTED, fontSize: 11.5, marginTop: 1 },

  row: { flexDirection: 'row' },

  verTexto: { color: BLUE, fontSize: 12, fontWeight: '700' },

  // Dirección
  sugerenciasContainer: {
    backgroundColor: 'white', borderRadius: 14, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    overflow: 'hidden',
  },
  sugerenciaItem: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F7',
  },
  sugerenciaTexto: { flex: 1, color: INK, fontSize: 12.5, lineHeight: 17 },

  // Términos
  termsContainer: {
    marginTop: 6, marginBottom: 20,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    backgroundColor: '#F5F7FB', borderRadius: 12, padding: 10,
  },
  termsText: { color: '#5B6478', fontSize: 12 },
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
  loginLinkText: { color: MUTED, fontSize: 12.5 },
  loginLinkBold: { color: BLUE, fontWeight: '800' },

  // Modales compartidos
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11,23,53,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '86%', alignItems: 'center' },
  modalIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: INK, marginBottom: 20, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, width: '100%' },
  modalInputGroup: { flex: 1, alignItems: 'center', marginHorizontal: 6 },
  modalLabel: { fontSize: 10.5, fontWeight: '700', color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  modalInput: {
    backgroundColor: '#F5F7FB', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8,
    fontSize: 18, fontWeight: '800', color: INK, textAlign: 'center', width: '100%',
    borderWidth: 1, borderColor: 'rgba(21,101,216,0.08)',
  },
  modalBotones: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelar: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  modalCancelarTexto: { color: '#5B6478', fontWeight: '700' },
  modalConfirmar: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center' },
  modalConfirmarTexto: { color: 'white', fontWeight: '800' },
});