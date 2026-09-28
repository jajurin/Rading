import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '../ThemeContext';
import API_URL from '../configS';

// ── Paleta (misma que HomeTrabajador) ───────────────────────────────────
const NAVY         = '#0F1B4C';
const NAVY_SOFT    = '#161F52';
const INDIGO       = '#2A3FD6';
const INDIGO_SOFT  = '#5C6DF2';
const AMBER        = '#F5A623';
const GREEN        = '#22C55E';
const RED          = '#EF4444';
const BG           = '#F4F6FC';
const CARD         = '#FFFFFF';
const TEXT_DARK    = '#12172E';
const TEXT_MUTED   = '#828AA0';
const BORDER       = 'rgba(15,27,76,0.07)';
const WHITE        = '#FFFFFF';
const FIJO         = '#6D28D9';
const FIJO_BG      = 'rgba(109,40,217,0.09)';
const FIJO_BORDER  = 'rgba(109,40,217,0.28)';
const SUBASTA      = '#B4740E';
const SUBASTA_BG   = 'rgba(217,142,10,0.12)';
const SUBASTA_BORDER = 'rgba(217,142,10,0.32)';

const LABELS_ESTRELLAS = ['', 'Muy mala', 'Mala', 'Buena', 'Muy buena', 'Excelente'];

const ASPECTOS = [
  { id: 'puntualidad',   label: 'Puntualidad',              icon: 'time-outline' },
  { id: 'trato',         label: 'Respeto y trato',           icon: 'happy-outline' },
  { id: 'claridad',      label: 'Claridad al explicar',      icon: 'chatbubble-ellipses-outline' },
  { id: 'pago',          label: 'Pago acorde a lo pactado',  icon: 'cash-outline' },
];

const TAGS_RAPIDOS = [
  { id: 'puntual',    label: 'Puntual' },
  { id: 'buena_onda',  label: 'Buena onda' },
  { id: 'pago_rapido', label: 'Pagó rápido' },
  { id: 'claro',       label: 'Instrucciones claras' },
  { id: 'recomendado', label: 'Lo recomiendo' },
  { id: 'demorado',    label: 'Se demoró en pagar' },
  { id: 'poco_claro',  label: 'Poco claro con el pedido' },
  { id: 'mala_comunicacion', label: 'Mala comunicación' },
];

const iniciales = (nombre = '', apellido = '') => {
  const a = nombre?.charAt(0) || '';
  const b = apellido?.charAt(0) || '';
  return (a + b).toUpperCase() || '?';
};

