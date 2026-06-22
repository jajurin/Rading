import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import app from './src/app.js'
import cors from "cors";

// Load src/.env explicitly so services using process.env get keys
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, 'src', '.env') })

app.use(cors());
const port = 3000

app.listen(port, '0.0.0.0', () => console.log('Servidor en puerto', port))