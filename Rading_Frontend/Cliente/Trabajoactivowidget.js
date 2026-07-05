  import React, { useState } from 'react';
  import { View, StyleSheet } from 'react-native';
  import TrabajoActivoCliente from './TrabajoActivoCliente';
  import OfertaRecibidaOverlayCliente from './OfertaRecibidaOverlayCliente';

  /**
   * TrabajoActivoWidget
   * ────────────────────────────────────────────────────────────────
   * Componente reutilizable que agrupa la tarjeta de "trabajo activo"
   * (TrabajoActivoCliente) junto con el overlay de oferta recibida
   * (OfertaRecibidaOverlayCliente), manejando internamente el estado
   * de visibilidad del overlay y la navegación al chat.
   *
   * Se posiciona de forma FIJA (absolute) sobre la pantalla, así que
   * no se mueve ni desaparece al hacer scroll. Por eso debe renderizarse
   * FUERA de cualquier ScrollView, como hermano directo (por ejemplo,
   * justo antes del BottomNavBar en HomeCliente).
   *
   * Props:
   *  - idCliente: number | string   → id del cliente logueado
   *  - navigation: objeto de navegación (para ir al Chat)
   *  - style: estilo opcional adicional para el contenedor de la tarjeta
   */
  export default function TrabajoActivoWidget({ idCliente, usuario, navigation, style }) {
    const [showOferta, setShowOferta] = useState(false);

    return (
      <>
        <View style={[styles.floatingWrapper, style]}>
          <TrabajoActivoCliente onPress={() => setShowOferta(true)} />
        </View>

        <OfertaRecibidaOverlayCliente
          visible={showOferta}
          onClose={() => setShowOferta(false)}
          idCliente={idCliente}
          usuario={usuario}
          onChat={(trabajo) => {
            setShowOferta(false);
            navigation.navigate('Chat', { trabajo });
          }}
          navigation={navigation}
        />
      </>
    );
  }

  const styles = StyleSheet.create({
    floatingWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 150, // ajustá este valor según la altura de tu BottomNavBar
      zIndex: 20,
      elevation: 20, // necesario en Android para que quede por encima del resto
    },
  });