// ── Iconos propios (mismo estilo SVG que Home) ──────────────────────────
const Icons = {
  Check: ({ color = '#FFFFFF', size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L10 17.5L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Back: ({ color = '#FFFFFF', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Etiqueta: ({ color = FIJO, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.5 3H19a2 2 0 012 2v7.5a2 2 0 01-.586 1.414l-8 8a2 2 0 01-2.828 0l-7-7a2 2 0 010-2.828l8-8A2 2 0 0111.5 3z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"
      />
      <Circle cx="15.5" cy="8.5" r="1.6" stroke={color} strokeWidth="1.6" />
    </Svg>
  ),
  Subasta: ({ color = SUBASTA, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L20.5 8V16L12 21L3.5 16V8L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M12 8L15.2 9.9V13.6L12 15.5L8.8 13.6V9.9L12 8Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  ),
};

function ModalidadBadge({ fijo, styles }) {
  const info = fijo
    ? { label: 'FIJO', color: FIJO, bg: FIJO_BG, border: FIJO_BORDER }
    : { label: 'SUBASTA', color: SUBASTA, bg: SUBASTA_BG, border: SUBASTA_BORDER };
  const Icon = fijo ? Icons.Etiqueta : Icons.Subasta;
  return (
    <View style={[styles.modBadge, { backgroundColor: info.bg, borderColor: info.border }]}>
      <Icon color={info.color} size={11} />
      <Text style={[styles.modBadgeText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

// ── Selector grande de estrellas (calificación general) ─────────────────
// El color de la estrella "vacía" depende del tema: en modo oscuro un navy
// casi negro es invisible sobre la card oscura, así que usamos un blanco
// translúcido en ese caso.
function EstrellasGrandes({ value, onChange, styles, isDark }) {
  const colorVacia = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,27,76,0.16)';
  return (
    <View style={styles.estrellasGrandesRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={40}
            color={n <= value ? AMBER : colorVacia}
            style={{ marginHorizontal: 3 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Selector chico de estrellas (por aspecto) ────────────────────────────
function EstrellasChicas({ value, onChange, isDark }) {
  const colorVacia = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(15,27,76,0.18)';
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={17}
            color={n <= value ? AMBER : colorVacia}
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CalificarClienteTrabajador({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const cliente = route?.params?.cliente ?? {};
  const trabajo = route?.params?.trabajo ?? {};
  const idTrabajo = route?.params?.idTrabajo ?? null;
  const idTrabajador = route?.params?.idTrabajador ?? null;

  const [general, setGeneral] = useState(0);
  const [aspectos, setAspectos] = useState({});
  const [volveria, setVolveria] = useState(null); // 'si' | 'no' | null
  const [tags, setTags] = useState([]);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const setAspecto = (id, val) => setAspectos((prev) => ({ ...prev, [id]: val }));

  const toggleTag = (id) =>
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const puedeEnviar = general > 0 && !enviando;

  // Alert.alert de React Native, en web (react-native-web), en muchas
  // versiones NO muestra ningún diálogo y NO ejecuta el callback del botón
  // — solo tira un console.warn. Si dependemos de ese callback para hacer
  // goBack(), en web la pantalla se queda "trabada" aunque el envío haya
  // funcionado. Por eso en web usamos window.alert (bloqueante, sí ejecuta
  // lo que sigue) y en nativo seguimos usando Alert.alert normal.
  const avisar = (titulo, mensaje, onAceptar) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`${titulo}\n\n${mensaje}`);
      }
      onAceptar?.();
    } else {
      Alert.alert(titulo, mensaje, [{ text: 'OK', onPress: () => onAceptar?.() }]);
    }
  };

  const handleEnviar = async () => {
    if (!puedeEnviar) return;

    // Chequeo temprano: sin esto la request va a fallar en el backend con
    // "Faltan idTrabajo, idTrabajador o estrellas" y no se ve claro por qué.
    if (!idTrabajo || !idTrabajador) {
      avisar(
        'No se pudo enviar',
        'Falta información del trabajo. Volvé atrás e intentá de nuevo desde la lista de trabajos.'
      );
      return;
    }

    setEnviando(true);

    const razon = tags.length
      ? tags.map((id) => TAGS_RAPIDOS.find((t) => t.id === id)?.label).filter(Boolean).join(', ')
      : null;

    const payload = {
      idTrabajo,
      idTrabajador,
      estrellas: general,
      razon,
      descripcion: comentario.trim() || null,
      puntualidad: aspectos.puntualidad || null,
      trato: aspectos.trato || null,
      claridad: aspectos.claridad || null,
      pago: aspectos.pago || null,
      volveria: volveria === 'si' ? true : volveria === 'no' ? false : null,
    };

    try {
      const resp = await fetch(`${API_URL}/trabajador/calificarCliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await resp.json();
      } catch (_) {
        // El backend puede responder sin body en algún error inesperado;
        // no dejamos que esto tape el mensaje real de error.
      }

      if (!resp.ok) {
        throw new Error(data.message || `No se pudo enviar la calificación (HTTP ${resp.status})`);
      }

      // Se confirma el envío y recién ahí se sale de la pantalla.
      avisar('¡Gracias!', 'Tu calificación fue enviada.', () => {
        navigation?.goBack?.();
      });
    } catch (err) {
      console.error('Error al enviar calificación:', err);
      avisar('Error', err.message || 'No se pudo enviar la calificación. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* ── Header con back ────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icons.Back />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Calificar cliente</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Banner del trabajo finalizado ──────────────────────────── */}
        <LinearGradient
          colors={[INDIGO, '#1E2E9E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerGlowTop} />
          <View style={styles.bannerGlowBottom} />

          <View style={styles.bannerTag}>
            <Ionicons name="checkmark-done" size={12} color="#fff" />
            <Text style={styles.bannerTagText}>TRABAJO FINALIZADO</Text>
          </View>

          <View style={styles.bannerClienteRow}>
            <View style={styles.bannerAvatarWrap}>
              {cliente.foto ? (
                <Image source={{ uri: cliente.foto }} style={styles.bannerAvatar} />
              ) : (
                <View style={styles.bannerAvatarFallback}>
                  <Text style={styles.bannerAvatarFallbackText}>
                    {iniciales(cliente.nombre, cliente.apellido)}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={styles.bannerClienteNombre} numberOfLines={1}>
                {cliente.nombre} {cliente.apellido}
              </Text>
              <Text style={styles.bannerServicio} numberOfLines={1}>
                {trabajo.servicio_nombre} · {trabajo.fecha}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.verPerfilBtn}
              onPress={() => navigation.navigate('PerfilClienteParaTrabajador', { idCliente: cliente.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.verPerfilBtnText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bannerInfoRow}>
            <View style={styles.bannerInfoItem}>
              <Text style={styles.bannerInfoLabel}>Modalidad</Text>
              <ModalidadBadge fijo={trabajo.fijo} styles={styles} />
            </View>
            <View style={styles.bannerInfoDivider} />
            <View style={styles.bannerInfoItem}>
              <Text style={styles.bannerInfoLabel}>Cobraste</Text>
              <Text style={styles.bannerInfoValor}>
                ${Number(trabajo.precio ?? 0).toLocaleString('es-AR')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Calificación general ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cómo fue tu experiencia con este cliente?</Text>
          <Text style={styles.cardSubtitle}>Tu opinión ayuda a otros trabajadores</Text>

          <EstrellasGrandes value={general} onChange={setGeneral} styles={styles} isDark={isDark} />

          <Text style={styles.estrellasLabel}>
            {general > 0 ? LABELS_ESTRELLAS[general] : 'Tocá una estrella para calificar'}
          </Text>
        </View>

        {/* ── Aspectos puntuales ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detallá algunos aspectos</Text>
          <Text style={styles.cardSubtitle}>Opcional, pero suma mucho</Text>

          <View style={{ marginTop: 14, gap: 14 }}>
            {ASPECTOS.map((a) => (
              <View key={a.id} style={styles.aspectoRow}>
                <View style={styles.aspectoLeft}>
                  <View style={styles.aspectoIconWrap}>
                    <Ionicons name={a.icon} size={15} color={INDIGO} />
                  </View>
                  <Text style={styles.aspectoLabel}>{a.label}</Text>
                </View>
                <EstrellasChicas
                  value={aspectos[a.id] ?? 0}
                  onChange={(v) => setAspecto(a.id, v)}
                  isDark={isDark}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── ¿Volverías a trabajar? ──────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Volverías a trabajar con este cliente?</Text>

          <View style={styles.volveriaRow}>
            <TouchableOpacity
              style={[
                styles.volveriaBtn,
                volveria === 'si' && styles.volveriaBtnActivoSi,
              ]}
              onPress={() => setVolveria(volveria === 'si' ? null : 'si')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="thumbs-up"
                size={16}
                color={volveria === 'si' ? WHITE : GREEN}
              />
              <Text
                style={[
                  styles.volveriaBtnText,
                  volveria === 'si' && styles.volveriaBtnTextActivo,
                ]}
              >
                Sí, sin dudas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.volveriaBtn,
                volveria === 'no' && styles.volveriaBtnActivoNo,
              ]}
              onPress={() => setVolveria(volveria === 'no' ? null : 'no')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="thumbs-down"
                size={16}
                color={volveria === 'no' ? WHITE : RED}
              />
              <Text
                style={[
                  styles.volveriaBtnText,
                  volveria === 'no' && styles.volveriaBtnTextActivo,
                ]}
              >
                Prefiero que no
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tags rápidos ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Etiquetas rápidas</Text>
          <Text style={styles.cardSubtitle}>Elegí las que apliquen</Text>

          <View style={styles.tagsWrap}>
            {TAGS_RAPIDOS.map((t) => {
              const activo = tags.includes(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tagChip, activo && styles.tagChipActive]}
                  onPress={() => toggleTag(t.id)}
                  activeOpacity={0.75}
                >
                  {activo && <Icons.Check color={WHITE} size={12} />}
                  <Text style={[styles.tagChipText, activo && styles.tagChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Comentario ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dejá un comentario</Text>
          <Text style={styles.cardSubtitle}>Opcional · lo verán otros trabajadores</Text>

          <TextInput
            style={styles.comentarioInput}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Contá cómo fue trabajar con este cliente..."
            placeholderTextColor={TEXT_MUTED}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.contadorChars}>{comentario.length}/300</Text>
        </View>

        {/* ── Botones finales ─────────────────────────────────────────── */}
        <View style={styles.footerBtns}>
          <TouchableOpacity
            style={styles.omitirBtn}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.8}
          >
            <Text style={styles.omitirBtnText}>Omitir por ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={puedeEnviar ? 0.88 : 1}
            onPress={handleEnviar}
            disabled={!puedeEnviar}
          >
            <LinearGradient
              colors={puedeEnviar ? [INDIGO, '#1E2E9E'] : ['#C7CCE8', '#C7CCE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enviarBtn}
            >
              <Text style={styles.enviarBtnText}>
                {enviando ? 'Enviando...' : 'Enviar calificación'}
              </Text>
              {!enviando && <Ionicons name="arrow-forward" size={16} color={WHITE} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? colors.background : BG },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { color: WHITE, fontSize: 16, fontWeight: '800' },

  banner: {
    margin: 16, marginTop: 16, borderRadius: 26, padding: 20, overflow: 'hidden',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  bannerGlowTop: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', opacity: 0.12 },
  bannerGlowBottom: { position: 'absolute', bottom: -55, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: '#fff', opacity: 0.08 },
  bannerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  bannerClienteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  bannerAvatarWrap: {
    padding: 2.5, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bannerAvatar: { width: 52, height: 52, borderRadius: 26 },
  bannerAvatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerAvatarFallbackText: { color: WHITE, fontWeight: '800', fontSize: 16 },
  bannerClienteNombre: { color: WHITE, fontSize: 17, fontWeight: '800' },
  bannerServicio: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, marginTop: 3 },
  verPerfilBtn: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  verPerfilBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  bannerInfoRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 10,
  },
  bannerInfoItem: { flex: 1, alignItems: 'center', gap: 4 },
  bannerInfoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10.5, marginBottom: 3 },
  bannerInfoValor: { color: WHITE, fontSize: 13.5, fontWeight: '800' },
  bannerInfoDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.18)' },

  modBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  card: {
    backgroundColor: isDark ? colors.card : CARD, borderRadius: 22, marginHorizontal: 16, marginTop: 14,
    padding: 18, borderWidth: 1, borderColor: isDark ? colors.border : BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2,
  },
  cardTitle: { color: isDark ? colors.text : TEXT_DARK, fontSize: 15.5, fontWeight: '800' },
  cardSubtitle: { color: isDark ? colors.textSecondary : TEXT_MUTED, fontSize: 12, marginTop: 3 },

  estrellasGrandesRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 18,
  },
  estrellasLabel: {
    textAlign: 'center', marginTop: 12, color: INDIGO, fontWeight: '800', fontSize: 14,
  },

  aspectoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  aspectoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  aspectoIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: 'rgba(42,63,214,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  aspectoLabel: { color: isDark ? colors.text : TEXT_DARK, fontSize: 13, fontWeight: '600', flexShrink: 1 },

  volveriaRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  volveriaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: isDark ? colors.border : BORDER,
    backgroundColor: isDark ? colors.inputBg : BG,
  },
  volveriaBtnActivoSi: { backgroundColor: GREEN, borderColor: GREEN },
  volveriaBtnActivoNo: { backgroundColor: RED, borderColor: RED },
  volveriaBtnText: { color: isDark ? colors.text : TEXT_DARK, fontWeight: '700', fontSize: 13 },
  volveriaBtnTextActivo: { color: WHITE },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: isDark ? colors.border : BORDER, backgroundColor: isDark ? colors.inputBg : BG,
  },
  tagChipActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  tagChipText: { color: isDark ? colors.textSecondary : TEXT_MUTED, fontSize: 12.5, fontWeight: '600' },
  tagChipTextActive: { color: WHITE, fontWeight: '700' },

  comentarioInput: {
    marginTop: 14, backgroundColor: isDark ? colors.inputBg : BG, borderRadius: 14, borderWidth: 1, borderColor: isDark ? colors.inputBorder : BORDER,
    padding: 14, minHeight: 96, color: isDark ? colors.text : TEXT_DARK, fontSize: 13.5, lineHeight: 19,
  },
  contadorChars: { textAlign: 'right', color: isDark ? colors.textTertiary : TEXT_MUTED, fontSize: 11, marginTop: 6 },

  footerBtns: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  omitirBtn: { alignItems: 'center', paddingVertical: 10 },
  omitirBtnText: { color: isDark ? colors.textSecondary : TEXT_MUTED, fontWeight: '700', fontSize: 13.5 },
  enviarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
    shadowColor: INDIGO, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  enviarBtnText: { color: WHITE, fontWeight: '800', fontSize: 15.5 },
});