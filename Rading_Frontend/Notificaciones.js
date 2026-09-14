import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import API_URL from './configS';

/* ── Paleta (tokens de la app) ─────────────────────────────────────────── */
const NAVY = '#0F1B4C';
const INDIGO = '#3D4EEA';
const INDIGO_DEEP = '#2432B0';
const AMBER = '#F5A623';
const DANGER = '#E5484D';
const BG = '#F4F6FC';
const CARD = '#FFFFFF';
const TEXT_DARK = '#12172E';
const TEXT_MUTED = '#828AA0';
const BORDER = 'rgba(15,27,76,0.07)';
const GREEN = '#22C55E';
const BLUE_SOFT = '#5C6DF2';
const VIOLET = '#6D28D9';
const SKY = '#0EA5E9';

/* ── Metadatos por tipo de notificación ────────────────────────────────── */
export const META_TIPO = {
  OFERTA_NUEVA: { icono: 'cash-outline', color: AMBER, rotulo: 'Oferta recibida' },
  OFERTA_ACEPTADA: { icono: 'checkmark-circle', color: GREEN, rotulo: 'Oferta aceptada' },
  OFERTA_RECHAZADA: { icono: 'close-circle', color: DANGER, rotulo: 'Oferta no elegida' },
  MENSAJE: { icono: 'chatbubble', color: INDIGO, rotulo: 'Mensaje' },
  SOLICITUD_NUEVA: { icono: 'megaphone', color: VIOLET, rotulo: 'Nueva solicitud' },
  CODIGO_LLEGADA: { icono: 'key', color: SKY, rotulo: 'Código de llegada' },
  CODIGO_FIN: { icono: 'flag', color: SKY, rotulo: 'Código de cierre' },
  SUBASTA_CIERRE: { icono: 'timer', color: '#B4740E', rotulo: 'Subasta cerrada' },
  RESEÑA_NUEVA: { icono: 'star', color: AMBER, rotulo: 'Reseña recibida' },
  TRABAJO_FINALIZADO: { icono: 'checkmark-done-circle', color: GREEN, rotulo: 'Trabajo finalizado' },
};

/* ── Helpers públicos (también los usa el Header) ─────────────────────── */

// Formatea created_at a "hace X min / hace X h / Ayer / hace X d / fecha corta".
export function formatearHora(createdAt) {
  if (!createdAt) return '';
  const fecha = new Date(createdAt);
  const diff = Date.now() - fecha.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `hace ${dias} d`;
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Convierte una fila cruda de /notificacion/usuario/:id a la forma que
// espera el panel del Header: { id, nombre, mensaje, hora, leida }.
export function mapearParaHeader(row) {
  return {
    id: String(row?.id),
    nombre: row?.titulo ?? 'Notificación',
    mensaje: row?.mensaje ?? '',
    hora: formatearHora(row?.created_at),
    leida: Boolean(row?.leida),
    tipo: row?.tipo ?? null,
    data: row?.data ?? null,
  };
}

const peticion = async (url, opts) => {
  let resp;
  try {
    resp = await fetch(url, opts);
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor');
  }

  if (!resp.ok) {
    let detalle = `Error del servidor (HTTP ${resp.status})`;
    try {
      const cuerpo = JSON.parse(await resp.text());
      if (cuerpo?.message) detalle = cuerpo.message;
    } catch {}
    throw new Error(detalle);
  }

  const texto = await resp.text();
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error('El servidor devolvió una respuesta inesperada');
  }
};

export const listarNotificaciones = (idUsuario, limite = 50) =>
  peticion(`${API_URL}/notificacion/usuario/${idUsuario}?limite=${limite}`);

export const contarNoLeidas = (idUsuario) =>
  peticion(`${API_URL}/notificacion/usuario/${idUsuario}/no-leidas`);

export const marcarNotificacionLeida = (id, idUsuario) =>
  peticion(`${API_URL}/notificacion/${id}/leida`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idUsuario }),
  });

