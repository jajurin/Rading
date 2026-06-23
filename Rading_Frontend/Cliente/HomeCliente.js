import React from 'react';
import TrabajoActivoCliente from './TrabajoActivoCliente';
import Header from '../Header';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image
} from 'react-native';








export default function HomeCliente() {
  const categorias = [
    'Electricista',
    'Plomero',
    'Obrero',
  ];




  const recientes = [
    {
      id: 1,
      nombre: 'Juan Perez',
      foto: 'https://i.pravatar.cc/150?img=12'
    },
    {
      id: 2,
      nombre: 'Laura'
    },
    {
      id: 3,
      nombre: 'Sergio'
    }
  ];




  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>




        {/* HEADER */}
       <Header/>




        {/* BANNER */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>NOVEDADES</Text>




          <Text style={styles.bannerTitle}>
            Nuevas funciones y ofertas para vos
          </Text>




          <Text style={styles.bannerText}>
            Descubrí todo lo nuevo que preparamos
          </Text>




          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>
              Ver novedades
            </Text>
          </TouchableOpacity>
        </View>




        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="¿Qué necesita? Ej: electricista"
            style={styles.searchInput}
          />
        </View>




        {/* CATEGORIAS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías:</Text>
        </View>




        <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.horizontalContainer}
>
  {categorias.map((item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.categoryCard}
    >
      <Text style={styles.categoryIcon}>🏠</Text>
      <Text style={styles.categoryText}>
        {item}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>




        {/* RECIENTES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recientes:</Text>
          <TouchableOpacity>
            <Text style={styles.verMas}>Más...</Text>
          </TouchableOpacity>
        </View>




       <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.horizontalContainer}
>
  {recientes.map((item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.recentCard}
    >
      {item.foto ? (
        <Image
          source={{ uri: item.foto }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text>👤</Text>
        </View>
      )}




      <Text
        style={styles.recentName}
        numberOfLines={1}
      >
        {item.nombre}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>




        {/* TRABAJO ACTIVO */}
        <TrabajoActivoCliente/>




      </ScrollView>




      {/* TAB BAR */}
     




    </SafeAreaView>
  );
}




const BLUE = '#1565D8';




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECECEC'
  },




  header: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15
  },




  icon: {
    fontSize: 22
  },
  horizontalContainer: {
  paddingHorizontal: 15,
  paddingVertical: 10,
},




  direccion: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center'
  },




  casa: {
    color: '#fff',
    fontWeight: 'bold'
  },




  banner: {
    margin: 15,
    backgroundColor: '#2457d6',
    borderRadius: 30,
    padding: 20
  },




  bannerTag: {
    backgroundColor: '#4a7fff',
    alignSelf: 'flex-start',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 10
  },




  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10
  },




  bannerText: {
    color: '#dbe4ff',
    marginTop: 5
  },




  bannerButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8
  },




  bannerButtonText: {
    color: BLUE,
    fontWeight: 'bold'
  },




  searchContainer: {
    paddingHorizontal: 15
  },




  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 50
  },




  sectionHeader: {
    marginTop: 20,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },




  sectionTitle: {
    color: BLUE,
    fontWeight: 'bold',
    fontSize: 18
  },




  verMas: {
    color: BLUE
  },




  categoryCard: {
    width: 90,
    height: 90,
    backgroundColor: BLUE,
    marginLeft: 12,
    marginTop: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },




  categoryIcon: {
    fontSize: 24
  },




  categoryText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 11
  },




  recentCard: {
    width: 90,
    backgroundColor: BLUE,
    marginLeft: 12,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
    padding: 10
  },




  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },




  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },




  recentName: {
    color: '#fff',
    marginTop: 8
  },




  trabajoCard: {
    margin: 15,
    backgroundColor: '#DDE3F0',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },




  buscando: {
    color: '#666',
    fontSize: 10
  },




  trabajoTitulo: {
    fontWeight: 'bold',
    color: '#222'
  },




  arrow: {
    fontSize: 22
  },




  tabBar: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },




  tabText: {
    fontSize: 11,
    textAlign: 'center'
  },




  plusButton: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center'
  },




  plusText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  }
});
