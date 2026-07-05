import { Platform } from 'react-native';


const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.0.7:3000'; //poner la de tu wifi para probar mobil


export default API_URL;
