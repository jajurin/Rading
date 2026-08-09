import express from "express";
import cors from "cors";
import trabajadorRoutes from "./routes/trabajador-routes.js";
import clienteRoutes from "./routes/cliente-routes.js";
import usuarioRoutes from "./routes/usuario-routes.js";
import verificacionRoutes from "./routes/verificacion-routes.js"
import solicitudRouter from "./routes/solicitud-routes.js"
import chatRoutes from './routes/chat-routes.js'
import trabajoRoutes from './routes/trabajo-routes.js'
import path from "path"

const app = express();
app.use(cors());
app.use(express.json()); 
app.use('/solicitud', solicitudRouter)
app.use("/trabajador", trabajadorRoutes);
app.use("/cliente", clienteRoutes);
app.use("/usuario", usuarioRoutes);
app.use("/verificacion", verificacionRoutes)
app.use('/chat', chatRoutes)
app.use('/trabajo', trabajoRoutes)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
export default app;