export const marcarTodasLasLeidas = (idUsuario) =>
  peticion(`${API_URL}/notificacion/todas-leidas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idUsuario }),
  });

// Navega desde una notificación al lugar que corresponde.
// MENSAJE → abre el chat directo (si se encuentra), si no la lista de chats.
// Las demás → pantalla según el rol y el tipo.
export const navegarDesdeNotificacion = async (item, usuario, navigation) => {
  if (!usuario?.id || !navigation) return;
  const esTrabajador = usuario?.tipo === 'trabajador';
  const data = item?.data ?? {};

  if (item?.tipo === 'MENSAJE') {
    const chatId = data.chatId;
    try {
      if (esTrabajador && usuario?.idTrabajador && data.idTrabajador) {
        const resp = await fetch(`${API_URL}/chat/trabajador/${usuario.idTrabajador}?idUsuario=${usuario.id}`);
        const filas = resp.ok ? await resp.json().catch(() => []) : [];
        const chat = filas.find?.((c) => String(c.chat_id) === String(chatId));
        if (chat) {
          navigation.navigate('ChatTrabajador', {
            usuario,
            chatId: String(chat.chat_id),
            contacto: {
              idCliente: chat.id_cliente,
              nombre: `${chat.nombre ?? ''} ${chat.apellido ?? ''}`.trim(),
              foto: chat.foto ?? null,
            },
          });
          return;
        }
      }
      if (!esTrabajador && usuario?.idCliente && data.idCliente) {
        const resp = await fetch(`${API_URL}/chat/cliente/${usuario.idCliente}?idUsuario=${usuario.id}`);
        const filas = resp.ok ? await resp.json().catch(() => []) : [];
        const chat = filas.find?.((c) => String(c.chat_id) === String(chatId));
        if (chat) {
          navigation.navigate('ChatCliente', {
            usuario,
            chatId: String(chat.chat_id),
            contacto: {
              idTrabajador: chat.id_trabajador,
              nombre: `${chat.nombre ?? ''} ${chat.apellido ?? ''}`.trim(),
              foto: chat.foto ?? null,
            },
          });
          return;
        }
      }
    } catch (err) {
      console.error('[Notificaciones] No se pudo abrir el chat:', err.message);
    }
    navigation.navigate(esTrabajador ? 'PreviaChatTrabajador' : 'ChatsCliente', { usuario });
    return;
  }

  switch (item?.tipo) {
    case 'OFERTA_NUEVA':
      navigation.navigate('RecibirOfertasScreen', { usuario });
      return;
    case 'SOLICITUD_NUEVA':
    case 'OFERTA_ACEPTADA':
    case 'OFERTA_RECHAZADA':
    case 'SUBASTA_CIERRE':
      if (esTrabajador) navigation.navigate('OfertasCercanasTrabajador', { usuario });
      else navigation.navigate('HomeCliente', { usuario });
      return;
    default:
      navigation.navigate(esTrabajador ? 'HomeTrabajador' : 'HomeCliente', { usuario });
  }
};

/* ── Pantalla ──────────────────────────────────────────────────────────── */
export default function Notificaciones({ route, navigation }) {
  const usuario = route?.params?.usuario;

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario?.id) {
      setNotificaciones([]);
      setCargando(false);
      return;
    }
    try {
      const filas = await listarNotificaciones(usuario.id);
      setNotificaciones(filas.map(mapearParaHeader));
    } catch (err) {
      console.error('[Notificaciones] Error al cargar:', err.message);
      setNotificaciones([]);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [usuario?.id]);

  // Al abrir la pantalla, las pendientes se descartan (marcadas como leídas)
  // y la lista se recarga.
  const procesarAlAbrir = useCallback(async () => {
    if (usuario?.id) {
      try {
        await marcarTodasLasLeidas(usuario.id);
      } catch (err) {
        console.error('[Notificaciones] No se pudieron marcar como leídas:', err.message);
      }
    }
    cargar();
  }, [usuario?.id, cargar]);

  useFocusEffect(
    useCallback(() => {
      procesarAlAbrir();
    }, [procesarAlAbrir])
  );

  const refrescar = () => {
    setRefrescando(true);
    cargar();
  };

  const tocarItem = async (item) => {
    if (usuario?.id) {
      try {
        if (!item?.leida) await marcarNotificacionLeida(item.id, usuario.id);
      } catch (err) {
        console.error('[Notificaciones] Error al marcar leída:', err.message);
      }
    }
    await navegarDesdeNotificacion(item, usuario, navigation);
  };

  const marcarTodas = async () => {
    if (!usuario?.id) return;
    try {
      await marcarTodasLasLeidas(usuario.id);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error('[Notificaciones] Error al marcar todas:', err.message);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const renderItem = ({ item }) => {
    const meta = META_TIPO[item.tipo] ?? {
      icono: 'notifications-outline',
      color: INDIGO,
      rotulo: 'Notificación',
    };
    return (
      <TouchableOpacity
        style={[styles.item, !item.leida && styles.itemNoLeido]}
        activeOpacity={0.7}
        onPress={() => tocarItem(item)}
      >
        <View style={[styles.itemIcono, { backgroundColor: `${meta.color}1A` }]}>
          <Ionicons name={meta.icono} size={19} color={meta.color} />
          {!item.leida && <View style={styles.dot} />}
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTopRow}>
            <Text style={styles.itemTitulo} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={styles.itemHora}>{item.hora}</Text>
          </View>
          <Text
            style={[styles.itemMensaje, !item.leida && styles.itemMensajeNoLeido]}
            numberOfLines={2}
          >
            {item.mensaje}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={15} color="rgba(15,27,76,0.25)" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={INDIGO_DEEP} />

      <LinearGradient
        colors={[INDIGO, INDIGO_DEEP]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="arrow-back" size={21} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTituloWrap}>
          <Text style={styles.headerTitulo}>Notificaciones</Text>
          {noLeidas > 0 && (
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>{noLeidas} nuevas</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={marcarTodas}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="checkmark-done" size={21} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {!usuario?.id ? (
        <View style={styles.centro}>
          <Ionicons name="notifications-off-outline" size={30} color="rgba(15,27,76,0.25)" />
          <Text style={styles.centroTexto}>No hay usuario logueado</Text>
        </View>
      ) : cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator color={INDIGO} />
        </View>
      ) : notificaciones.length === 0 ? (
        <View style={styles.centro}>
          <Ionicons name="notifications-off-outline" size={30} color="rgba(15,27,76,0.25)" />
          <Text style={styles.centroTexto}>No tenés notificaciones todavía</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={INDIGO} />
          }
          ListHeaderComponent={
            <View style={styles.leyenda}>
              <Text style={styles.leyendaTexto}>Tocá una notificación para verla</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTituloWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitulo: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  headerPillText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },

  lista: { paddingHorizontal: 14, paddingBottom: 30 },
  leyenda: { paddingTop: 16, paddingBottom: 8 },
  leyendaTexto: { color: TEXT_MUTED, fontSize: 12, fontWeight: '600' },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  itemNoLeido: { borderColor: 'rgba(61,78,234,0.4)' },
  itemIcono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: AMBER,
    borderWidth: 1.5,
    borderColor: CARD,
  },
  itemBody: { flex: 1 },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemTitulo: { fontSize: 13.5, fontWeight: '800', color: TEXT_DARK, flexShrink: 1 },
  itemHora: { fontSize: 10.5, color: TEXT_MUTED, marginLeft: 6 },
  itemMensaje: { fontSize: 12.5, color: TEXT_MUTED, lineHeight: 17 },
  itemMensajeNoLeido: { color: TEXT_DARK, fontWeight: '600' },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 40 },
  centroTexto: { color: TEXT_MUTED, fontSize: 13, fontWeight: '600' },
});