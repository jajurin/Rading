import app from './src/app.js'
import cors from "cors";
app.use(cors());
const port = 3000

app.listen(3000, '0.0.0.0', () => console.log('Servidor en puerto 3000'))