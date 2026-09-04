import { Platform } from 'react-native';

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'https://3kfl250p-8081.brs.devtunnels.ms/'; // <-- corregido, era .0.1

export default API_URL;