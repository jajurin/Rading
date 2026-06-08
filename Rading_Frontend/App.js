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
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="TipoUsuario" component={TipoUsuario} />
        <Stack.Screen name="Registrarse" component={Registrarse} />
        <Stack.Screen name="RegistrarseCliente" component={RegistrarseCliente} />
        <Stack.Screen name="RegistrarseTrabajador" component={RegistrarseTrabajador} />
        <Stack.Screen name="BuscadorCliente" component={BuscadorCliente} />
        <Stack.Screen name="BuscadorTrabajador" component={BuscadorTrabajador} />
        <Stack.Screen name="VerTrabajosRealizados" component={VerTrabajosRealizados} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}