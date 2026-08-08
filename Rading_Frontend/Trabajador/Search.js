import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const INDIGO = '#2A3FD6';
const TEXT_DARK = '#12172E';
const BORDER = 'rgba(15,27,76,0.08)';
const NAVY = '#0F1B4C';

export default function Search({ onSearch }) {
  const [texto, setTexto] = useState('');

  const handleBuscar = () => {
    if (onSearch) onSearch(texto);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#8A8FA3" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscá por nombre..."
          placeholderTextColor="#A0AEC0"
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={handleBuscar}
          returnKeyType="search"
        />
        {texto.length > 0 && (
          <TouchableOpacity onPress={() => setTexto('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color="#C3CADA" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.filterBtn} onPress={handleBuscar} activeOpacity={0.85}>
          <Text style={styles.filterText}>Buscar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_DARK,
    paddingVertical: 8,
  },
  filterBtn: {
    backgroundColor: INDIGO,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },
  filterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});