import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, StatusBar, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import API_URL from '../configS';

const NAVY = '#0F1B4C';
const INDIGO = '#2A3FD6';
const AMBER = '#F5A623';
const GREEN = '#22C55E';
const RED = '#EF4444';
const BG = '#F4F6FC';
const CARD = '#FFFFFF';
const TEXT_DARK = '#12172E';
const TEXT_MUTED = '#828AA0';
const BORDER = 'rgba(15,27,76,0.07)';
const WHITE = '#FFFFFF';

const LABELS_ESTRELLAS = ['', 'Muy malo', 'Malo', 'Bueno', 'Muy bueno', 'Excelente'];

// Las claves coinciden con las columnas de la tabla Estrellas
const ASPECTOS = [
  { id: 'puntualidad', label: 'Puntualidad',                  icon: 'time-outline' },
  { id: 'trato',       label: 'Respeto y trato',              icon: 'happy-outline' },
  { id: 'claridad',    label: 'Claridad al explicar',         icon: 'chatbubble-ellipses-outline' },
  { id: 'pago',        label: 'Precio acorde a lo pactado',   icon: 'cash-outline' },
];

const iniciales = (n = '', a = '') =>
  ((n?.charAt(0) || '') + (a?.charAt(0) || '')).toUpperCase() || '?';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';

