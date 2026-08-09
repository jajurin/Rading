import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import app from './src/app.js'
import cors from "cors";
import SubastaServices from './src/services/subasta-services.js';
// Load src/.env explicitly so services using process.env get keys
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, 'src', '.env') })

app.use(cors());
const port = 3000

const subastaSvc = new SubastaServices()

setInterval(() => {
subastaSvc.avisarSubastasVencidas().catch(err => console.error('Error avisando subastas:', err))}, 60 * 1000) // revisa cada 1 minuto
app.listen(port, '0.0.0.0', () => console.log('Servidor en puerto', port))