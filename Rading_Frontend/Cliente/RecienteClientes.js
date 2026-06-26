import React from 'react';
import Header from '../Header';
import TrabajoActivoCliente from './TrabajoActivoCliente';
import BottomNavBar from './NavegadorCliente';
import {

 View,
 Text,
 StyleSheet,
 FlatList,
 TouchableOpacity,
 Image,
 SafeAreaViewBase,
} from 'react-native';

const DATA = [
 {
   id: '1',
   nombre: 'Diana Park',
   horario: '00:00',
   distancia: '1.2km',
   tipo: 'Fijo',
   precio: '$$$$',
 },
 {
   id: '2',
   nombre: 'Diana Park',
   horario: '00:00',
   distancia: '1.2km',
   tipo: 'Sub',
   precio: '$$$$',
 },
 {
   id: '3',
   nombre: 'Diana Park',
   horario: '00:00',
   distancia: '1.2km',
   tipo: 'Fijo',
   precio: '$$$$',
 },
 {
   id: '4',
   nombre: 'Diana Park',
   horario: '00:00',
   distancia: '1.2km',
   tipo: 'Sub',
   precio: '$$$$',
 },
 {
   id: '5',
   nombre: 'Diana Park',
   horario: '00:00',
   distancia: '1.2km',
   tipo: 'Fijo',
   precio: '$$$$',
 },
 {
   id: '6',
   nombre: 'Diana Park',
   horario: '00:00',
   distancia: '1.2km',
   tipo: 'Sub',
   precio: '$$$$',
 },
];

export default function RecientesClientes() {
 const renderItem = ({ item, index }) => {
   const borderColor = index % 2 === 0 ? '#00FF4C' : '#FF003C';

   return (



     <TouchableOpacity
       style={[
         styles.card,
         {
           borderColor,
         },
       ]}
     >
       {/* Sector izquierdo */}
       <View style={styles.leftContainer}>
         <Text style={styles.name}>{item.nombre}</Text>

         <Image
           source={{
             uri: 'https://i.pravatar.cc/100?img=32',
           }}
           style={styles.avatar}
         />
       </View>

       {/* Sector derecho */}
       <View style={styles.rightContainer}>
         <Text style={styles.time}>
           Horario: {item.horario}
         </Text>

         <Text style={styles.distance}>
           Distancia: {item.distancia}
         </Text>

         <Text style={styles.price}>
           {item.tipo}: {item.precio}
         </Text>
       </View>
     </TouchableOpacity>
   );
 };

 return (

  <View style={styles.container}>
    <Header />


    <FlatList
  data={DATA}
  renderItem={renderItem}
  ListHeaderComponent={<Text style={styles.title}>Recientes:</Text>}
  ListFooterComponent={<TrabajoActivoCliente />}
  contentContainerStyle={{
    flexGrow: 1,
    paddingBottom: 120,
  }}
/>


    <BottomNavBar />
  </View>
  
);
}

const styles = StyleSheet.create({
 container: {
   flex: 1,

 },
 FlatList:{
    flex: 1,
    
 },


 title: {
  fontSize: 28,
  color: '#333',
  marginBottom: 15,
  marginLeft: 10,
},

listContent: {
  paddingHorizontal: 12,
  paddingTop: 10,
  paddingBottom: 20,
},

content: {
  flex: 1,
  paddingHorizontal: 12,
},

 card: {
   flexDirection: 'row',
   backgroundColor: '#004FD6',
   borderWidth: 2,
   borderRadius: 10,
   overflow: 'hidden',
   marginBottom: 12,
   minHeight: 88,
 },

 leftContainer: {
   width: 75,
   backgroundColor: '#ECECEC',
   alignItems: 'center',
   justifyContent: 'center',
   paddingVertical: 5,
 },

 name: {
   color: '#4266ff',
   fontSize: 11,
   marginBottom: 4,
 },

 avatar: {
   width: 42,
   height: 42,
   borderRadius: 21,
 },

 rightContainer: {
   flex: 1,
   paddingHorizontal: 10,
   paddingVertical: 8,
   justifyContent: 'space-between',
 },

 time: {
   color: 'white',
   textAlign: 'right',
   fontSize: 16,
 },

 distance: {
   color: 'white',
   fontWeight: 'bold',
   fontSize: 13,
 },

 price: {
   color: 'white',
   textAlign: 'right',
   fontWeight: 'bold',
   fontSize: 18,
 },
});


