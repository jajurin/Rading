import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import API_URL from './configS';

// ─── Paleta ────────────────────────────────────────────────────────────
// Tinta profunda + dos azules de marca + hielo de fondo. El dorado se usa
// en UN solo lugar (el punto del botón) para que funcione como acento,
// no como color secundario.
const COLORS = {
  ink:      '#0B1F3A',
  blue:     '#0d47a8',
  blueSoft: '#1565D8',
  ice:      '#F4F7FC',
  white:    '#FFFFFF',
  gold:     '#F5B942',
  textMuted: '#7C8AA5',
  border:   '#E4E9F4',
  danger:   '#E23744',
};

// ─── Ícono de input con foco animado ───────────────────────────────────
function CampoInput({ icono, placeholder, value, onChangeText, onBlur, secureTextEntry, verBtn, keyboardType, autoCapitalize = 'none', error }) {
  const [enfocado, setEnfocado] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setEnfocado(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setEnfocado(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start();
    // 👇 le avisamos a react-hook-form que el campo perdió el foco
    // (lo necesita para modos de validación tipo "onBlur"/"onTouched").
    if (onBlur) onBlur();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? COLORS.danger : COLORS.border, error ? COLORS.danger : COLORS.blueSoft],
  });

  return (
    <View style={{ width: '100%', marginBottom: 14 }}>
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        <Ionicons name={icono} size={18} color={enfocado ? COLORS.blueSoft : COLORS.textMuted} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#A9B4C7"
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={handleBlur}
        />
        {verBtn}
      </Animated.View>
      {/* 👇 mensaje de error de react-hook-form, debajo de cada campo */}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export default function Login({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);

  // 👇 react-hook-form: control conecta cada Controller, handleSubmit valida
  // todo antes de llamar a onSubmit, y errors trae el mensaje ya armado de
  // cada campo. Reemplaza a los dos useState (identificador/contrasena) y
  // al chequeo manual con Alert.alert que había antes.
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { identificador: '', contrasena: '' },
    mode: 'onSubmit',
  });

  // 👇 Misma lógica de siempre: recibe los datos YA validados por RHF
  // (identificador y contrasena garantizados no vacíos) y hace exactamente
  // el mismo fetch, con el mismo manejo de respuesta y navegación.
  const onSubmit = async ({ identificador, contrasena }) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/usuario/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador, contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Error al iniciar sesión');
        return;
      }

      const { usuario } = data;
      console.log('tipo de usuario:', usuario.tipo);

      if (usuario.tipo === 'trabajador') {
        navigation.navigate('HomeTrabajador', { usuario });
      } else if (usuario.tipo === 'cliente') {
        navigation.navigate('HomeCliente', { usuario });
      } else {
        Alert.alert('Error', 'Tipo de usuario desconocido');
      }

    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar al servidor.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.blue }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 68 : 46 }]}>
          <View style={styles.logoWrap}>
            <Image source={require('./assets/Logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.eyebrow}>BIENVENIDO DE VUELTA</Text>
          <Text style={styles.welcomeText}>Iniciá sesión</Text>
          <Text style={styles.welcomeSub}>Para seguir encontrando lo que necesitás</Text>

          {/* Firma visual: onda que conecta el header con la card, en vez
              del corte recto negativo-margin de antes. */}
          <Svg
            width="100%"
            height={46}
            viewBox="0 0 400 46"
            style={styles.wave}
            preserveAspectRatio="none"
          >
            <Path
              d="M0,20 C 80,50 160,0 240,14 C 300,24 340,6 400,18 L400,46 L0,46 Z"
              fill={COLORS.ice}
            />
          </Svg>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>

          <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
            <View style={styles.googleGlyph}>
              <Text style={styles.googleGlyphText}>G</Text>
            </View>
            <Text style={styles.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o con tu cuenta</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 👇 Cada campo va envuelto en un Controller: "name" conecta con
              el objeto del formulario, "rules" reemplaza a la validación
              manual que había antes (el Alert.alert de campos requeridos). */}
          <Controller
            control={control}
            name="identificador"
            rules={{
              required: 'Ingresá tu DNI o correo.',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <CampoInput
                icono="person-outline"
                placeholder="DNI o correo electrónico"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.identificador?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="contrasena"
            rules={{
              required: 'Ingresá tu contraseña.',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <CampoInput
                icono="lock-closed-outline"
                placeholder="Contraseña"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!verContrasena}
                error={errors.contrasena?.message}
                verBtn={
                  <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                      name={verContrasena ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                }
              />
            )}
          />

          <TouchableOpacity style={styles.linkRowRight}>
            <Text style={styles.linkTextDark}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.75 }]}
            activeOpacity={0.9}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
                <View style={styles.loginButtonDot} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Registrarse')} style={styles.linkRowCenter}>
            <Text style={styles.linkTextDark}>
              ¿No tenés cuenta? <Text style={styles.linkBold}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.frase}>
            Encontrá lo que necesitás,{'\n'}cuando lo necesitás
          </Text>
        </View>

        <StatusBar style="light" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ice },

  header: {
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    paddingBottom: 34,
    paddingHorizontal: 32,
  },
  logoWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logo: { width: 78, height: 78, resizeMode: 'contain' },
  eyebrow: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  welcomeText: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: 0.2 },
  welcomeSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13.5,
    marginTop: 6,
    textAlign: 'center',
  },
  wave: { marginTop: 22, marginBottom: -1 },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 22,
    marginTop: -1,
    borderRadius: 26,
    padding: 26,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },

  googleButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.ice,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleGlyph: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  googleGlyphText: { fontSize: 12, fontWeight: '800', color: COLORS.blueSoft },
  googleText: { color: COLORS.ink, fontWeight: '700', fontSize: 14 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  dividerText: { fontSize: 11.5, color: COLORS.textMuted, fontWeight: '600' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.ice,
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.4,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.ink,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
  },
  fieldError: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },

  linkRowRight: { alignSelf: 'flex-end', marginBottom: 22 },
  linkRowCenter: { marginTop: 18, alignItems: 'center' },
  linkTextDark: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  linkBold: { color: COLORS.blueSoft, fontWeight: '800' },

  loginButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.blue,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  loginButtonText: { color: COLORS.white, fontWeight: '800', fontSize: 15.5, letterSpacing: 0.2 },
  loginButtonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },

  footerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 36 },
  frase: { textAlign: 'center', color: COLORS.blue, fontSize: 19, fontWeight: '800', lineHeight: 27, opacity: 0.85 },
});