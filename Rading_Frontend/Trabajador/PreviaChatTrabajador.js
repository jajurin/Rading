import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '../Header';
import BottomNavBarTrabajador from './Navegadortrabajador';
import API_URL from '../configS';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d47a8';
const BLUE_LIGHT = '#3b7ff0';
const STATUS_BAR = '#0D4FD7';
const BG         = '#F3F5FA';
const API_BASE_URL = API_URL;

const normalizar = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const obtenerIniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

// Convierte lo que devuelve el backend (/chat/trabajador/:idTrabajador)
// a la forma que usa el render de esta pantalla. Acá el "contacto" es
// el CLIENTE, así que no hay servicio_nombre (eso es propio del
// trabajador, no del cliente).
const mapearChat = (c, idUsuario) => ({
  id: String(c.chat_id),
  idCliente: c.id_cliente,
  nombre: `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim(),
  foto: c.foto ?? null,
  online: false, // TODO: reemplazar cuando haya presencia en tiempo real
  trabajoActivo: c.trabajo_activo,
  ultimoMensaje: c.ultimo_mensaje ?? 'Todavía no hay mensajes',
  deQuien: c.ultimo_enviador_id === idUsuario ? 'trabajador' : 'cliente',
  visto: Number(c.no_leidos) === 0,
  noLeidos: Number(c.no_leidos) || 0,
  hora: c.ultimo_created_at
    ? new Date(c.ultimo_created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '',
});

export default function PreviaChatTrabajador({ route, navigation }) {  const usuario = route?.params?.usuario;

  const [chats, setChats] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [priorizarActivos, setPriorizarActivos] = useState(false);

  const cargarChats = useCallback(async () => {
    if (!usuario?.idTrabajador) {
      setCargando(false);
      return;
    }
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/chat/trabajador/${usuario.idTrabajador}`);
      if (!res.ok) throw new Error('Respuesta no OK del servidor');
      const data = await res.json();
      setChats(data.map((c) => mapearChat(c, usuario.id)));
    } catch (err) {
      console.error('Error al cargar chats:', err);
      setError('No pudimos cargar tus chats');
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarChats();
  }, [cargarChats]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarChats);
    return unsubscribe;
  }, [navigation, cargarChats]);

  const trabajosActivos = useMemo(
    () => chats.filter((c) => c.trabajoActivo),
    [chats]
  );

  const chatsFiltrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return q ? chats.filter((c) => normalizar(c.nombre).includes(q)) : chats;
  }, [busqueda, chats]);

  const { listaActivos, listaResto } = useMemo(() => {
    if (!priorizarActivos) return { listaActivos: [], listaResto: chatsFiltrados };
    return {
      listaActivos: chatsFiltrados.filter((c) => c.trabajoActivo),
      listaResto: chatsFiltrados.filter((c) => !c.trabajoActivo),
    };
  }, [chatsFiltrados, priorizarActivos]);

  const abrirChat = (contacto) => {
    navigation.navigate('ChatTrabajador', {
      contacto,
      usuario,
      chatId: contacto.id, // 👈 clave: viaja el chatId real de la DB
    });
  };

  const renderFilaChat = (item) => {
    const esNoLeido = item.deQuien === 'cliente' && !item.visto;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.filaChat}
        activeOpacity={0.7}
        onPress={() => abrirChat(item)}
      >
        <View style={styles.avatarWrap}>
          {item.foto ? (
            <Image source={{ uri: item.foto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{obtenerIniciales(item.nombre)}</Text>
            </View>
          )}
          {item.online && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.filaChatCentro}>
          <View style={styles.filaChatTopRow}>
            <View style={styles.nombreRow}>
              <Text
                style={[styles.nombreChat, esNoLeido && styles.textoNoLeido]}
                numberOfLines={1}
              >
                {item.nombre}
              </Text>
              {item.trabajoActivo && (
                <View style={styles.tagActivo}>
                  <View style={styles.tagActivoDot} />
                  <Text style={styles.tagActivoText}>Activo</Text>
                </View>
              )}
            </View>
            <Text style={[styles.horaChat, esNoLeido && styles.horaNoLeida]}>{item.hora}</Text>
          </View>

          <View style={styles.filaChatBottomRow}>
            <View style={styles.previewRow}>
              {item.deQuien === 'trabajador' && (
                <Ionicons
                  name={item.visto ? 'checkmark-done' : 'checkmark'}
                  size={15}
                  color={item.visto ? BLUE : '#A0AEC0'}
                  style={{ marginRight: 3 }}
                />
              )}
              <Text
                style={[styles.mensajeChat, esNoLeido && styles.textoNoLeido]}
                numberOfLines={1}
              >
                {item.ultimoMensaje}
              </Text>
            </View>

            {item.noLeidos > 0 && (
              <View style={styles.badgeNoLeidos}>
                <Text style={styles.badgeNoLeidosText}>{item.noLeidos}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={STATUS_BAR} />
      <Header />

      {/* Cabecera fija: título, resumen de activos y buscador. No se desliza. */}
      <View style={styles.cabeceraFija}>
        <View style={styles.tituloRow}>
          <Text style={styles.titulo}>Mensajes</Text>
          <Text style={styles.subtitulo}>Hablá con tus clientes</Text>
        </View>

        <TouchableOpacity
          style={[styles.statCard, priorizarActivos && styles.statCardActivo]}
          activeOpacity={0.9}
          onPress={() => setPriorizarActivos((prev) => !prev)}
        >
          <View style={styles.statGlow} />
          <View style={styles.statIconWrap}>
            <Ionicons name="briefcase" size={20} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.statNumero}>
              {trabajosActivos.length} trabajo{trabajosActivos.length !== 1 ? 's' : ''} activo
              {trabajosActivos.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.statSub}>
              {priorizarActivos ? 'Mostrando primero en la lista' : 'Tocá para verlos primero'}
            </Text>
          </View>

          <Ionicons
            name={priorizarActivos ? 'checkmark-circle' : 'chevron-forward'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={styles.buscadorWrap}>
          <Ionicons name="search" size={18} color="#8A94A6" />
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscar chat por nombre..."
            placeholderTextColor="#9AA5B5"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#B9C6DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Solo esta lista se desliza */}
      <ScrollView
        style={styles.listaScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {cargando ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.emptyText}>Cargando tus chats...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="alert-circle-outline" size={38} color="#C7D2E3" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={cargarChats} style={styles.reintentarBtn}>
              <Text style={styles.reintentarBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : chatsFiltrados.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={38} color="#C7D2E3" />
            <Text style={styles.emptyText}>
              {chats.length === 0
                ? 'Todavía no tenés chats. Cuando un cliente te escriba van a aparecer acá.'
                : 'No encontramos chats con ese nombre'}
            </Text>
          </View>
        ) : priorizarActivos ? (
          <>
            {listaActivos.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Trabajos en curso</Text>
                <View style={styles.listaCard}>
                  {listaActivos.map((item, i) => (
                    <React.Fragment key={item.id}>
                      {renderFilaChat(item)}
                      {i < listaActivos.length - 1 && <View style={styles.separador} />}
                    </React.Fragment>
                  ))}
                </View>
              </>
            )}

            {listaResto.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Otros chats</Text>
                <View style={styles.listaCard}>
                  {listaResto.map((item, i) => (
                    <React.Fragment key={item.id}>
                      {renderFilaChat(item)}
                      {i < listaResto.length - 1 && <View style={styles.separador} />}
                    </React.Fragment>
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.listaCard}>
            {chatsFiltrados.map((item, i) => (
              <React.Fragment key={item.id}>
                {renderFilaChat(item)}
                {i < chatsFiltrados.length - 1 && <View style={styles.separador} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNavBarTrabajador usuario={usuario} pantallaActiva="chats" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  cabeceraFija: { width: '100%', backgroundColor: BG },

  listaScroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 230, flexGrow: 1 },

  tituloRow: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  titulo: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  subtitulo: { fontSize: 13, color: '#8A94A6', marginTop: 2 },

  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 14,
    backgroundColor: BLUE_DARK,
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
    gap: 12,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  statCardActivo: {
    backgroundColor: BLUE,
  },
  statGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: BLUE_LIGHT,
    opacity: 0.35,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumero: { color: '#fff', fontWeight: '800', fontSize: 15 },
  statSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

  buscadorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  buscadorInput: { flex: 1, fontSize: 14, color: '#1A202C' },

  sectionLabel: {
    marginTop: 22,
    marginHorizontal: 20,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#8A94A6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  listaCard: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(21,101,216,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  separador: {
    height: 1,
    backgroundColor: 'rgba(21,101,216,0.06)',
    marginLeft: 78,
  },

  filaChat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#3ECF6E',
    borderWidth: 2,
    borderColor: '#fff',
  },

  filaChatCentro: { flex: 1 },
  filaChatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nombreRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 6 },
  nombreChat: { fontSize: 14.5, fontWeight: '700', color: '#2D3748', flexShrink: 1 },
  textoNoLeido: { color: '#1A202C', fontWeight: '800' },
  tagActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21,101,216,0.10)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  tagActivoDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BLUE },
  tagActivoText: { color: BLUE_DARK, fontSize: 9.5, fontWeight: '800' },

  horaChat: { fontSize: 11.5, color: '#A0AEC0', fontWeight: '600' },
  horaNoLeida: { color: BLUE, fontWeight: '800' },

  filaChatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  mensajeChat: { fontSize: 12.5, color: '#8A94A6', flexShrink: 1 },

  badgeNoLeidos: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeNoLeidosText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  emptyWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { marginTop: 10, color: '#8A94A6', fontSize: 13, textAlign: 'center' },
  reintentarBtn: {
    marginTop: 14,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  reintentarBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});