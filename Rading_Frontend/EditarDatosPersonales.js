import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useForm, Controller } from 'react-hook-form'
import API_URL from './configS'

const BLUE = '#1565D8'
const BLUE_DARK = '#0d4bb8'
const GRAY = '#6b7280'
const BG = '#F2F4F8'
const LINE = '#E4E7F0'
const FIELD_BG = '#EFF2F8'
const DANGER = '#B00020'

// ─── Valores por defecto (mismas keys que antes) ───────────────────────────
const VALORES_POR_DEFECTO = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  direccion: '',
  preferencias: '',
  descripcion: '',
}

export default function EditarDatosPersonales({ route, navigation }) {
  const tipo = route?.params?.tipo ?? 'cliente' // 'cliente' | 'trabajador'
  const usuario = route?.params?.usuario ?? {}
  const idPerfil = tipo === 'trabajador' ? usuario?.idTrabajador : usuario?.idCliente

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // La foto no se valida como campo de formulario, sigue como estado aparte
  const [foto, setFoto] = useState(null)

  // ── react-hook-form: reemplaza el useState(form) manual
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: VALORES_POR_DEFECTO,
    mode: 'onSubmit',
  })

  const nombreWatch = watch('nombre')
  const apellidoWatch = watch('apellido')

  useEffect(() => {
    if (idPerfil == null) {
      setCargando(false)
      return
    }
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/${tipo}/perfil/${idPerfil}`)
        if (!res.ok) throw new Error(`No se pudo cargar el perfil (HTTP ${res.status})`)
        const p = await res.json()
        setFoto(p.foto ?? null)
        // antes: setForm(...). ahora: reset() de react-hook-form carga los valores iniciales
        reset({
          nombre: p.nombre ?? '',
          apellido: p.apellido ?? '',
          email: p.email ?? '',
          telefono: p.telefono ?? '',
          direccion: p.direccion ?? '',
          preferencias: p.preferencias ?? '',
          descripcion: p.descripcion ?? '',
        })
      } catch (e) {
        setError(e.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [idPerfil, tipo, reset])

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para continuar.')
      return
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (!resultado.canceled && resultado.assets?.[0]?.uri) {
      setFoto(resultado.assets[0].uri)
    }
  }

  // ── Submit: handleSubmit de RHF ya corrió todas las `rules` antes de llegar acá
  const onSubmit = async (data) => {
    if (idPerfil == null) {
      Alert.alert('Error', 'Falta el id de perfil para guardar.')
      return
    }
    setGuardando(true)
    setError(null)
    const payload = { ...data, foto }
    if (tipo === 'trabajador') delete payload.preferencias
    try {
      const res = await fetch(`${API_URL}/${tipo}/perfil/${idPerfil}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const dataErr = await res.json().catch(() => ({}))
        throw new Error(dataErr.message || `Error ${res.status} al guardar`)
      }
      Alert.alert('Listo', 'Tu perfil se guardó correctamente.')
      navigation?.goBack?.()
    } catch (e) {
      console.error('guardar perfil error:', e)
      Alert.alert('No se pudo guardar', e.message)
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const iniciales = `${nombreWatch} ${apellidoWatch}`
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // ── Campo reutilizable controlado por RHF (mismo look que antes)
  const CampoControlado = ({ nombreCampo, label, placeholder, keyboardType, multiline, rules }) => (
    <Controller
      control={control}
      name={nombreCampo}
      rules={rules}
      render={({ field: { value, onChange } }) => (
        <View style={styles.campo}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              errors[nombreCampo] && styles.inputError,
            ]}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#A0A7B8"
            keyboardType={keyboardType}
            multiline={multiline}
          />
          {errors[nombreCampo] ? (
            <View style={styles.campoErrorRow}>
              <Ionicons name="alert-circle" size={12} color={DANGER} />
              <Text style={styles.campoErrorTexto}>{errors[nombreCampo].message}</Text>
            </View>
          ) : null}
        </View>
      )}
    />
  )

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={BLUE_DARK} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitulo}>Editar perfil</Text>
            <Text style={styles.topSub}>
              {tipo === 'trabajador' ? 'Trabajador' : 'Cliente'}
            </Text>
          </View>
        </View>

        {cargando ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.centerText}>Cargando tu perfil...</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error && !guardando && (
              <View style={styles.aviso}>
                <Ionicons name="alert-circle-outline" size={16} color={DANGER} />
                <Text style={styles.avisoTexto}>{error}</Text>
              </View>
            )}

            {/* Foto */}
            <View style={styles.fotoCard}>
              <TouchableOpacity onPress={elegirFoto} activeOpacity={0.85}>
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarVacio]}>
                    <Text style={styles.avatarIniciales}>{iniciales || '?'}</Text>
                  </View>
                )}
                <View style={styles.camaraBadge}>
                  <Ionicons name="camera" size={13} color="#fff" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={elegirFoto} activeOpacity={0.8}>
                <Text style={styles.cambiarFoto}>Cambiar foto de perfil</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.seccionTitulo}>Datos personales</Text>

              <CampoControlado
                label="Nombre"
                nombreCampo="nombre"
                placeholder="Tu nombre"
                rules={{
                  required: 'Ingresá un nombre válido',
                  validate: (v) => v.trim().length >= 2 || 'Ingresá un nombre válido',
                }}
              />
              <CampoControlado
                label="Apellido"
                nombreCampo="apellido"
                placeholder="Tu apellido"
                rules={{
                  required: 'Ingresá un apellido válido',
                  validate: (v) => v.trim().length >= 2 || 'Ingresá un apellido válido',
                }}
              />
              <CampoControlado
                label="Email"
                nombreCampo="email"
                placeholder="tucorreo@ejemplo.com"
                keyboardType="email-address"
                rules={{
                  required: 'Ingresá un correo válido',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresá un correo válido',
                  },
                }}
              />
              <CampoControlado
                label="Teléfono"
                nombreCampo="telefono"
                placeholder="11 1234 5678"
                keyboardType="phone-pad"
                rules={{
                  validate: (v) =>
                    !v || v.replace(/\D/g, '').length >= 10 || 'Ingresá un teléfono válido (mínimo 10 dígitos)',
                }}
              />
              <CampoControlado
                label="Dirección"
                nombreCampo="direccion"
                placeholder="Calle, número, ciudad"
              />
            </View>

            {tipo === 'cliente' && (
              <View style={styles.card}>
                <Text style={styles.seccionTitulo}>Preferencias</Text>
                <CampoControlado
                  label="Preferencias personales de servicio"
                  nombreCampo="preferencias"
                  placeholder="Ej: prefiero horarios de mañana..."
                  multiline
                />
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.seccionTitulo}>
                {tipo === 'trabajador' ? 'Sobre mí' : 'Acerca de vos'}
              </Text>
              <CampoControlado
                label="Descripción"
                nombreCampo="descripcion"
                placeholder="Contá quién sos y qué ofrecés..."
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.guardarBtn, guardando && styles.guardarBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={guardando}
              activeOpacity={0.9}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.guardarTexto}>Guardar cambios</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelarBtn}
              onPress={() => navigation?.goBack?.()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  backBtn: { marginRight: 12 },
  topTitulo: { fontSize: 17, fontWeight: '800', color: '#1A2233' },
  topSub: { fontSize: 11.5, color: GRAY, fontWeight: '600', marginTop: 1 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  centerText: { color: GRAY, fontSize: 13.5 },

  scrollContent: { padding: 16 },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  avisoTexto: { color: DANGER, fontSize: 12, flex: 1 },

  fotoCard: { alignItems: 'center', marginBottom: 18, gap: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarVacio: { backgroundColor: '#7A9AE8' },
  avatarIniciales: { color: '#fff', fontSize: 30, fontWeight: '800' },
  camaraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BLUE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cambiarFoto: { color: BLUE, fontWeight: '700', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0d4bb8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  seccionTitulo: { fontSize: 14.5, fontWeight: '800', color: '#1A2233', marginBottom: 10 },

  campo: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: BLUE_DARK, marginBottom: 5 },
  input: {
    backgroundColor: FIELD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1A2233',
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: DANGER, backgroundColor: '#FDF1F1' },
  campoErrorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  campoErrorTexto: { color: DANGER, fontSize: 11.5, fontWeight: '500' },

  guardarBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  guardarBtnDisabled: { opacity: 0.7 },
  guardarTexto: { color: '#fff', fontWeight: '800', fontSize: 15 },

  cancelarBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#fff',
  },
  cancelarTexto: { color: GRAY, fontWeight: '700', fontSize: 14 },
})