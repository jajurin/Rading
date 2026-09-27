import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import API_URL from '../configS';

const INDIGO = '#3D4EEA';
const AMBER = '#F5A623';
const WHITE = '#FFFFFF';

function Estrellas({ valor = 0, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= Math.round(valor) ? 'star' : 'star-outline'} size={size} color={AMBER} />
      ))}
    </View>
  );
}

function formatFechaRegistro(fecha) {
  if (!fecha) return null;
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  } catch {
    return null;
  }
}

export default function PerfilCliente({ route, navigation }) {
  const { idCliente } = route.params;
  const { colors, isDark } = useTheme();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const resp = await fetch(`${API_URL}/cliente/perfil/${idCliente}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        setCliente(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [idCliente]);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !cliente) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorTexto}>{error || 'No se pudo cargar el perfil'}</Text>
        <TouchableOpacity style={styles.reintentarBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.reintentarTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nombre = `${cliente.nombre ?? ''} ${cliente.apellido ?? ''}`.trim();
  const calificacion = cliente.estrellas ?? 0;
  const direccion = cliente.direccion || 'Sin dirección';
  const telefono = cliente.telefono || '—';
  const categoria = cliente.categoria ?? cliente.categoria_nombre ?? null;
  const clienteDesde = formatFechaRegistro(cliente.fechaRegistro);
  const resenas = cliente.resenas ?? [];
  const cantidadResenas = cliente.reseñasRec ?? resenas.length ?? 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Perfil del cliente</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Banner principal */}
        <View style={styles.banner}>
          <View style={styles.avatarWrap}>
            {cliente.foto ? (
              <Image source={{ uri: cliente.foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInicial}>{nombre.charAt(0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.nombre}>{nombre}</Text>

          <View style={styles.ratingRow}>
            <Estrellas valor={calificacion} size={18} />
            <Text style={styles.ratingTexto}>
              {Number(calificacion).toFixed(1)} · {cantidadResenas} reseña{cantidadResenas !== 1 ? 's' : ''}
            </Text>
          </View>

          {clienteDesde ? (
            <View style={styles.antiguedadPill}>
              <Ionicons name="ribbon-outline" size={12} color={INDIGO} />
              <Text style={styles.antiguedadTexto}>Cliente desde {clienteDesde}</Text>
            </View>
          ) : null}
        </View>

        {/* Info de contacto / logística */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Contacto y ubicación</Text>
          <View style={styles.infoFila}>
            <Ionicons name="location-outline" size={18} color={colors.textTertiary} />
            <Text style={styles.infoTexto}>{direccion}</Text>
          </View>
          <View style={[styles.infoFila, { borderBottomWidth: 0 }]}>
            <Ionicons name="call-outline" size={18} color={colors.textTertiary} />
            <Text style={styles.infoTexto}>{telefono}</Text>
          </View>
        </View>

        {/* Categoría / preferencias */}
        {(categoria || cliente.preferencias) && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Preferencias</Text>
            {categoria ? (
              <View style={styles.infoFila}>
                <Ionicons name="construct-outline" size={18} color={colors.textTertiary} />
                <Text style={styles.infoTexto}>{categoria}</Text>
              </View>
            ) : null}
            {cliente.preferencias ? (
              <View style={[styles.infoFila, { borderBottomWidth: 0 }]}>
                <Ionicons name="options-outline" size={18} color={colors.textTertiary} />
                <Text style={styles.infoTexto}>{cliente.preferencias}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Descripción */}
        {cliente.descripcion ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Sobre el cliente</Text>
            <Text style={styles.descripcion}>{cliente.descripcion}</Text>
          </View>
        ) : null}

        {/* Reseñas de otros trabajadores sobre este cliente */}
        <View style={[styles.card, { marginBottom: 8 }]}>
          <Text style={styles.cardTitulo}>Reseñas de otros trabajadores</Text>
          <Text style={styles.cardSubtitulo}>Basado en experiencias reales trabajando con este cliente</Text>

          {resenas.length === 0 ? (
            <Text style={styles.textoVacio}>Todavía no tiene reseñas de trabajadores.</Text>
          ) : (
            resenas.slice(0, 5).map((r, i) => (
              <View key={i} style={[styles.resenaFila, i === resenas.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.resenaAvatar}>
                  <Text style={styles.resenaAvatarTexto}>{(r.nombre ?? '?').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.resenaTopRow}>
                    <Text style={styles.resenaNombre}>{r.nombre ?? 'Trabajador'}</Text>
                    <Estrellas valor={r.estrellas} size={12} />
                  </View>
                  {!!r.comentario && (
                    <Text style={styles.resenaComentario} numberOfLines={3}>{r.comentario}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  errorTexto: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  reintentarBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  reintentarTexto: { color: WHITE, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: isDark ? '#1a1f3a' : INDIGO,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { color: WHITE, fontSize: 16, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  banner: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, borderWidth: 3, borderColor: colors.card },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarInicial: { fontSize: 28, fontWeight: '900', color: colors.primary },
  nombre: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ratingTexto: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  antiguedadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(61,78,234,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  antiguedadTexto: { fontSize: 11.5, fontWeight: '700', color: INDIGO },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitulo: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSubtitulo: { fontSize: 11.5, color: colors.textTertiary, fontWeight: '600', marginBottom: 10 },
  infoFila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoTexto: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '500' },
  descripcion: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  textoVacio: { fontSize: 13, color: colors.textTertiary, fontStyle: 'italic' },
  resenaFila: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  resenaAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resenaAvatarTexto: { color: WHITE, fontWeight: '800', fontSize: 12 },
  resenaTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  resenaNombre: { fontSize: 12, fontWeight: '700', color: colors.text },
  resenaComentario: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
});