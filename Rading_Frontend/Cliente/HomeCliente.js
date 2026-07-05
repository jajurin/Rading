import React, { useRef, useState, useEffect, useCallback } from 'react';
import Header from '../Header';
import BottomNavBar from './NavegadorCliente';
import TrabajoActivoWidget from './Trabajoactivowidget';
import BuscadorTrabajadorWidget from './Buscadortrabajadorwidget';
import API_BASE_URL from '../configS';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
;

const BLUE       = '#1565D8';
const BLUE_DARK  = '#0d47a8';
const BLUE_LIGHT = '#3b7ff0';
const STATUS_BAR = '#0D4FD7'
const BG         = '#F3F5FA';

export default function HomeCliente({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const buscadorRef = useRef(null);
const insets = useSafeAreaInsets()
  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);

  const [recientes, setRecientes] = useState([]);
  const [cargandoRecientes, setCargandoRecientes] = useState(true);

  // Trae los servicios de la categoría preferida del cliente
  const cargarServicios = useCallback(async () => {
    if (!usuario?.idCliente) {
      setCargandoServicios(false);
      return;
    }
    try {
      setCargandoServicios(true);
      const resp = await fetch(`${API_BASE_URL}/cliente/servicios-preferidos/${usuario.idCliente}`);
      if (!resp.ok) throw new Error('Respuesta no OK al pedir servicios preferidos');
      const data = await resp.json();
      setServicios(data);
    } catch (err) {
      console.error('Error al cargar servicios preferidos:', err);
      setServicios([]);
    } finally {
      setCargandoServicios(false);
    }
  }, [usuario?.idCliente]);

  const cargarRecientes = useCallback(async () => {
    if (!usuario?.idCliente) {
      setCargandoRecientes(false);
      return;
    }
    try {
      setCargandoRecientes(true);
      const resp = await fetch(`${API_BASE_URL}/cliente/recientes/${usuario.idCliente}`);
      if (!resp.ok) throw new Error('Respuesta no OK al pedir recientes');
      const data = await resp.json();
      setRecientes(data);
    } catch (err) {
      console.error('Error al cargar recientes:', err);
      setRecientes([]);
    } finally {
      setCargandoRecientes(false);
    }
  }, [usuario?.idCliente]);

  useEffect(() => {
    cargarServicios();
    cargarRecientes();
  }, [cargarServicios, cargarRecientes]);

const buscarServicio = (nombreServicio) => {
  buscadorRef.current?.buscarPorEspecialidad(nombreServicio);
};

  return (
    <SafeAreaView style={styles.container}>
      
    <StatusBar barStyle="light-content" backgroundColor={STATUS_BAR} />
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.saludoRow}>
          <Text style={styles.saludoTexto}>
            Hola{usuario?.nombre ? `, ${usuario.nombre}` : ''} 👋
          </Text>
          <Text style={styles.saludoSub}>¿Qué necesitás resolver hoy?</Text>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerGlowTop} />
          <View style={styles.bannerGlowBottom} />
          <Text style={styles.bannerTag}>NOVEDADES</Text>
          <Text style={styles.bannerTitle}>
            Nuevas funciones y ofertas para vos
          </Text>
          <Text style={styles.bannerText}>
            Descubrí todo lo nuevo que preparamos
          </Text>
          <TouchableOpacity style={styles.bannerButton} activeOpacity={0.85}>
            <Text style={styles.bannerButtonText}>Ver novedades</Text>
            <Text style={styles.bannerButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <BuscadorTrabajadorWidget
          ref={buscadorRef}
          usuario={usuario}
          navigation={navigation}
        />

        {/* SERVICIOS de la categoría preferida del cliente */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servicios para vos</Text>
        </View>

        {cargandoServicios ? (
          <ActivityIndicator style={{ marginTop: 14 }} color={BLUE} />
        ) : servicios.length === 0 ? (
          <Text style={styles.emptyText}>No hay servicios disponibles para tu categoría</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContainer}
          >
            {servicios.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() => buscarServicio(s.nombre)}
              >
                <View style={styles.categoryIconWrap}>
                  <Text style={styles.categoryIcon}>🛠️</Text>
                </View>
                <Text style={styles.categoryText} numberOfLines={2}>
                  {s.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* RECIENTES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.verMas}>Ver más</Text>
          </TouchableOpacity>
        </View>

        {cargandoRecientes ? (
          <ActivityIndicator style={{ marginTop: 14 }} color={BLUE} />
        ) : recientes.length === 0 ? (
          <Text style={styles.emptyText}>No hay trabajadores recientes</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContainer}
          >
            {recientes.map((item) => (
              <TouchableOpacity
                key={item.idTrabajador}
                style={styles.recentCard}
                activeOpacity={0.85}
              >
                {item.foto ? (
                  <Image source={{ uri: item.foto }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>👤</Text>
                  </View>
                )}
                <Text style={styles.recentName} numberOfLines={1}>
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>

     {usuario?.idCliente != null && (
  <TrabajoActivoWidget
    idCliente={usuario.idCliente}
    usuario={usuario}
    navigation={navigation}
  />
)}

<BottomNavBar usuario={usuario} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  container: { flex: 1, backgroundColor: BG },
  scrollContent: {  paddingBottom: 180 },
  emptyText: { marginTop: 14, marginHorizontal: 16, color: '#8A94A6', fontSize: 13 },
  saludoRow: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  saludoTexto: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  saludoSub: { fontSize: 13, color: '#8A94A6', marginTop: 2 },
  banner: {
    margin: 16, marginTop: 14, backgroundColor: BLUE_DARK, borderRadius: 26,
    padding: 22, overflow: 'hidden', shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 8,
  },
  bannerGlowTop: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: BLUE_LIGHT, opacity: 0.35 },
  bannerGlowBottom: { position: 'absolute', bottom: -50, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: BLUE, opacity: 0.25 },
  bannerTag: { backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12, lineHeight: 28 },
  bannerText: { color: 'rgba(255,255,255,0.75)', marginTop: 6, fontSize: 13 },
  bannerButton: { marginTop: 16, backgroundColor: '#fff', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerButtonText: { color: BLUE_DARK, fontWeight: '700', fontSize: 13 },
  bannerButtonArrow: { color: BLUE_DARK, fontWeight: '700', fontSize: 13 },
  sectionHeader: { marginTop: 26, marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1A202C', fontWeight: '800', fontSize: 17 },
  verMas: { color: BLUE, fontWeight: '600', fontSize: 13 },
  horizontalContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 12 },
  categoryCard: {
    width: 92, height: 100, backgroundColor: '#fff', borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, paddingHorizontal: 6,
  },
  categoryIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(21,101,216,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryIcon: { fontSize: 20 },
  categoryText: { color: '#4A5568', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  recentCard: { width: 92, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', paddingVertical: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(21,101,216,0.15)' },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDF1F7', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 20 },
  recentName: { color: '#4A5568', marginTop: 8, fontSize: 12, fontWeight: '600' },
});