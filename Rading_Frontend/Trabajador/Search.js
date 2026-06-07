import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Search({ onSearch }) {
  const [texto, setTexto] = useState('');

  const handleBuscar = () => {
    if (onSearch) onSearch(texto);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscá por nombre..."
          placeholderTextColor="#A0AEC0"
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={handleBuscar}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={handleBuscar}>
          <Text style={styles.filterText}>Buscar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1565D8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A202C',
    paddingVertical: 8,
  },
  filterBtn: {
    backgroundColor: '#1565D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});