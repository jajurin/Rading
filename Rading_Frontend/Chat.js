import React, { useRef, useState, useEffect } from 'react';
import Header from './Header';
import BottomNavBar from './Cliente/NavegadorCliente';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d47a8';
const BLUE_LIGHT = '#3b7ff0';
const STATUS_BAR = '#0D4FD7';
const BG         = '#F3F5FA';

// ---------------------------------------------------------------------
// CONTACTO Y MENSAJES HARDCODEADOS (luego se reemplaza por el backend)
// ---------------------------------------------------------------------
const CONTACTO_HARDCODEADO = {
  idTrabajador: 101,
  nombre: 'Marcos Giménez',
  servicio: 'Plomería',
  foto: null,
  online: true,
};

const MENSAJES_HARDCODEADOS = [
  { id: 'm1', tipo: 'texto', autor: 'trabajador', texto: 'Hola! ¿En qué te puedo ayudar?', hora: '10:12' },
  { id: 'm2', tipo: 'texto', autor: 'cliente', texto: 'Hola! Necesito que me revises una pérdida en el grifo de la cocina', hora: '10:13' },
  { id: 'm3', tipo: 'texto', autor: 'trabajador', texto: 'Perfecto, mandame la solicitud y te paso un presupuesto', hora: '10:14' },
  {
    id: 'm4',
    tipo: 'servicio',
    autor: 'trabajador',
    hora: '10:16',
    servicio: 'Plomería',
    precio: '23.000',
    estado: 'Presupuesto enviado',
  },
  { id: 'm5', tipo: 'texto', autor: 'cliente', texto: 'Dale, me parece bien 👍', hora: '10:20' },
  { id: 'm6', tipo: 'texto', autor: 'trabajador', texto: 'Genial, puedo pasar mañana a las 15hs, ¿te queda bien?', hora: '10:21' },
];

const obtenerIniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export default function ChatCliente({ route, navigation }) {
  const contacto = route?.params?.contacto || CONTACTO_HARDCODEADO;
  const usuario = route?.params?.usuario;

  const listRef = useRef(null);
  const [mensajes, setMensajes] = useState(MENSAJES_HARDCODEADOS);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  const enviarMensaje = () => {
    const contenido = texto.trim();
    if (!contenido) return;

    const nuevo = {
      id: `local-${Date.now()}`,
      tipo: 'texto',
      autor: 'cliente',
      texto: contenido,
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMensajes((prev) => [...prev, nuevo]);
    setTexto('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    // TODO: reemplazar por POST al backend cuando esté disponible
    // fetch(`${API_BASE_URL}/chat/enviar`, { method: 'POST', body: JSON.stringify({...}) })
  };

  const renderBurbujaTexto = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esCliente ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View
          style={[
            styles.burbuja,
            esCliente ? styles.burbujaCliente : styles.burbujaTrabajador,
          ]}
        >
          <Text style={esCliente ? styles.textoBurbujaCliente : styles.textoBurbujaTrabajador}>
            {item.texto}
          </Text>
          <View style={styles.filaHora}>
            <Text style={esCliente ? styles.horaClienteTexto : styles.horaTrabajadorTexto}>
              {item.hora}
            </Text>
            {esCliente && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color="rgba(255,255,255,0.85)"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTarjetaServicio = (item) => {
    const esCliente = item.autor === 'cliente';
    return (
      <View
        style={[
          styles.filaMensaje,
          { justifyContent: esCliente ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!esCliente && <AvatarMini contacto={contacto} />}
        <View style={styles.tarjetaServicio}>
          <View style={styles.tarjetaServicioBadge}>
            <Ionicons name="hammer" size={12} color={BLUE_DARK} />
            <Text style={styles.tarjetaServicioBadgeText}>{item.estado}</Text>
          </View>

          <Text style={styles.tarjetaServicioLabel}>Servicio</Text>
          <Text style={styles.tarjetaServicioValor}>{item.servicio}</Text>

          <View style={styles.tarjetaServicioDivider} />

          <Text style={styles.tarjetaServicioLabel}>Precio estimado</Text>
          <Text style={styles.tarjetaServicioPrecio}>${item.precio}</Text>

          <TouchableOpacity style={styles.tarjetaServicioBoton} activeOpacity={0.85}>
            <Text style={styles.tarjetaServicioBotonText}>Ver detalle</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.horaTrabajadorTexto}>{item.hora}</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) =>
    item.tipo === 'servicio' ? renderTarjetaServicio(item) : renderBurbujaTexto(item);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={STATUS_BAR} />
      <Header />

      {/* Sub-header del chat: contacto activo */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.chatHeaderAvatarWrap}>
          {contacto.foto ? (
            <Image source={{ uri: contacto.foto }} style={styles.chatHeaderAvatar} />
          ) : (
            <View style={styles.chatHeaderAvatarPlaceholder}>
              <Text style={styles.chatHeaderAvatarText}>{obtenerIniciales(contacto.nombre)}</Text>
            </View>
          )}
          {contacto.online && <View style={styles.onlineDot} />}
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.chatHeaderNombre} numberOfLines={1}>{contacto.nombre}</Text>
          <Text style={styles.chatHeaderEstado}>
            {contacto.online ? 'En línea' : 'Desconectado'} · {contacto.servicio}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listaContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.diaDividerWrap}>
              <View style={styles.diaDividerLine} />
              <Text style={styles.diaDividerText}>Hoy</Text>
              <View style={styles.diaDividerLine} />
            </View>
          }
        />

        {/* Barra de entrada */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.adjuntarButton} activeOpacity={0.8}>
            <Ionicons name="add" size={22} color={BLUE_DARK} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Escribí un mensaje..."
            placeholderTextColor="#9AA5B5"
            value={texto}
            onChangeText={setTexto}
            multiline
          />

          <TouchableOpacity
            style={[styles.enviarButton, !texto.trim() && styles.enviarButtonDisabled]}
            onPress={enviarMensaje}
            activeOpacity={0.85}
            disabled={!texto.trim()}
          >
            <Ionicons name="send" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

function AvatarMini({ contacto }) {
  return contacto.foto ? (
    <Image source={{ uri: contacto.foto }} style={styles.avatarMini} />
  ) : (
    <View style={styles.avatarMiniPlaceholder}>
      <Text style={styles.avatarMiniTexto}>{obtenerIniciales(contacto.nombre)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ---- Sub-header de chat ----
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_DARK,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 2,
  },
  chatHeaderAvatarWrap: { position: 'relative' },
  chatHeaderAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  chatHeaderAvatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  chatHeaderAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#3ECF6E',
    borderWidth: 2, borderColor: BLUE_DARK,
  },
  chatHeaderNombre: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chatHeaderEstado: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  headerIconButton: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // ---- Lista de mensajes ----
  listaContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18 },
  diaDividerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  diaDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(21,101,216,0.12)' },
  diaDividerText: {
    color: '#8A94A6', fontSize: 11, fontWeight: '700',
    marginHorizontal: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  filaMensaje: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },

  avatarMini: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  avatarMiniPlaceholder: {
    width: 28, height: 28, borderRadius: 14, marginRight: 8,
    backgroundColor: BLUE, justifyContent: 'center', alignItems: 'center',
  },
  avatarMiniTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },

  burbuja: {
    maxWidth: '74%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  burbujaCliente: {
    backgroundColor: BLUE,
    borderBottomRightRadius: 4,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  burbujaTrabajador: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  textoBurbujaCliente: { color: '#fff', fontSize: 14, lineHeight: 20 },
  textoBurbujaTrabajador: { color: '#2D3748', fontSize: 14, lineHeight: 20 },
  filaHora: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  horaClienteTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  horaTrabajadorTexto: { color: '#A0AEC0', fontSize: 10, marginTop: 6 },

  // ---- Tarjeta de servicio (presupuesto) ----
  tarjetaServicio: {
    maxWidth: '78%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.10)',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  tarjetaServicioBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: 'rgba(21,101,216,0.08)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 12, marginBottom: 10, gap: 5,
  },
  tarjetaServicioBadgeText: { color: BLUE_DARK, fontSize: 10, fontWeight: '700' },
  tarjetaServicioLabel: { color: '#8A94A6', fontSize: 11, fontWeight: '600', marginTop: 4 },
  tarjetaServicioValor: { color: '#1A202C', fontSize: 16, fontWeight: '800', marginTop: 2 },
  tarjetaServicioDivider: { height: 1, backgroundColor: 'rgba(21,101,216,0.10)', marginVertical: 10 },
  tarjetaServicioPrecio: { color: BLUE_DARK, fontSize: 20, fontWeight: '800', marginTop: 2 },
  tarjetaServicioBoton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BLUE, borderRadius: 14,
    paddingVertical: 10, marginTop: 14, gap: 6,
  },
  tarjetaServicioBotonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // ---- Barra de entrada ----
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(21,101,216,0.08)',
    gap: 8,
  },
  adjuntarButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(21,101,216,0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: BG,
    borderRadius: 19,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1A202C',
  },
  enviarButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  enviarButtonDisabled: { backgroundColor: '#B9C6DB', shadowOpacity: 0 },
});