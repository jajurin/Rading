import express from "express";
import cors from "cors";
import trabajadorRoutes from "./routes/trabajador-routes.js";
import clienteRoutes from "./routes/cliente-routes.js";
import usuarioRoutes from "./routes/usuario-routes.js";
import verificacionRoutes from "./routes/verificacion-routes.js"
const app = express();
app.use(cors());
app.use(express.json()); 

app.use("/trabajador", trabajadorRoutes);
app.use("/cliente", clienteRoutes);
app.use("/usuario", usuarioRoutes);
app.use("/verificacion", verificacionRoutes)


export default app;