import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './Login';
import Registrarse from './Registrarse';
import TipoUsuario from './TipoUsuario';
import RegistrarseCliente from './Cliente/RegistrarseCliente';
import RegistrarseTrabajador from './Trabajador/RegistrarseTrabajdor';
import BuscadorCliente from './Cliente/BuscadorCliente';
import BuscadorTrabajador from './Trabajador/BuscadorTrabajador';
import VerTrabajosRealizados from './Trabajador/VerTrabajosRealizados';
import BottomNavBar from './Cliente/NavegadorCliente';
import CrearSolicitud from './Cliente/CrearSolicitud'; // <-- pantalla nueva
import PerfilScreen from './Cliente/PerfilCliente';
import RecibirOfertasScreen from './Cliente/RecibirOfertaScreen';
import ClasificarTrabajador from './Cliente/Resenia';
import HomeCliente from './Cliente/HomeCliente';
import RecientesClientes from './Cliente/RecienteClientes';

import OfertaRecibidaOverlayCliente from './Cliente/OfertaRecibidaOverlayCliente';


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CrearSolicitud" component={CrearSolicitud} />
      <Stack.Screen name="Login" component={Login} />
           <Stack.Screen name="Perfil" component={PerfilScreen} />   
     <Stack.Screen name="RecienteClientes" component={RecientesClientes} />
    
      <Stack.Screen name="HomeCliente" component={HomeCliente} />
            
    
        <Stack.Screen name="ClasificarTrabajador" component={ClasificarTrabajador} />
      
             <Stack.Screen name="RegistrarseTrabajador" component={RegistrarseTrabajador} />
          <Stack.Screen name="Registrarse" component={Registrarse} />
            <Stack.Screen name="VerTrabajosRealizados" component={VerTrabajosRealizados} />
        <Stack.Screen name="RecibirOfertasScreen" component={RecibirOfertasScreen} />
        <Stack.Screen name="PerfilScreen" component={PerfilScreen} />

        <Stack.Screen name="navegador" component={BottomNavBar} />
        
        <Stack.Screen name="bottombar" component={BottomNavBar} />
        <Stack.Screen name="TipoUsuario" component={TipoUsuario} />
      
        <Stack.Screen name="RegistrarseCliente" component={RegistrarseCliente} />
   
        <Stack.Screen name="BuscadorCliente" component={BuscadorCliente} />
        <Stack.Screen name="BuscadorTrabajador" component={BuscadorTrabajador} />
    
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}