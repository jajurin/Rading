import { Platform } from 'react-native';


const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.0.7:3000';


export default API_URL;