function Estrellas({ value, onChange, size, gap, isDark }) {
  const vacia = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,27,76,0.16)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? AMBER : vacia}
            style={{ marginHorizontal: gap }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ClasificarTrabajador({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const usuario = route?.params?.usuario ?? {};
  const trabajo = route?.params?.trabajo ?? {};
  const idTrabajo = trabajo.idTrabajo ?? null;
  const idTrabajador = trabajo.idTrabajador ?? null;
  const idCliente = usuario.idCliente ?? null;

  const [general, setGeneral] = useState(0);
  const [aspectos, setAspectos] = useState({});
  const [volveria, setVolveria] = useState(null); // 'si' | 'no' | null
  const [tags, setTags] = useState([]);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [etiquetasDisp, setEtiquetasDisp] = useState([]);
  const [cargandoTags, setCargandoTags] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const resp = await fetch(`${API_URL}/etiquetas?tipo=TRABAJADOR`);
        const data = await resp.json();
        if (activo && resp.ok) setEtiquetasDisp(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar etiquetas:', err);
      } finally {
        if (activo) setCargandoTags(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  const toggleTag = (id) =>
    setTags((p) => (p.includes(id) ? p.filter((t) => t !== id) : [...p, id]));

  const puedeEnviar = general > 0 && !enviando;

  const avisar = (titulo, mensaje, onAceptar) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.alert) window.alert(`${titulo}\n\n${mensaje}`);
      onAceptar?.();
    } else {
      Alert.alert(titulo, mensaje, [{ text: 'OK', onPress: () => onAceptar?.() }]);
    }
  };

  const handleEnviar = async () => {
    if (!puedeEnviar) return;

    if (!idTrabajo || !idTrabajador || !idCliente) {
      avisar('No se pudo enviar', 'Falta información del trabajo. Volvé atrás e intentá de nuevo.');
      return;
    }

    setEnviando(true);

    const payload = {
      idCliente,
      idTrabajo,
      idTrabajador,
      estrellas: {
        general,
        puntualidad: aspectos.puntualidad || null,
        trato: aspectos.trato || null,
        claridad: aspectos.claridad || null,
        pago: aspectos.pago || null,
      },
      etiquetas: tags,
      descripcion: comentario.trim() || null,
      volveria: volveria === 'si' ? true : volveria === 'no' ? false : null,
    };

    try {
      // Ajustá esta ruta a la que ya tengas para crearReseñaCliente
     const resp = await fetch(`${API_URL}/cliente/resenia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await resp.json(); } catch (_) {}

      if (!resp.ok) {
        throw new Error(data.message || data.error || `No se pudo enviar la calificación (HTTP ${resp.status})`);
      }

      avisar('¡Gracias!', 'Tu calificación fue enviada.', () => navigation?.goBack?.());
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

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Calificar trabajador</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner del trabajo */}
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

          <View style={styles.bannerRow}>
            <View style={styles.bannerAvatarWrap}>
              {trabajo.foto ? (
                <Image source={{ uri: trabajo.foto }} style={styles.bannerAvatar} />
              ) : (
                <View style={styles.bannerAvatarFallback}>
                  <Text style={styles.bannerAvatarFallbackText}>
                    {iniciales(trabajo.nombre, trabajo.apellido)}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={styles.bannerNombre} numberOfLines={1}>
                {trabajo.nombre} {trabajo.apellido}
              </Text>
              <Text style={styles.bannerServicio} numberOfLines={1}>
                {trabajo.servicio_nombre ?? 'Servicio'} · {formatDate(trabajo.fecha_iniciado)}
              </Text>
            </View>
          </View>

          <View style={styles.bannerInfoRow}>
            <View style={styles.bannerInfoItem}>
              <Text style={styles.bannerInfoLabel}>Finalizado</Text>
              <Text style={styles.bannerInfoValor}>{formatDate(trabajo.fecha_acabado)}</Text>
            </View>
            <View style={styles.bannerInfoDivider} />
            <View style={styles.bannerInfoItem}>
              <Text style={styles.bannerInfoLabel}>Pagaste</Text>
              <Text style={styles.bannerInfoValor}>
                ${Number(trabajo.precio ?? 0).toLocaleString('es-AR')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* General */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cómo fue tu experiencia con este trabajador?</Text>
          <Text style={styles.cardSubtitle}>Tu opinión ayuda a otros clientes</Text>

          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <Estrellas value={general} onChange={setGeneral} size={40} gap={3} isDark={isDark} />
          </View>
          <Text style={styles.estrellasLabel}>
            {general > 0 ? LABELS_ESTRELLAS[general] : 'Tocá una estrella para calificar'}
          </Text>
        </View>

        {/* Aspectos */}
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
                <Estrellas
                  value={aspectos[a.id] ?? 0}
                  onChange={(v) => setAspectos((p) => ({ ...p, [a.id]: v }))}
                  size={17}
                  gap={1}
                  isDark={isDark}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Volverías a contratar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Volverías a contratar a este trabajador?</Text>

          <View style={styles.volveriaRow}>
            <TouchableOpacity
              style={[styles.volveriaBtn, volveria === 'si' && styles.volveriaBtnSi]}
              onPress={() => setVolveria(volveria === 'si' ? null : 'si')}
              activeOpacity={0.85}
            >
              <Ionicons name="thumbs-up" size={16} color={volveria === 'si' ? WHITE : GREEN} />
              <Text style={[styles.volveriaBtnText, volveria === 'si' && { color: WHITE }]}>
                Sí, sin dudas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.volveriaBtn, volveria === 'no' && styles.volveriaBtnNo]}
              onPress={() => setVolveria(volveria === 'no' ? null : 'no')}
              activeOpacity={0.85}
            >
              <Ionicons name="thumbs-down" size={16} color={volveria === 'no' ? WHITE : RED} />
              <Text style={[styles.volveriaBtnText, volveria === 'no' && { color: WHITE }]}>
                Prefiero que no
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Etiquetas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Etiquetas rápidas</Text>
          <Text style={styles.cardSubtitle}>Elegí las que apliquen</Text>

          {cargandoTags ? (
            <Text style={[styles.cardSubtitle, { marginTop: 14 }]}>Cargando etiquetas...</Text>
          ) : etiquetasDisp.length === 0 ? (
            <Text style={[styles.cardSubtitle, { marginTop: 14 }]}>No hay etiquetas disponibles.</Text>
          ) : (
            <View style={styles.tagsWrap}>
              {etiquetasDisp.map((t) => {
                const activo = tags.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.tagChip,
                      activo && (t.positiva ? styles.tagChipActive : styles.tagChipActiveNeg),
                    ]}
                    onPress={() => toggleTag(t.id)}
                    activeOpacity={0.75}
                  >
                    {activo && <Ionicons name="checkmark" size={13} color={WHITE} />}
                    <Text style={[styles.tagChipText, activo && styles.tagChipTextActive]}>
                      {t.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Comentario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dejá un comentario</Text>
          <Text style={styles.cardSubtitle}>Opcional · lo verán otros clientes</Text>

          <TextInput
            style={styles.comentarioInput}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Contá cómo fue el trabajo..."
            placeholderTextColor={TEXT_MUTED}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.contadorChars}>{comentario.length}/300</Text>
        </View>

        {/* Botones */}
        <View style={styles.footerBtns}>
          <TouchableOpacity style={styles.omitirBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.8}>
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
              <Text style={styles.enviarBtnText}>{enviando ? 'Enviando...' : 'Enviar calificación'}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NAVY, paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { color: WHITE, fontSize: 16, fontWeight: '800' },

  banner: {
    margin: 16, borderRadius: 26, padding: 20, overflow: 'hidden',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  bannerGlowTop: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', opacity: 0.12 },
  bannerGlowBottom: { position: 'absolute', bottom: -55, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: '#fff', opacity: 0.08 },
  bannerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  bannerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  bannerAvatarWrap: { padding: 2.5, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  bannerAvatar: { width: 52, height: 52, borderRadius: 26 },
  bannerAvatarFallback: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerAvatarFallbackText: { color: WHITE, fontWeight: '800', fontSize: 16 },
  bannerNombre: { color: WHITE, fontSize: 17, fontWeight: '800' },
  bannerServicio: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, marginTop: 3 },

  bannerInfoRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10,
  },
  bannerInfoItem: { flex: 1, alignItems: 'center', gap: 4 },
  bannerInfoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10.5, marginBottom: 3 },
  bannerInfoValor: { color: WHITE, fontSize: 13.5, fontWeight: '800' },
  bannerInfoDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.18)' },

  card: {
    backgroundColor: isDark ? colors.card : CARD, borderRadius: 22, marginHorizontal: 16, marginTop: 14,
    padding: 18, borderWidth: 1, borderColor: isDark ? colors.border : BORDER,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2,
  },
  cardTitle: { color: isDark ? colors.text : TEXT_DARK, fontSize: 15.5, fontWeight: '800' },
  cardSubtitle: { color: isDark ? colors.textSecondary : TEXT_MUTED, fontSize: 12, marginTop: 3 },

  estrellasLabel: { textAlign: 'center', marginTop: 12, color: INDIGO, fontWeight: '800', fontSize: 14 },

  aspectoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aspectoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  aspectoIconWrap: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(42,63,214,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  aspectoLabel: { color: isDark ? colors.text : TEXT_DARK, fontSize: 13, fontWeight: '600', flexShrink: 1 },

  volveriaRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  volveriaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1.5,
    borderColor: isDark ? colors.border : BORDER, backgroundColor: isDark ? colors.inputBg : BG,
  },
  volveriaBtnSi: { backgroundColor: GREEN, borderColor: GREEN },
  volveriaBtnNo: { backgroundColor: RED, borderColor: RED },
  volveriaBtnText: { color: isDark ? colors.text : TEXT_DARK, fontWeight: '700', fontSize: 13 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
    borderColor: isDark ? colors.border : BORDER, backgroundColor: isDark ? colors.inputBg : BG,
  },
  tagChipActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  tagChipActiveNeg: { backgroundColor: RED, borderColor: RED },
  tagChipText: { color: isDark ? colors.textSecondary : TEXT_MUTED, fontSize: 12.5, fontWeight: '600' },
  tagChipTextActive: { color: WHITE, fontWeight: '700' },

  comentarioInput: {
    marginTop: 14, backgroundColor: isDark ? colors.inputBg : BG, borderRadius: 14, borderWidth: 1,
    borderColor: isDark ? colors.inputBorder : BORDER, padding: 14, minHeight: 96,
    color: isDark ? colors.text : TEXT_DARK, fontSize: 13.5, lineHeight: 19,
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