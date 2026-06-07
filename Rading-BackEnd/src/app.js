import express from "express";
import cors from "cors";
import trabajadorRoutes from "./routes/trabajador-routes.js";
import clienteRoutes from "./routes/cliente-routes.js";
import usuarioRoutes from "./routes/usuario-routes.js";

const app = express();
app.use(cors());
app.use(express.json()); 

app.use("/trabajador", trabajadorRoutes);
app.use("/cliente", clienteRoutes);
app.use("/usuario", usuarioRoutes);


export default app;