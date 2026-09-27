import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../ThemeContext'

const BLUE = '#1565D8'
const FIELD_BG = '#E4E2E2'

/**
 * Campo tipo "globo de texto" (label + valor) con lapicera.
 * Al tocar la lapicera se abre un modal donde se agranda el texto
 * y se puede reescribir. Al guardar, llama a onGuardar(nuevoValor).
 */
export default function CampoEditable({ etiqueta, valor, onGuardar, multiline = true }) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false)
  const [borrador, setBorrador] = useState(valor ?? '')

  const abrir = () => {
    setBorrador(valor ?? '')
    setModalVisible(true)
  }

  const guardar = () => {
    onGuardar?.(borrador)
    setModalVisible(false)
  }

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <>
      <View style={styles.fieldBox}>
        <View style={styles.fieldTextWrapper}>
          <Text style={styles.fieldLabel}>{etiqueta}</Text>
          <Text style={styles.fieldValue}>{valor || '-'}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={abrir}>
          <Ionicons name="pencil" size={14} color="#000" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalFondo}
        >
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>{etiqueta}</Text>
            <TextInput
              style={styles.modalInput}
              value={borrador}
              onChangeText={setBorrador}
              multiline={multiline}
              autoFocus
            />
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalGuardar} onPress={guardar}>
                <Text style={styles.modalGuardarTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const createStyles = (colors, isDark) => StyleSheet.create({
  fieldBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.inputBg, borderRadius: 12, padding: 10, marginBottom: 10 },
  fieldTextWrapper: { flex: 1, marginRight: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: BLUE, marginBottom: 2 },
  fieldValue: { fontSize: 12, color: colors.text },
  editButton: { paddingTop: 2 },

  modalFondo: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCaja: { width: '100%', backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  modalTitulo: { fontSize: 15, fontWeight: '700', color: BLUE, marginBottom: 10 },
  modalInput: { minHeight: 90, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, padding: 10, fontSize: 14, color: colors.text, textAlignVertical: 'top' },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 12 },
  modalCancelar: { paddingVertical: 8, paddingHorizontal: 14 },
  modalCancelarTexto: { color: colors.textSecondary, fontWeight: '600' },
  modalGuardar: { backgroundColor: BLUE, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  modalGuardarTexto: { color: '#fff', fontWeight: '700' },
})
