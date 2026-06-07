import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import API_URL from '../configS';
import TrabajoActivoTrabajador from '../Trabajador/TrabajoActivoTrabajador';
import Search from '../Trabajador/Search';

const RatingBadge = ({ rating }) => (
  <View style={styles.ratingBadge}>
    <Text style={styles.ratingText}>{Number(rating).toFixed(2)}</Text>
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

const ClienteCard = ({ item, onPressChat }) => (
  <View style={styles.card}>
    <TouchableOpacity activeOpacity={0.8}>
      <Image
        source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
        style={styles.avatar}
      />
    </TouchableOpacity>

    <View style={styles.cardBody}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.nombre} {item.apellido}</Text>
        <RatingBadge rating={item.estrellas ?? 0} />
      </View>
      <Text style={styles.cardZona}>📧 {item.email ?? '-'}</Text>
      <Text style={styles.cardBio} numberOfLines={2}>
        📞 {item.telefono ?? 'Sin teléfono'}
      </Text>
    </View>

    <TouchableOpacity style={styles.chatButton} onPress={() => onPressChat(item)} activeOpacity={0.8}>
      <ChatIcon />
    </TouchableOpacity>
  </View>
);

export default function BuscadorTrabajador() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [buscado, setBuscado]   = useState(false);

  const fetchClientes = async (texto = '') => {
    if (!texto.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setBuscado(true);
      const url = `${API_URL}/trabajador/buscarCliente?texto=${encodeURIComponent(texto)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setClientes(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar Clientes</Text>
        <Text style={styles.headerSub}>Encontrá el cliente que necesitás</Text>
      </View>

      <Search onSearch={fetchClientes} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1565D8" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.placeholderIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !buscado ? (
        <View style={styles.centerBox}>
          <Text style={styles.placeholderIcon}>🔍</Text>
          <Text style={styles.placeholderText}>Escribí un nombre para buscar</Text>
        </View>
      ) : clientes.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.placeholderIcon}>😕</Text>
          <Text style={styles.placeholderText}>No se encontraron clientes</Text>
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {clientes.length} resultado{clientes.length !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <ClienteCard item={item} onPressChat={() => {}} />
          )}
        />
      )}

      <TrabajoActivoTrabajador />
    </SafeAreaView>
  );
}

const WHITE = '#ffffff';
const GOLD = '#ffd700';
const BLUE_CARD = '#1e35b5';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6FB' },

  header: {
    backgroundColor: '#1565D8',
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  headerTitle: { color: WHITE, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { color: '#A0AEC0', fontSize: 15, textAlign: 'center' },
  loadingText: { color: '#1565D8', fontSize: 14, marginTop: 8 },
  errorText: { color: '#E53E3E', fontSize: 14 },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  resultCount: {
    color: '#A0AEC0', fontSize: 12, fontWeight: '600',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1565D8', borderRadius: 12, marginBottom: 10, padding: 12, gap: 10, elevation: 4 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#2a4fd6' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 },
  cardName: { color: WHITE, fontWeight: '700', fontSize: 15 },
  cardZona: { color: '#c0ceff', fontSize: 11, marginBottom: 3 },
  cardBio: { color: '#dce4ff', fontSize: 12, lineHeight: 16 },

  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0f3c', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, gap: 2 },
  ratingText: { color: WHITE, fontSize: 11, fontWeight: '600' },
  ratingStar: { color: GOLD, fontSize: 11 },

  chatButton: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  chatBubble: { width: 28, height: 22, backgroundColor: WHITE, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: BLUE_CARD },
});