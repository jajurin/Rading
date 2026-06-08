import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../configS';
import Search from './Search';

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

const TrabajoCard = ({ item }) => {
  const terminado = item.estado === 'TERMINADO';
  const initials = getInitials(item.nombre, item.apellido);
  const avatarColor = getAvatarColor(item.nombre);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor.bg }]}>
            <Text style={[styles.avatarText, { color: avatarColor.text }]}>{initials}</Text>
          </View>
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
            <Ionicons name="construct-outline" size={11} color="#94A3B8" />
            <Text style={styles.servicioText} numberOfLines={1}>
              {item.servicio_nombre ?? 'Sin servicio'}
            </Text>
          </View>
        </View>

        <View style={[
          styles.estadoBadge,
          { backgroundColor: terminado ? '#EAF3DE' : '#FEF3C7' },
        ]}>
          <Text style={[
            styles.estadoText,
            { color: terminado ? '#3B6D11' : '#854F0B' },
          ]}>
            {item.estado}
          </Text>
        </View>
      </View>

      {/* Footer: métricas */}
      <View style={styles.cardFooter}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>PRECIO</Text>
          <Text style={styles.metaValue}>
            {item.precio != null ? `$${item.precio.toLocaleString('es-AR')}` : '-'}
          </Text>
        </View>

        <View style={styles.metaDivider} />

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
      </View>
    </View>
  );
};

export default function VerTrabajosRealizados({ route, navigation }) {
  const { idTrabajador } = route.params;
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrabajos();
  }, []);

  const fetchTrabajos = async (texto = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/trabajador/trabajosRealizados/${idTrabajador}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      const filtrados = texto.trim()
        ? lista.filter(t =>
            `${t.nombre} ${t.apellido}`.toLowerCase().includes(texto.toLowerCase())
          )
        : lista;
      setTrabajos(filtrados);
    } catch (e) {
      setError('No se pudieron cargar los trabajos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Trabajos Realizados</Text>
          <Text style={styles.headerSub}>Tu historial de trabajos</Text>
        </View>
      </View>

      <Search onSearch={fetchTrabajos} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1565D8" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : trabajos.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No tenés trabajos realizados</Text>
        </View>
      ) : (
        <FlatList
          data={trabajos}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {trabajos.length} trabajo{trabajos.length !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => <TrabajoCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // Header
  header: {
    backgroundColor: '#1565D8',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  // States
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#1565D8', fontSize: 14 },
  errorText: { color: '#E53E3E', fontSize: 14 },
  emptyText: { color: '#94A3B8', fontSize: 15 },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
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
    backgroundColor: '#1565D8',
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

  // Card Header
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
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    backgroundColor: '#1565D8',
    marginHorizontal: 4,
    alignSelf: 'stretch',
  },
});
