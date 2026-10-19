import express from "express";
import cors from "cors";
import trabajadorRoutes from "./routes/trabajador-routes.js";
import clienteRoutes from "./routes/cliente-routes.js";
import usuarioRoutes from "./routes/usuario-routes.js";
import verificacionRoutes from "./routes/verificacion-routes.js"
import solicitudRouter from "./routes/solicitud-routes.js"
import chatRoutes from './routes/chat-routes.js'
import trabajoRoutes from './routes/trabajo-routes.js'
import notificacionRoutes from "./routes/notificacion-routes.js"
import configuracionRoutes from "./routes/configuracion-routes.js"
import uploadRoutes from "./routes/upload-routes.js"
import ubicacionRoutes from "./routes/ubicacion-routes.js"
import path from "path"
import { limiteGeneral } from "./utils/limitadores.js"

const app = express();

// Si el backend corre detrás de un proxy (Render, Railway, Nginx...), descomentar para que
// el rate limit use la IP real del cliente y no la del proxy:
// app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(cors())            // TODO producción: cors({ origin: [...dominios permitidos] }) — la app móvil no depende de CORS
app.use(express.json({ limit: '1mb' }));
app.use(limiteGeneral)

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
})

app.use('/solicitud', solicitudRouter)
app.use("/trabajador", trabajadorRoutes);
app.use("/cliente", clienteRoutes);
app.use("/usuario", usuarioRoutes);
app.use("/verificacion", verificacionRoutes)
app.use('/chat', chatRoutes)
app.use('/trabajo', trabajoRoutes)
app.use('/notificacion', notificacionRoutes)
app.use('/configuracion', configuracionRoutes)
app.use('/upload', uploadRoutes)
app.use('/', ubicacionRoutes)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { dotfiles: 'deny', index: false }))
export default app;