import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Header y BottomNavBar ya existen en el proyecto, solo los importamos y usamos
import Header from '../Header';
import BottomNavBar from '../Cliente/NavegadorCliente';

// --- Datos de ejemplo ---
const OFERTAS = [
  {
    id: '1',
    nombre: 'Rodrigo Perez',
    categoria: 'Plomeria',
    horario: '17:30',
    distancia: '1.2km',
    tipo: 'fijo',
    monto: '23.000$',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '2',
    nombre: 'Andre Díaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'sub',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const TRABAJOS = [
  {
    id: '1',
    nombre: 'Juan Perez',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    color: '#2E6BFF',
  },
  {
    id: '2',
    nombre: 'Laura Choe',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    color: '#A94FE0',
  },
  {
    id: '3',
    nombre: 'Elina Gómez',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    color: '#3ECF6E',
  },
];

// --- Subcomponentes ---

function BannerPatrocinios() {
  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerTagFila}>
        <Ionicons name="megaphone-outline" size={14} color="#FFFFFF" />
        <Text style={styles.bannerTag}>PATROCINIOS</Text>
      </View>

      <Text style={styles.bannerTitulo}>¿Querés más{'\n'}visibilidad?</Text>
      <Text style={styles.bannerSubtitulo}>
        Patrocinate y llegá a miles de clientes{'\n'}que ya usan la app.
      </Text>

      <View style={styles.bannerBotonesFila}>
        <TouchableOpacity style={styles.bannerBotonSecundario}>
          <Text style={styles.bannerBotonSecundarioTexto}>Ver planes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bannerBotonPrimario}>
          <Text style={styles.bannerBotonPrimarioTexto}>¡Quiero patrocinarme!</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bannerIconoWrapper}>
        <Ionicons name="phone-portrait-outline" size={40} color="rgba(255,255,255,0.35)" />
      </View>
    </View>
  );
}

function BarraBusqueda() {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#8A8FA3" style={{ marginRight: 8 }} />
      <TextInput
        style={styles.searchInput}
        placeholder="¿Qué prefiere? Ej: precio, ubi, etc"
        placeholderTextColor="#8A8FA3"
      />
    </View>
  );
}

function TarjetaOferta({ oferta }) {
  return (
    <View style={styles.ofertaCard}>
      <Image source={{ uri: oferta.avatar }} style={styles.ofertaAvatar} />

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.ofertaNombre}>{oferta.nombre}</Text>

        <View style={styles.ofertaFila}>
          <View style={styles.ofertaColumna}>
            <Text style={styles.ofertaLabel}>Categoria:</Text>
            <Text style={styles.ofertaValor}>{oferta.categoria}</Text>
          </View>
          <View style={styles.ofertaColumna}>
            <Text style={styles.ofertaLabel}>Horario:</Text>
            <Text style={styles.ofertaValor}>{oferta.horario}</Text>
          </View>
        </View>

        <View style={styles.ofertaFila}>
          <View style={styles.ofertaColumna}>
            <Text style={styles.ofertaLabel}>Distancia:</Text>
            <Text style={styles.ofertaValor}>{oferta.distancia}</Text>
          </View>
          <View style={styles.ofertaColumna}>
            {oferta.tipo === 'fijo' ? (
              <>
                <Text style={styles.ofertaLabel}>Fijo:</Text>
                <Text style={styles.ofertaValor}>{oferta.monto}</Text>
              </>
            ) : (
              <>
                <Text style={styles.ofertaLabel}>Sub:</Text>
                <TouchableOpacity>
                  <Text style={styles.ofertaValor}>•••</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function AvatarTrabajo({ trabajo }) {
  return (
    <View style={styles.trabajoItem}>
      <View style={[styles.trabajoAvatarWrapper, { borderColor: trabajo.color }]}>
        <Image source={{ uri: trabajo.avatar }} style={styles.trabajoAvatar} />
      </View>
      <Text style={styles.trabajoNombre} numberOfLines={1}>
        {trabajo.nombre}
      </Text>
    </View>
  );
}

function TituloConMas({ titulo }) {
  return (
    <View style={styles.tituloFila}>
      <Text style={styles.tituloSeccion}>{titulo}</Text>
      <TouchableOpacity>
        <Text style={styles.masLink}>Más...</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Componente principal ---

export default function OfertasScreen() {
  return (
    <View style={styles.pantalla}>
      <Header />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <BannerPatrocinios />
        <BarraBusqueda />

        <TituloConMas titulo="Ofertas cercanas:" />
        {OFERTAS.map((oferta) => (
          <TarjetaOferta key={oferta.id} oferta={oferta} />
        ))}

        <TituloConMas titulo="Mis trabajos" />
        <View style={styles.trabajosFila}>
          {TRABAJOS.map((trabajo) => (
            <AvatarTrabajo key={trabajo.id} trabajo={trabajo} />
          ))}
        </View>
      </ScrollView>

      <BottomNavBar pantallaActiva="inicio" />
    </View>
  );
}

// --- Estilos ---

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  bannerContainer: {
    backgroundColor: '#1D3FBF',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    overflow: 'hidden',
  },
  bannerTagFila: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  bannerTitulo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  bannerSubtitulo: {
    color: '#CBD5F5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBotonesFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bannerBotonSecundario: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 6,
  },
  bannerBotonSecundarioTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerBotonPrimario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  bannerBotonPrimarioTexto: {
    color: '#1D3FBF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerIconoWrapper: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F2F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
  },
  tituloFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  tituloSeccion: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D3FBF',
  },
  masLink: {
    fontSize: 13,
    color: '#1D3FBF',
    textDecorationLine: 'underline',
  },
  ofertaCard: {
    flexDirection: 'row',
    backgroundColor: '#1D3FBF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  ofertaAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  ofertaNombre: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  ofertaFila: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  ofertaColumna: {
    flex: 1,
  },
  ofertaLabel: {
    color: '#CBD5F5',
    fontSize: 11,
  },
  ofertaValor: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  trabajosFila: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  trabajoItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 72,
  },
  trabajoAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trabajoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  trabajoNombre: {
    marginTop: 6,
    fontSize: 12,
    color: '#1A1A2E',
    textAlign: 'center',
  },
});