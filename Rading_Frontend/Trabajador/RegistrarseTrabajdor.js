import React, { useState, useRef } from 'react';
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

const SUBCATEGORIAS = {
  domesticos: ['Electricista', 'Gasista', 'Plomero', 'Limpieza', 'Jardinero', 'Cerrajero'],
  freelance: ['Diseñador Gráfico', 'Programador', 'Redactor', 'Editor de Video', 'Community Manager'],
  profesionales: ['Abogado', 'Contador', 'Arquitecto', 'Médico', 'Psicólogo', 'Ingeniero'],
};

function InputField({ label, placeholder, value, onChangeText, keyboardType }) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={inputStyles.input}
        autoCapitalize="none"
      />
      <View style={inputStyles.underline} />
    </View>
  );
}

function Checkbox({ label, checked, onToggle }) {
  return (
    <TouchableOpacity style={checkboxStyles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[checkboxStyles.box, checked && checkboxStyles.boxChecked]}>
        {checked && <Text style={checkboxStyles.checkmark}>✓</Text>}
      </View>
      <Text style={checkboxStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RegistrarseTrabajador({ navigation }) {
  const [macroCategoria, setMacroCategoria] = useState('domesticos');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState({
    domesticos: [],
    freelance: [],
    profesionales: [],
  });
  const [disponibilidad, setDisponibilidad] = useState('');
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
    const actuales = serviciosSeleccionados[macroCategoria];
    const nuevos = actuales.includes(servicio)
      ? actuales.filter(s => s !== servicio)
      : [...actuales, servicio];

    setServiciosSeleccionados({
      ...serviciosSeleccionados,
      [macroCategoria]: nuevos
    });
  };

  const finalizarRegistro = () => {
    alert('¡Registro Profesional Completo!');
    if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const posicionIzquierda = animacionMover.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.3333%', '66.6666%'],
  });

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
                  <View style={[styles.badge, macroCategoria === 'domesticos' && styles.badgeActive]}><Text style={[styles.badgeText, macroCategoria === 'domesticos' && styles.badgeTextActive]}>{serviciosSeleccionados.domesticos.length}</Text></View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tabButton} onPress={() => cambiarTab('freelance', 1)} activeOpacity={0.9}>
                <View style={styles.tabContent}>
                  <Text style={[styles.tabButtonText, macroCategoria === 'freelance' && styles.tabButtonTextActive]}>Freelance</Text>
                  <View style={[styles.badge, macroCategoria === 'freelance' && styles.badgeActive]}><Text style={[styles.badgeText, macroCategoria === 'freelance' && styles.badgeTextActive]}>{serviciosSeleccionados.freelance.length}</Text></View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tabButton} onPress={() => cambiarTab('profesionales', 2)} activeOpacity={0.9}>
                <View style={styles.tabContent}>
                  <Text style={[styles.tabButtonText, macroCategoria === 'profesionales' && styles.tabButtonTextActive]}>Profesionales</Text>
                  <View style={[styles.badge, macroCategoria === 'profesionales' && styles.badgeActive]}><Text style={[styles.badgeText, macroCategoria === 'profesionales' && styles.badgeTextActive]}>{serviciosSeleccionados.profesionales.length}</Text></View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.subCatContainer}>
            <Text style={styles.fieldLabelSub}>¿Qué servicios ofrecés?</Text>
            <View style={styles.tagsWrapper}>
              {SUBCATEGORIAS[macroCategoria].map((servicio) => {
                const activo = serviciosSeleccionados[macroCategoria].includes(servicio);
                return (
                  <TouchableOpacity key={servicio} style={[styles.tag, activo && styles.tagActive]} onPress={() => toggleServicio(servicio)} activeOpacity={0.7}>
                    <Text numberOfLines={2} style={[styles.tagText, activo && styles.tagTextActive]}>
                      {activo ? '✓ ' : '+ '} {servicio}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <InputField label="Disponibilidad" placeholder="Ej: Lunes a Viernes" value={disponibilidad} onChangeText={setDisponibilidad} />

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
        <StatusBar style="light" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ====== ESTILOS DE ENTRADAS DE TEXTO ======
const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { 
    color: '#4A5568', 
    fontSize: 11, 
    fontWeight: '600', 
    letterSpacing: 1.2, 
    textTransform: 'uppercase', 
    marginBottom: 4 
  },
  input: { 
    color: '#1A202C', 
    fontSize: 15, 
    paddingVertical: 8 
  },
  underline: { 
    height: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.15)' 
  },
});

// ====== ESTILOS DE CHECKBOX ======
const checkboxStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  box: { 
    width: 20, 
    height: 20, 
    borderRadius: 5, 
    borderWidth: 2, 
    borderColor: '#1565D8', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 10 
  },
  boxChecked: { backgroundColor: '#1565D8' },
  checkmark: { color: 'white', fontSize: 11, fontWeight: '700' },
  text: { color: '#4A5568', fontSize: 13, flex: 1 },
});

// ====== ESTILOS PRINCIPALES DE LA PANTALLA ======
const styles = StyleSheet.create({
  // --- Contenedor Principal ---
  container: { flex: 1, backgroundColor: '#F0F0F0' },

  // --- Header ---
  header: { 
    backgroundColor: '#1565D8', 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingBottom: 35, 
    paddingHorizontal: 28 
  },
  tagline: { color: 'white', fontSize: 30, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '400' },

  // --- Contenedor Central (Card) ---
  card: { 
    backgroundColor: '#b4b7bc63', 
    marginHorizontal: 16, 
    marginTop: 20, 
    marginBottom: 40, 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 0, 0, 0.05)' 
  },

  // --- Sección de Datos y Etiquetas ---
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1565D8', marginRight: 8 },
  sectionTitle: { color: '#1565D8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  fieldLabel: { 
    color: '#4A5568', 
    fontSize: 11, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    marginBottom: 8, 
    letterSpacing: 0.5 
  },
  divider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', marginVertical: 18 },

  // --- Sistema de Pestañas (Tabs) ---
  macroTabs: { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 12, height: 40, marginBottom: 14, overflow: 'hidden' },
  tabsRelativeWrapper: { flexDirection: 'row', width: '100%', height: '100%', position: 'relative' },
  burbujaActiva: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#1565D8', borderRadius: 12 },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  tabContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 4 },
  tabButtonText: { fontSize: 11, fontWeight: '700', color: '#4A5568', marginRight: 4 },
  tabButtonTextActive: { color: 'white' },

  // --- Badges ---
  badge: { backgroundColor: 'rgba(0, 0, 0, 0.08)', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1, minWidth: 13, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#4A5568' },
  badgeTextActive: { color: 'white' },

  // --- Píldoras de Selección ---
  subCatContainer: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.4)', padding: 12, borderRadius: 14 },
  fieldLabelSub: { color: '#2D3748', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tag: { backgroundColor: 'white', width: '48%', height: 45, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 10, paddingHorizontal: 4 },
  tagActive: { backgroundColor: '#1565D8', borderColor: '#1565D8' },
  tagText: { fontSize: 10.5, color: '#4A5568', fontWeight: '600', textAlign: 'center' },
  tagTextActive: { color: 'white', fontWeight: '700' },

  // --- Botón de Acción ---
  boton: { 
    backgroundColor: '#1565D8', 
    height: 50, 
    borderRadius: 14, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    justifyContent: 'center' 
  },
  botonTexto: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 16, 
    textAlign: 'center' 
  },
});