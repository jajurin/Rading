import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import API_URL from './configS';
import axios from 'axios';

function InputField({ label, placeholder, secureTextEntry, keyboardType, value, onChangeText, error }) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#999999"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[inputStyles.input, error && inputStyles.inputError]}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
      <View style={[inputStyles.underline, error && inputStyles.underlineError]} />
      {error ? <Text style={inputStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { color: '#4A5568', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  input: { color: '#1A202C', fontSize: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
  inputError: { color: '#E53E3E' },
  underline: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.15)' },
  underlineError: { backgroundColor: '#E53E3E' },
  errorText: { color: '#E53E3E', fontSize: 11, marginTop: 4 },
});

export default function Registrarse({ route, navigation }) {
  const tipo = route?.params?.tipo ?? '';

  const [form, setForm] = useState({
    nombre: '', apellido: '', dni: '', fechaNac: '',
    email: '', telefono: '', direccion: '',
    contrasena: '', repetirContrasena: '',
  });
  const [errores, setErrores] = useState({});
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [direccionValidada, setDireccionValidada] = useState(false);
  const [mostrarPickerModal, setMostrarPickerModal] = useState(false);
  const [diaTemp, setDiaTemp] = useState('');
  const [mesTemp, setMesTemp] = useState('');
  const [anioTemp, setAnioTemp] = useState('');

  const set = (campo) => (valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: null }));
  };

  const confirmarFecha = () => {
    const dia = parseInt(diaTemp);
    const mes = parseInt(mesTemp);
    const anio = parseInt(anioTemp);
    if (!dia || !mes || !anio || dia < 1 || dia > 31 || mes < 1 || mes > 12 || anio < 1900 || anio > new Date().getFullYear()) {
      alert('Ingresá una fecha válida');
      return;
    }
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const fechaObj = new Date(fechaStr);
    if (isNaN(fechaObj.getTime())) { alert('Fecha inválida'); return; }
    setForm(prev => ({ ...prev, fechaNac: fechaStr }));
    setErrores(prev => ({ ...prev, fechaNac: null }));
    setMostrarPickerModal(false);
  };

  const buscarDireccion = async (texto) => {
    set('direccion')(texto);
    setDireccionValidada(false);
    if (texto.length < 4) { setSugerencias([]); return; }
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: texto, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'ar' },
        headers: { 'Accept-Language': 'es', 'User-Agent': 'RadingApp/1.0' },
      });
      setSugerencias(res.data);
      setMostrarSugerencias(true);
    } catch (e) { console.error(e); }
  };

  const elegirDireccion = (item) => {
    setForm(prev => ({ ...prev, direccion: item.display_name }));
    setErrores(prev => ({ ...prev, direccion: null }));
    setSugerencias([]);
    setMostrarSugerencias(false);
    setDireccionValidada(true);
  };

  const validarDNI = (dni) => { const s = dni.replace(/\D/g, ''); return s.length >= 7 && s.length <= 8; };
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarTelefono = (tel) => { const s = tel.replace(/\D/g, ''); return s.length >= 10 && s.length <= 13; };
  const validarNombre = (texto) => texto.trim().length >= 2;
  const calcularEdad = (f) => {
    const hoy = new Date(); const nac = new Date(f);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  const validarFormulario = () => {
    const e = {};
    if (!validarNombre(form.nombre)) e.nombre = 'Ingresá un nombre válido';
    if (!validarNombre(form.apellido)) e.apellido = 'Ingresá un apellido válido';
    if (!validarDNI(form.dni)) e.dni = 'El DNI debe tener 7 u 8 dígitos';
    if (!form.fechaNac) e.fechaNac = 'Seleccioná tu fecha de nacimiento';
    else if (calcularEdad(form.fechaNac) < 18) e.fechaNac = 'Debés tener al menos 18 años';
    if (!validarEmail(form.email)) e.email = 'Ingresá un correo válido (ej: usuario@mail.com)';
    if (!validarTelefono(form.telefono)) e.telefono = 'Ingresá un teléfono válido (mínimo 10 dígitos)';
    if (!direccionValidada) e.direccion = 'Seleccioná una dirección de la lista';
    if (form.contrasena.length < 8) e.contrasena = 'La contraseña debe tener al menos 8 caracteres';
    if (form.contrasena !== form.repetirContrasena) e.repetirContrasena = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleContinuar = async () => {
    if (!validarFormulario()) return;
    try {
      const response = await fetch(`${API_URL}/usuario/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(), apellido: form.apellido.trim(),
          email: form.email.trim(), direccion: form.direccion.trim(),
          contrasena: form.contrasena, telefono: form.telefono.trim(),
          fechaNac: form.fechaNac, dni: form.dni.replace(/\D/g, ''),
        }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || 'Error al registrar'); return; }
      navigation.navigate('TipoUsuario', { idUsuario: data.idUsuario });
    } catch (error) {
      alert('No se pudo conectar al servidor');
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.tagline}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>Creá tu cuenta</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}><View style={styles.sectionDot} /><Text style={styles.sectionTitle}>Identidad</Text></View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputField label="Nombre" placeholder="Juan" value={form.nombre} onChangeText={set('nombre')} error={errores.nombre} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Apellido" placeholder="García" value={form.apellido} onChangeText={set('apellido')} error={errores.apellido} />
            </View>
          </View>
          <InputField label="DNI / Documento" placeholder="00000000" keyboardType="numeric" value={form.dni} onChangeText={set('dni')} error={errores.dni} />

          {/* FECHA CON MODAL */}
          <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>Fecha de nacimiento</Text>
            <TouchableOpacity onPress={() => setMostrarPickerModal(true)} style={styles.dateButton}>
              <Text style={form.fechaNac ? styles.dateTextSelected : styles.dateTextPlaceholder}>
                {form.fechaNac || 'Seleccioná tu fecha'}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
            {errores.fechaNac ? <Text style={inputStyles.errorText}>{errores.fechaNac}</Text> : null}
          </View>

          <Modal visible={mostrarPickerModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitulo}>Fecha de nacimiento</Text>
                <View style={styles.modalRow}>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Día</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor="#999" value={diaTemp} onChangeText={setDiaTemp} />
                  </View>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Mes</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor="#999" value={mesTemp} onChangeText={setMesTemp} />
                  </View>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Año</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={4} placeholder="AAAA" placeholderTextColor="#999" value={anioTemp} onChangeText={setAnioTemp} />
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

          <View style={[styles.sectionHeader, { marginTop: 8 }]}><View style={styles.sectionDot} /><Text style={styles.sectionTitle}>Contacto</Text></View>
          <InputField label="Correo electrónico" placeholder="correo@ejemplo.com" keyboardType="email-address" value={form.email} onChangeText={set('email')} error={errores.email} />
          <InputField label="Número de teléfono" placeholder="+54 9 11 0000-0000" keyboardType="phone-pad" value={form.telefono} onChangeText={set('telefono')} error={errores.telefono} />

          <View style={inputStyles.wrapper}>
            <Text style={inputStyles.label}>Dirección</Text>
            <TextInput
              placeholder="Av. Siempre Viva 123"
              placeholderTextColor="#999999"
              style={[inputStyles.input, errores.direccion && inputStyles.inputError]}
              value={form.direccion}
              onChangeText={buscarDireccion}
              autoCapitalize="none"
            />
            <View style={[inputStyles.underline, errores.direccion && inputStyles.underlineError]} />
            {errores.direccion ? <Text style={inputStyles.errorText}>{errores.direccion}</Text> : null}
            {mostrarSugerencias && sugerencias.length > 0 && (
              <View style={styles.sugerenciasContainer}>
                {sugerencias.map((item) => (
                  <TouchableOpacity key={item.place_id} style={styles.sugerenciaItem} onPress={() => elegirDireccion(item)}>
                    <Text style={styles.sugerenciaTexto} numberOfLines={2}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.sectionHeader, { marginTop: 8 }]}><View style={styles.sectionDot} /><Text style={styles.sectionTitle}>Seguridad</Text></View>
          <InputField label="Contraseña" placeholder="Mínimo 8 caracteres" secureTextEntry value={form.contrasena} onChangeText={set('contrasena')} error={errores.contrasena} />
          <InputField label="Repetir contraseña" placeholder="Confirmá tu clave" secureTextEntry value={form.repetirContrasena} onChangeText={set('repetirContrasena')} error={errores.repetirContrasena} />

          <View style={styles.termsContainer}>
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

          <TouchableOpacity style={styles.boton} activeOpacity={0.85} onPress={handleContinuar}>
            <Text style={styles.botonTexto}>Continuar</Text>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  header: { backgroundColor: '#1565D8', paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 35, paddingHorizontal: 28 },
  tagline: { color: 'white', fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '400' },
  card: { backgroundColor: '#b4b7bc63', marginHorizontal: 16, marginTop: 20, marginBottom: 30, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1565D8', marginRight: 8 },
  sectionTitle: { color: '#1565D8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  row: { flexDirection: 'row' },
  dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Platform.OS === 'ios' ? 10 : 6, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.15)' },
  dateTextSelected: { color: '#1A202C', fontSize: 15 },
  dateTextPlaceholder: { color: '#999999', fontSize: 15 },
  calendarIcon: { fontSize: 16 },
  termsContainer: { marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  termsText: { color: '#4A5568', fontSize: 12 },
  termsLinkRow: { flexDirection: 'row' },
  termsLink: { color: '#1565D8', fontWeight: '700', fontSize: 12, textDecorationLine: 'underline' },
  boton: { backgroundColor: '#1565D8', height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  botonTexto: { color: 'white', fontWeight: '700', fontSize: 16, flex: 1, textAlign: 'center', marginLeft: 16 },
  arrowText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  sugerenciasContainer: { backgroundColor: 'white', borderRadius: 8, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, zIndex: 999 },
  sugerenciaItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sugerenciaTexto: { color: '#1A202C', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '85%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#1A202C', marginBottom: 20, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalInputGroup: { flex: 1, alignItems: 'center', marginHorizontal: 6 },
  modalLabel: { fontSize: 11, fontWeight: '600', color: '#4A5568', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  modalInput: { backgroundColor: '#F0F0F0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, fontSize: 18, fontWeight: '700', color: '#1A202C', textAlign: 'center', width: '100%' },
  modalBotones: { flexDirection: 'row', gap: 12 },
  modalCancelar: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E0', alignItems: 'center' },
  modalCancelarTexto: { color: '#4A5568', fontWeight: '600' },
  modalConfirmar: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1565D8', alignItems: 'center' },
  modalConfirmarTexto: { color: 'white', fontWeight: '700' },
});