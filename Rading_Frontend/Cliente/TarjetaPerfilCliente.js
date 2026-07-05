import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';

// ─── Colores (mismos que BuscadorTrabajador para mantener consistencia) ──
const WHITE     = '#ffffff';
const GOLD      = '#ffd700';
const BLUE      = '#1565D8';
const BLUE_DARK = '#0a0f3c';
const BLUE_CARD = '#1e35b5';

// ─── Ícono de info: circulito con "?" que explica de dónde sale el puntaje ─
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

const RatingBadge = ({ rating }) => (
  <View style={styles.ratingBadge}>
    <Text style={styles.ratingText}>{Number(rating ?? 0).toFixed(2)}</Text>
    <Text style={styles.ratingStar}>★</Text>
  </View>
);

const ChatIcon = () => (
  <View style={styles.chatBubble}>
    <View style={styles.dotsRow}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  </View>
);

export default function TarjetaPerfilCliente({ item, onPressChat }) {
  const terminado = item.estado && item.estado !== 'EN PROCESO';

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.foto ?? 'https://i.pravatar.cc/150?img=12' }}
        style={styles.avatar}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre} {item.apellido}
          </Text>

          <View style={styles.ratingWithInfo}>
            <RatingBadge rating={item.estrellas} />
            <InfoBadge mensaje="Este puntaje refleja las reseñas que otros clientes dejaron sobre este trabajador después de contratarlo." />
          </View>
        </View>

        <Text style={styles.cardZona} numberOfLines={1}>
          🛠️ {item.servicio_nombre ?? 'Servicio sin especificar'}
        </Text>

        <View style={styles.cardFooterRow}>
          <Text style={styles.cardPrecio}>
            {item.precio != null ? `$${Number(item.precio).toLocaleString('es-AR')}` : '-'}
          </Text>

          <View style={[
            styles.estadoBadge,
            { backgroundColor: terminado ? 'rgba(34,197,94,0.2)' : 'rgba(245,166,35,0.2)' },
          ]}>
            <Text style={[
              styles.estadoText,
              { color: terminado ? '#4ade80' : '#F5A623' },
            ]}>
              {item.estado ?? '-'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => onPressChat?.(item)}
        activeOpacity={0.8}
      >
        <ChatIcon />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#2a4fd6',
  },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  cardName: { color: WHITE, fontWeight: '700', fontSize: 15, flex: 1 },

  ratingWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_DARK,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ratingText: { color: WHITE, fontSize: 11, fontWeight: '600' },
  ratingStar: { color: GOLD, fontSize: 11 },

  infoBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBadgeText: { color: WHITE, fontSize: 10, fontWeight: '800' },

  cardZona: { color: '#c0ceff', fontSize: 12 },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardPrecio: { color: WHITE, fontWeight: '800', fontSize: 14 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  estadoText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  chatButton: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  chatBubble: {
    width: 28,
    height: 22,
    backgroundColor: WHITE,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: { flexDirection: 'row', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: BLUE_CARD },
});