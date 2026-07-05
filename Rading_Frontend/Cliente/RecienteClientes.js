import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../configS';
import Header from '../Header';
import BottomNavBar from './NavegadorCliente';

const getInitials = (nombre = '', apellido = '') =>
  `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();

const AVATAR_COLORS = [
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
];

const getAvatarColor = (nombre = '') =>
  AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
};

const TrabajadorRecienteCard = ({ item, onPress }) => {
  const terminado = item.estado && item.estado !== 'EN PROCESO';
  const initials = getInitials(item.nombre, item.apellido);
  const avatarColor = getAvatarColor(item.nombre);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrapper}>
          {item.foto ? (
            <View style={[styles.avatarCircle, { backgroundColor: avatarColor.bg }]}>
              {/* Si querés mostrar la foto real, reemplazá este bloque por <Image source={{ uri: item.foto }} style={styles.avatarImg} /> */}
              <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
            </View>
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: avatarColor.bg }]}>
              <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
            </View>
          )}
          <View style={[
            styles.statusDot,
            { backgroundColor: terminado ? '#22c55e' : '#f59e0b' },
          ]} />
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre} {item.apellido}
          </Text>
          <View style={styles.servicioRow}>
            <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
            <Text style={styles.servicioText} numberOfLines={1}>
              Último trabajo: {formatDate(item.fecha_iniciado)}
            </Text>
          </View>
        </View>

        <View style={styles.precioBox}>
          <Text style={styles.precioValue}>
            {item.precio != null ? `$${Number(item.precio).toLocaleString('es-AR')}` : '-'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>INICIO</Text>
          <Text style={styles.metaValue}>{formatDate(item.fecha_iniciado)}</Text>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>FIN</Text>
          <Text style={[
            styles.metaValue,
            !item.fecha_acabado && { color: '#CBD5E1' },
          ]}>
            {formatDate(item.fecha_acabado)}
          </Text>
        </View>

        <View style={styles.metaDivider} />

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>ESTADO</Text>
          <Text style={[
            styles.metaValue,
            { color: terminado ? '#3B6D11' : '#854F0B' },
          ]}>
            {item.estado ?? '-'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function RecientesClientes({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const idCliente = usuario?.idCliente;

  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecientes = useCallback(async () => {
    if (!idCliente) {
      setLoading(false);
      setError('No se encontró el cliente');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/cliente/recientes/${idCliente}`);
      if (!res.ok) throw new Error(`Error ${res.status} al obtener recientes`);
      const data = await res.json();
      setRecientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar recientes:', e);
      setError('No se pudieron cargar los trabajadores recientes');
      setRecientes([]);
    } finally {
      setLoading(false);
    }
  }, [idCliente]);

  useEffect(() => {
    fetchRecientes();
  }, [fetchRecientes]);

  const irAContratar = (trabajador) => {
    // Ajustá el nombre de pantalla/params según lo que tengas armado
    // para volver a contratar o ver el perfil del trabajador.
    navigation?.navigate('BuscadorCliente', { trabajador });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header usuario={usuario} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1565D8" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Trabajadores recientes</Text>
          <Text style={styles.headerSub}>Tu historial de trabajadores contratados</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1565D8" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRecientes}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : recientes.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No tenés trabajadores recientes</Text>
        </View>
      ) : (
        <FlatList
          data={recientes}
          keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {recientes.length} trabajador{recientes.length !== 1 ? 'es' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <TrabajadorRecienteCard item={item} onPress={irAContratar} />
          )}
        />
      )}

      <BottomNavBar usuario={usuario} pantallaActiva="reciente" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#1E293B', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#94A3B8', fontSize: 13 },

  // States
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#1565D8', fontSize: 14 },
  errorText: { color: '#E53E3E', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    marginTop: 4,
    backgroundColor: '#1565D8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { color: '#94A3B8', fontSize: 15 },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140,
  },
  resultCount: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  cardMeta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  servicioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servicioText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  precioBox: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  precioValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1565D8',
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: '#FAFBFD',
  },
  metaItem: {
    flex: 1,
    gap: 3,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: '#94A3B8',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  metaValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  metaDivider: {
    width: 0.5,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    alignSelf: 'stretch',
  },
});