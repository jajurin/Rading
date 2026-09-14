import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'https://xngx9btq-3000.brs.devtunnels.ms/'; // <-- corregido, era .0.1

export default API_URL;