import { Platform } from 'react-native';


const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://186.19.146.13:3000'; //poner la de tu wifi para probar mobil


export default API_URL;
