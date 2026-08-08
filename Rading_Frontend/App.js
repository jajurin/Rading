import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OfertasCercanasTrabajador from './Trabajador/Ofertascercanastrabajador';
import ChatCliente from './Cliente/Chat';
import ChatsCliente from './Cliente/PreviaChat';
import BottomNavBarTrabajador from './Trabajador/Navegadortrabajador';
import Login from './Login';
import Registrarse from './Registrarse';
import TipoUsuario from './TipoUsuario';
import RegistrarseCliente from './Cliente/RegistrarseCliente';
import RegistrarseTrabajador from './Trabajador/RegistrarseTrabajdor';
import BuscadorCliente from './Cliente/BuscadorCliente';
import BuscadorTrabajador from './Trabajador/BuscadorTrabajador';
import VerTrabajosRealizados from './Trabajador/VerTrabajosRealizados';
import BottomNavBar from './Cliente/NavegadorCliente';
import CrearSolicitud from './Cliente/CrearSolicitud';
import PerfilScreen from './Cliente/PerfilCliente';
import RecibirOfertasScreen from './Cliente/RecibirOfertaScreen';
import ClasificarTrabajador from './Cliente/Resenia';
import HomeCliente from './Cliente/HomeCliente';
import RecientesClientes from './Cliente/RecienteClientes';
import HomeTrabajador from './Trabajador/HomeTrabajador';
import MasOfertasScreen from './Trabajador/MasOfertas';

import OfertaRecibidaOverlayCliente from './Cliente/OfertaRecibidaOverlayCliente';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
         <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="MasOfertas" component={MasOfertasScreen} />
          <Stack.Screen name="HomeTrabajador" component={HomeTrabajador} />
          <Stack.Screen name="HomeCliente" component={HomeCliente} />
          
          <Stack.Screen name="ChatsCliente" component={ChatsCliente} />
          <Stack.Screen name="ChatCliente" component={ChatCliente} />

          <Stack.Screen name="RecibirOfertasScreen" component={RecibirOfertasScreen} />
          <Stack.Screen name="ClasificarTrabajador" component={ClasificarTrabajador} />
          <Stack.Screen name="PerfilScreen" component={PerfilScreen} />
          <Stack.Screen name="CrearSolicitud" component={CrearSolicitud} />
          <Stack.Screen name="RecienteClientes" component={RecientesClientes} />

          <Stack.Screen name="RegistrarseTrabajador" component={RegistrarseTrabajador} />
          <Stack.Screen name="Registrarse" component={Registrarse} />
          <Stack.Screen name="VerTrabajosRealizados" component={VerTrabajosRealizados} />
          <Stack.Screen name="navegador" component={BottomNavBar} />
          <Stack.Screen name="TipoUsuario" component={TipoUsuario} />
          <Stack.Screen name="RegistrarseCliente" component={RegistrarseCliente} />
          <Stack.Screen name="BuscadorCliente" component={BuscadorCliente} />
          <Stack.Screen name="BuscadorTrabajador" component={BuscadorTrabajador} />
 <Stack.Screen name="BottomNavBarTrabajador" component={BottomNavBarTrabajador} />
           <Stack.Screen name="ChatCliente" component={ChatCliente} />
          <Stack.Screen name="OfertaRecibidaOverlayCliente" component={OfertaRecibidaOverlayCliente} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}