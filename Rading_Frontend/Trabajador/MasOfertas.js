import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Header y BottomNavBar ya existen en el proyecto, solo los importamos y usamos
import Header from '../Header';
import BottomNavBar from '../Cliente/NavegadorCliente';

// --- Datos de ejemplo ---
const EMERGENCIAS = [
  {
    id: 'e1',
    nombre: 'Andre Diaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'fijo',
    monto: '32.000$',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 'e2',
    nombre: 'Andre Diaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'fijo',
    monto: '32.000$',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const OFERTAS = [
  {
    id: 'o1',
    nombre: 'Andre Diaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'fijo',
    monto: '32.000$',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    seleccionada: true,
  },
  {
    id: 'o2',
    nombre: 'Andre Diaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'fijo',
    monto: '32.000$',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 'o3',
    nombre: 'Andre Diaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'fijo',
    monto: '32.000$',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 'o4',
    nombre: 'Andre Diaz',
    categoria: 'Plomeria',
    horario: '16:30',
    distancia: '1.8km',
    tipo: 'sub',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

// --- Subcomponentes ---

function IconoFiltro() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="#1D3FBF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TituloConFiltro() {
  return (
    <View style={styles.tituloFila}>
      <Text style={styles.tituloSeccion}>Ofertas cercanas:</Text>
      <TouchableOpacity style={styles.filtroBoton}>
        <IconoFiltro />
      </TouchableOpacity>
    </View>
  );
}

function DatoOferta({ oferta, claro }) {
  return (
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={[styles.ofertaNombre, claro && styles.textoClaro]}>{oferta.nombre}</Text>

      <View style={styles.ofertaFila}>
        <View style={styles.ofertaColumna}>
          <Text style={[styles.ofertaLabel, claro && styles.labelClaro]}>Categoria:</Text>
          <Text style={[styles.ofertaValor, claro && styles.textoClaro]}>{oferta.categoria}</Text>
        </View>
        <View style={styles.ofertaColumna}>
          <Text style={[styles.ofertaLabel, claro && styles.labelClaro]}>Horario:</Text>
          <Text style={[styles.ofertaValor, claro && styles.textoClaro]}>{oferta.horario}</Text>
        </View>
      </View>

      <View style={styles.ofertaFila}>
        <View style={styles.ofertaColumna}>
          <Text style={[styles.ofertaLabel, claro && styles.labelClaro]}>Distancia:</Text>
          <Text style={[styles.ofertaValor, claro && styles.textoClaro]}>{oferta.distancia}</Text>
        </View>
        <View style={styles.ofertaColumna}>
          {oferta.tipo === 'fijo' ? (
            <>
              <Text style={[styles.ofertaLabel, claro && styles.labelClaro]}>Fijo:</Text>
              <Text style={[styles.ofertaValor, claro && styles.textoClaro]}>{oferta.monto}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.ofertaLabel, claro && styles.labelClaro]}>Sub:</Text>
              <TouchableOpacity>
                <Text style={[styles.ofertaValor, claro && styles.textoClaro]}>•••</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function TarjetaEmergencia({ oferta }) {
  return (
    <View style={styles.emergenciaCard}>
      <Image source={{ uri: oferta.avatar }} style={styles.avatarClaro} />
      <DatoOferta oferta={oferta} />
    </View>
  );
}

function TarjetaOferta({ oferta, seleccionada, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.ofertaCard, seleccionada && styles.ofertaCardSeleccionada]}
    >
      <Image source={{ uri: oferta.avatar }} style={styles.avatarClaro} />
      <DatoOferta oferta={oferta} claro={seleccionada} />
    </TouchableOpacity>
  );
}

// --- Componente principal ---

export default function MasOfertasScreen() {
  const [seleccionadaId, setSeleccionadaId] = useState('o1');

  return (
    <View style={styles.pantalla}>
      <Header />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <TituloConFiltro />

        {/* Bloque de emergencia */}
        <View style={styles.emergenciaBloque}>
          <Text style={styles.emergenciaTitulo}>EMERGENCIA</Text>
          {EMERGENCIAS.map((oferta) => (
            <TarjetaEmergencia key={oferta.id} oferta={oferta} />
          ))}
        </View>

        {/* Resto de ofertas */}
        {OFERTAS.map((oferta) => (
          <TarjetaOferta
            key={oferta.id}
            oferta={oferta}
            seleccionada={seleccionadaId === oferta.id}
            onPress={() => setSeleccionadaId(oferta.id)}
          />
        ))}
      </ScrollView>

      <BottomNavBar pantallaActiva="busqueda" />
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
  tituloFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  tituloSeccion: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D3FBF',
  },
  filtroBoton: {
    padding: 4,
  },

  // --- Bloque emergencia ---
  emergenciaBloque: {
    backgroundColor: '#EE4B4B',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  emergenciaTitulo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emergenciaCard: {
    flexDirection: 'row',
    backgroundColor: '#F0605A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },

  // --- Tarjetas de oferta ---
  ofertaCard: {
    flexDirection: 'row',
    backgroundColor: '#1D3FBF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ofertaCardSeleccionada: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1D3FBF',
  },
  avatarClaro: {
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
  // Cuando la tarjeta está seleccionada (fondo blanco), el texto pasa a oscuro
  textoClaro: {
    color: '#1D3FBF',
  },
  labelClaro: {
    color: '#5C6BC0',
  },
});