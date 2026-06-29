import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import API_URL from './configS';


export default function Login({ navigation }) {
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);

  const handleLogin = async () => {
    if (!identificador.trim() || !contrasena.trim()) {
      Alert.alert('Campos requeridos', 'Ingresá tu DNI o correo y tu contraseña.');
      return;
    }

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
        navigation.navigate('BuscadorTrabajador', { usuario });
      } else if (usuario.tipo === 'cliente') {
  navigation.navigate('Perfil', { usuario });
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
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 80 : 50 }]}>
          <Image source={require('./assets/Logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
            <Text style={styles.googleText}>G   Continuar con Google</Text>
          </TouchableOpacity>

          {/* Input DNI / email */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="DNI o correo electrónico"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={identificador}
              onChangeText={setIdentificador}
            />
          </View>

          {/* Input contraseña con Ver/Ocultar */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              secureTextEntry={!verContrasena}
              autoCapitalize="none"
              value={contrasena}
              onChangeText={setContrasena}
            />
            <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)}>
              <Text style={styles.verText}>{verContrasena ? 'Ocultar' : 'Ver'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.loginButtonText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Registrarse')} style={styles.linkRow}>
            <Text style={styles.linkText}>
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
  container: { flex: 1, backgroundColor: '#EEF1F6' },
  header: { backgroundColor: '#1565D8', alignItems: 'center', paddingBottom: 80 },
  footerContainer: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  logo: { width: 175, height: 175, resizeMode: 'contain' },
  welcomeText: { color: 'white', fontSize: 26, fontWeight: '700', marginTop: 15 },
  card: {
    backgroundColor: '#3d3d3d63', marginHorizontal: 32, marginTop: -50,
    borderRadius: 24, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  googleButton: {
    backgroundColor: '#F5F5F7', width: '100%', paddingVertical: 12,
    borderRadius: 20, alignItems: 'center', marginBottom: 20,
  },
  googleText: { color: '#333', fontWeight: '600', fontSize: 14 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  verText: {
    color: '#1565D8',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },

  loginButton: {
    backgroundColor: '#1565D8', width: '100%', paddingVertical: 12,
    borderRadius: 20, alignItems: 'center', marginTop: 6, marginBottom: 25,
  },
  loginButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },

  linkRow: { marginBottom: 20 },
  linkText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkBold: {
    color: 'white',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  frase: { textAlign: 'center', color: '#1565D8', fontSize: 22, fontWeight: '800', lineHeight: 30 },
});