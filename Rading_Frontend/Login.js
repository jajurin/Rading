import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function Login({ navigation }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Azul Adaptativo */}
        <View style={[
          styles.header, 
          { paddingTop: Platform.OS === 'ios' ? 80 : 50 }
        ]}>
          {/* Logo agrandado que ya dice Rading */}
          <Image source={require('./assets/Logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
        </View>

        {/* Card Gris Central */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
            <Text style={styles.googleText}>G   Continuar con Google</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="correo electronico/username"
            placeholderTextColor="#777"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="contraseña"
            placeholderTextColor="#777"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.loginButton} activeOpacity={0.85}>
            <Text style={styles.loginButtonText}>Iniciar sesion</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>¿Ovidaste tu contraseña?</Text>
          </TouchableOpacity>

       <TouchableOpacity onPress={() => navigation.navigate('Registrarse')}>
  <Text style={styles.registerText}>¿No tenés cuenta?</Text>
</TouchableOpacity>
        </View>

        {/* Frase inferior */}
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
  // ====== ESTRUCTURA GENERAL ======
  container: {
    flex: 1,
    backgroundColor: '#EEF1F6',
  },
  header: {
    backgroundColor: '#1565D8',
    alignItems: 'center',
    paddingBottom: 80,
  },
  footerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },

  // ====== COMPONENTES DEL HEADER ======
  logo: {
    width: 175,  // Agrandado de 140 a 175
    height: 175, // Agrandado de 140 a 175
    resizeMode: 'contain',
  },
  welcomeText: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 15,
  },

  // ====== TARJETA CENTRAL (CARD) ======
  card: {
    backgroundColor: '#b4b7bc63',
    marginHorizontal: 32,
    marginTop: -50,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  // ====== INPUTS Y BOTONES DE LA TARJETA ======
  googleButton: {
    backgroundColor: '#F5F5F7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  googleText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F5F5F7',
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: '#222',
    marginBottom: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#1565D8',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  // ====== LINKS DE TEXTO ======
  forgotText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  registerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },

  // ====== FRASE FINAL ======
  frase: {
    textAlign: 'center',
    color: '#1565D8',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
});