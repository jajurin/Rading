import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Paleta (consistente con el resto de la app) ─────────────────────────
const WHITE      = '#ffffff';
const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d4bb8';
const GOLD       = '#F5A623';
const TEXT_DARK  = '#1A2233';
const TEXT_GRAY  = '#8A94A6';
const BG_SOFT    = 'rgba(21,101,216,0.08)';

// ─── Ícono info: por qué tiene ese puntaje ────────────────────────────────
const InfoBadge = ({ mensaje }) => (
  <TouchableOpacity
    style={styles.infoBadge}
    onPress={() => Alert.alert('¿Por qué este puntaje?', mensaje)}
    activeOpacity={0.6}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
  >
    <Text style={styles.infoBadgeText}>?</Text>
  </TouchableOpacity>
);

// ─── Estrellas reales (llena / media / vacía) ────────────────────────────
const EstrellasRating = ({ valor = 0, size = 13 }) => {
  const estrellas = Math.max(0, Math.min(5, Number(valor) || 0));
  const llenas = Math.floor(estrellas);
  const decimal = estrellas - llenas;
  const media = decimal >= 0.25 && decimal < 0.75;
  const extraLlena = decimal >= 0.75;
  const totalLlenas = llenas + (extraLlena ? 1 : 0);
  const vacias = 5 - totalLlenas - (media ? 1 : 0);

  return (
    <View style={styles.starsRow}>
      {Array.from({ length: totalLlenas }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color={GOLD} />
      ))}
      {media && <Ionicons name="star-half" size={size} color={GOLD} />}
      {Array.from({ length: vacias }).map((_, i) => (
        <Ionicons key={`e${i}`} name="star-outline" size={size} color={GOLD} />
      ))}
      <Text style={styles.ratingNumero}>{estrellas.toFixed(1)}</Text>
    </View>
  );
};

// ─── Avatar con fallback de iniciales ─────────────────────────────────────
const Avatar = ({ foto, nombre, apellido }) => {
  if (foto) {
    return <Image source={{ uri: foto }} style={styles.avatar} />;
  }
  const iniciales = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarIniciales}>{iniciales || '?'}</Text>
    </View>
  );
};

export default function TarjetaPerfilCliente({ item, onPressChat }) {
  const terminado = item.estado && item.estado !== 'EN PROCESO';
  const estadoColor = terminado ? '#22C55E' : GOLD;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar foto={item.foto} nombre={item.nombre} apellido={item.apellido} />

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre} {item.apellido}
          </Text>

          <View style={styles.ratingWithInfo}>
            <EstrellasRating valor={item.estrellas} />
            <InfoBadge mensaje="Este puntaje refleja las reseñas que otros clientes dejaron sobre este trabajador después de contratarlo." />
          </View>

          <View style={styles.servicioRow}>
            <Ionicons name="construct-outline" size={13} color={BLUE} />
            <Text style={styles.cardServicio} numberOfLines={1}>
              {item.servicio_nombre ?? 'Servicio sin especificar'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onPressChat?.(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.divisor} />

      <View style={styles.cardFooterRow}>
        <View>
          <Text style={styles.precioLabel}>Precio del servicio</Text>
          <Text style={styles.cardPrecio}>
            {item.precio != null ? `$${Number(item.precio).toLocaleString('es-AR')}` : 'A convenir'}
          </Text>
        </View>

        <View style={[styles.estadoBadge, { backgroundColor: `${estadoColor}22` }]}>
          <View style={[styles.estadoDot, { backgroundColor: estadoColor }]} />
          <Text style={[styles.estadoText, { color: estadoColor }]}>
            {item.estado ?? 'Sin estado'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#0d4bb8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: BG_SOFT,
  },
  avatarFallback: {
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIniciales: { color: WHITE, fontWeight: '800', fontSize: 18 },

  cardInfo: { flex: 1, gap: 4 },
  cardName: { color: TEXT_DARK, fontWeight: '800', fontSize: 15.5 },

  ratingWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  ratingNumero: { fontSize: 12, fontWeight: '700', color: TEXT_GRAY, marginLeft: 4 },

  infoBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: BG_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBadgeText: { color: BLUE, fontSize: 9.5, fontWeight: '800' },

  servicioRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardServicio: { color: TEXT_GRAY, fontSize: 12.5, fontWeight: '600', flexShrink: 1 },

  chatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },

  divisor: { height: 1, backgroundColor: '#EEF1F6', marginVertical: 12 },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precioLabel: { fontSize: 10.5, color: TEXT_GRAY, fontWeight: '600', marginBottom: 2 },
  cardPrecio: { color: TEXT_DARK, fontWeight: '800', fontSize: 16 },

  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
});