import React, { useState, useRef, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import AsyncStorage from '../asyncStorage';
import API_URL from '../configS';
import { useTheme } from '../ThemeContext';

const SUBCATEGORIAS = {
  domesticos: [
    { id: 1, nombre: 'Electricista' },
    { id: 2, nombre: 'Plomero' },
    { id: 3, nombre: 'Jardinero' },
    { id: 4, nombre: 'Gasista' },
    { id: 5, nombre: 'Limpieza' },
    { id: 6, nombre: 'Cerrajero' },
  ],
  freelance: [
    { id: 7, nombre: 'Diseñador Gráfico' },
    { id: 8, nombre: 'Programador' },
    { id: 9, nombre: 'Redactor' },
    { id: 10, nombre: 'Editor de Video' },
    { id: 11, nombre: 'Community Manager' },
  ],
  profesionales: [
    { id: 12, nombre: 'Abogado' },
    { id: 13, nombre: 'Contador' },
    { id: 14, nombre: 'Arquitecto' },
    { id: 15, nombre: 'Médico' },
    { id: 16, nombre: 'Psicólogo' },
    { id: 17, nombre: 'Ingeniero' },
  ],
};

// Estilos estáticos que no dependen del tema
const staticStyles = StyleSheet.create({
  timeInput: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    color: '#1A202C', fontSize: 18, fontWeight: '700',
    textAlign: 'center', width: 54, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)',
  },
  timeLabel: { fontSize: 14, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  inputLabel: { color: '#666', fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  inputField: { color: '#1A202C', fontSize: 15, paddingVertical: 8 },
  inputUnderline: { height: 1, backgroundColor: '#E0E0E0' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkboxBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#1565D8', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxBoxChecked: { backgroundColor: '#1565D8' },
  checkboxCheckmark: { color: 'white', fontSize: 11, fontWeight: '700' },
  checkboxText: { color: '#666', fontSize: 13, flex: 1 },
});

export default function RegistrarseTrabajador({ route, navigation }) {
  const { colors, isDark, syncUsuario } = useTheme();
  const [macroCategoria, setMacroCategoria] = useState('domesticos');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [dispComienzo, setDispComienzo] = useState('');
  const [dispFinal, setDispFinal]       = useState('');
  const [titular, setTitular] = useState('');
  const [banco, setBanco] = useState('');
  const [cbu, setCbu] = useState('');
  const [mayorEdad, setMayorEdad] = useState(false);
  const [terminos, setTerminos] = useState(false);

  const animacionMover = useRef(new Animated.Value(0)).current;

  const cambiarTab = (categoria, index) => {
    setMacroCategoria(categoria);
    Animated.spring(animacionMover, {
      toValue: index,
      useNativeDriver: false,
      bounciness: 0,
    }).start();
  };

  const toggleServicio = (servicio) => {
    const yaEsta = serviciosSeleccionados.find(s => s.id === servicio.id);
    if (yaEsta) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.id !== servicio.id));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
    }
  };

  const finalizarRegistro = async () => {
    if (serviciosSeleccionados.length === 0) {
      alert('Seleccioná al menos un servicio');
      return;
    }
    if (!dispComienzo || !dispFinal) {
      alert('Ingresá tu horario de disponibilidad');
      return;
    }
    if (!mayorEdad || !terminos) {
      alert('Debés aceptar los términos y confirmar tu edad');
      return;
    }

    try {
      const email = route?.params?.email;
      const response = await fetch(`${API_URL}/trabajador/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          servicios: serviciosSeleccionados.map(s => s.id),
          DispComienzo: dispComienzo,
          DispFinal: dispFinal,
          titular,
          banco,
          cbu,
        }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || 'Error al registrar'); return; }

      if (data.usuario?.id) {
        await AsyncStorage.setItem('@rading_user_id', String(data.usuario.id));
        syncUsuario(data.usuario.id);
      }

      alert('¡Registro Profesional Completo!');
      navigation.reset({ index: 0, routes: [{ name: 'BuscadorTrabajador' }] });
    } catch (e) {
      alert('No se pudo conectar al servidor');
      console.error(e);
    }
  };

  const posicionIzquierda = animacionMover.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.3333%', '66.6666%'],
  });

  const contarPorCategoria = (cat) =>
    serviciosSeleccionados.filter(s => SUBCATEGORIAS[cat].find(d => d.id === s.id)).length;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const inputStyles = useMemo(() => createInputStyles(colors, isDark), [colors, isDark]);
const checkboxStyles = useMemo(() => createCheckboxStyles(colors, isDark), [colors, isDark]);
  // Componentes movidos dentro del componente principal
  const TimePicker = ({ label, value, onChange }) => {
    const [hour, minute] = value ? value.split(':') : ['', ''];

    const setHour = (h) => {
      const hh = h.replace(/[^0-9]/g, '').slice(0, 2);
      if (hh === '' || (Number(hh) >= 0 && Number(hh) <= 23))
        onChange(hh + ':' + (minute || '00'));
    };

    const setMinute = (m) => {
      const mm = m.replace(/[^0-9]/g, '').slice(0, 2);
      if (mm === '' || (Number(mm) >= 0 && Number(mm) <= 59))
        onChange((hour || '00') + ':' + mm);
    };

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={inputStyles.label}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TextInput
            style={staticStyles.timeInput}
            value={hour}
            onChangeText={setHour}
            placeholder="HH"
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>:</Text>
          <TextInput
            style={staticStyles.timeInput}
            value={minute}
            onChangeText={setMinute}
            placeholder="MM"
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
    );
  };

  const InputField = ({ label, placeholder, value, onChangeText, keyboardType }) => {
    const { colors: themeColors } = useTheme();
    return (
      <View style={inputStyles.wrapper}>
        <Text style={inputStyles.label}>{label}</Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={themeColors.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={inputStyles.input}
          autoCapitalize="none"
        />
        <View style={inputStyles.underline} />
      </View>
    );
  };

  const Checkbox = ({ label, checked, onToggle }) => {
    const { colors: themeColors } = useTheme();
    return (
      <TouchableOpacity style={staticStyles.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
        <View style={[staticStyles.checkboxBox, checked && staticStyles.checkboxBoxChecked]}>
          {checked && <Text style={staticStyles.checkboxCheckmark}>✓</Text>}
        </View>
        <Text style={[staticStyles.checkboxText, { color: themeColors.textSecondary }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.tagline}>Perfil Profesional</Text>
          <Text style={styles.subtitle}>Completá tus datos laborales y de cobro</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Datos laborales</Text>
          </View>

          <Text style={styles.fieldLabel}>Categoría de servicio</Text>

          <View style={styles.macroTabs}>
            <View style={styles.tabsRelativeWrapper}>
              <Animated.View style={[styles.burbujaActiva, { width: '33.3333%', left: posicionIzquierda }]} />

              <TouchableOpacity style={styles.tabButton} onPress={() => cambiarTab('domesticos', 0)} activeOpacity={0.9}>
                <View style={styles.tabContent}>
                  <Text style={[styles.tabButtonText, macroCategoria === 'domesticos' && styles.tabButtonTextActive]}>Domésticos</Text>
                  <View style={[styles.badge, macroCategoria === 'domesticos' && styles.badgeActive]}>
                    <Text style={[styles.badgeText, macroCategoria === 'domesticos' && styles.badgeTextActive]}>{contarPorCategoria('domesticos')}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tabButton} onPress={() => cambiarTab('freelance', 1)} activeOpacity={0.9}>
                <View style={styles.tabContent}>
                  <Text style={[styles.tabButtonText, macroCategoria === 'freelance' && styles.tabButtonTextActive]}>Freelance</Text>
                  <View style={[styles.badge, macroCategoria === 'freelance' && styles.badgeActive]}>
                    <Text style={[styles.badgeText, macroCategoria === 'freelance' && styles.badgeTextActive]}>{contarPorCategoria('freelance')}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tabButton} onPress={() => cambiarTab('profesionales', 2)} activeOpacity={0.9}>
                <View style={styles.tabContent}>
                  <Text style={[styles.tabButtonText, macroCategoria === 'profesionales' && styles.tabButtonTextActive]}>Profesionales</Text>
                  <View style={[styles.badge, macroCategoria === 'profesionales' && styles.badgeActive]}>
                    <Text style={[styles.badgeText, macroCategoria === 'profesionales' && styles.badgeTextActive]}>{contarPorCategoria('profesionales')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.subCatContainer}>
            <Text style={styles.fieldLabelSub}>¿Qué servicios ofrecés?</Text>
            <View style={styles.tagsWrapper}>
              {SUBCATEGORIAS[macroCategoria].map((servicio) => {
                const activo = serviciosSeleccionados.find(s => s.id === servicio.id);
                return (
                  <TouchableOpacity key={servicio.id} style={[styles.tag, activo && styles.tagActive]} onPress={() => toggleServicio(servicio)} activeOpacity={0.7}>
                    <Text numberOfLines={2} style={[styles.tagText, activo && styles.tagTextActive]}>
                      {activo ? '✓ ' : '+ '}{servicio.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={inputStyles.label}>Horario disponible</Text>
          <TimePicker label="Desde" value={dispComienzo} onChange={setDispComienzo} />
          <TimePicker label="Hasta" value={dispFinal}    onChange={setDispFinal} />

          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Datos de Cobro</Text>
          </View>

          <InputField label="Nombre del titular" placeholder="Juan García" value={titular} onChangeText={setTitular} />
          <InputField label="Banco" placeholder="Banco Galicia" value={banco} onChangeText={setBanco} />
          <InputField label="CBU / CVU / Alías" placeholder="00000031000..." value={cbu} onChangeText={setCbu} keyboardType="numeric" />

          <View style={styles.divider} />
          <Checkbox label="Confirmo que tengo 18+ años" checked={mayorEdad} onToggle={() => setMayorEdad(!mayorEdad)} />
          <Checkbox label="Acepto términos y condiciones" checked={terminos} onToggle={() => setTerminos(!terminos)} />

          <TouchableOpacity style={styles.boton} activeOpacity={0.85} onPress={finalizarRegistro}>
            <Text style={styles.botonTexto}>Ingresar</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style={colors.statusBar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createInputStyles = (colors, isDark) => StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  input: { color: colors.text, fontSize: 15, paddingVertical: 8 },
  underline: { height: 1, backgroundColor: colors.divider },
});

const createCheckboxStyles = (colors, isDark) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#1565D8', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  boxChecked: { backgroundColor: '#1565D8' },
  checkmark: { color: 'white', fontSize: 11, fontWeight: '700' },
  text: { color: colors.textSecondary, fontSize: 13, flex: 1 },
});

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: '#1565D8', paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 35, paddingHorizontal: 28 },
  tagline: { color: 'white', fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '400' },
  card: { backgroundColor: colors.card, marginHorizontal: 16, marginTop: 20, marginBottom: 40, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1565D8', marginRight: 8 },
  sectionTitle: { color: '#1565D8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  fieldLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 18 },
  macroTabs: { backgroundColor: colors.inputBg, borderRadius: 12, height: 40, marginBottom: 14, overflow: 'hidden' },
  tabsRelativeWrapper: { flexDirection: 'row', width: '100%', height: '100%', position: 'relative' },
  burbujaActiva: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#1565D8', borderRadius: 12 },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  tabContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 4 },
  tabButtonText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginRight: 4 },
  tabButtonTextActive: { color: 'white' },
  badge: { backgroundColor: colors.inputBg, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1, minWidth: 13, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.textSecondary },
  badgeTextActive: { color: 'white' },
  subCatContainer: { marginBottom: 16, backgroundColor: colors.surfaceVariant, padding: 12, borderRadius: 14 },
  fieldLabelSub: { color: colors.text, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tag: { backgroundColor: colors.card, width: '48%', height: 45, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 10, paddingHorizontal: 4 },
  tagActive: { backgroundColor: '#1565D8', borderColor: '#1565D8' },
  tagText: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  tagTextActive: { color: 'white', fontWeight: '700' },
  boton: { backgroundColor: '#1565D8', height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'center' },
  botonTexto: { color: 'white', fontWeight: '700', fontSize: 16, textAlign: 'center' },
});
