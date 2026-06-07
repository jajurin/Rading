import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default function Search(){
  return(
  <View style={styles.searchContainer}>
         <Text style={styles.searchIconText}>🔍</Text>
         <TextInput
           style={styles.searchInput}
           placeholder="¿Qué necesita? Ej: electricista, etc"
           placeholderTextColor="#000000"
         />
         <TouchableOpacity style={styles.filterBtn}>
           <Text style={styles.filterIcon}>⟨⟩</Text>
         </TouchableOpacity>
       </View>
  )

 
}

 const styles = StyleSheet.create({
searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8a8a8a',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
     marginTop: 20,
    marginBottom: 5
  },
  searchIconText: {
  
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    color: '#000000',
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterBtn: {
    padding: 4,
  },
  filterIcon: {
    color: '#000000',
    fontSize: 20,
  }

    
  })