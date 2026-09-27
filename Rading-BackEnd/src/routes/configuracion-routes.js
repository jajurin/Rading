import { Router } from "express";
import { ConfiguracionServices } from "../services/configuracion-services.js";

const router = Router();
const svc = new ConfiguracionServices();

router.get("/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;
    if (!idUsuario) return res.status(400).json({ message: "idUsuario es requerido" });

    const config = await svc.obtenerConfiguracion(Number(idUsuario));
    res.status(200).json(config);
  } catch (error) {
    console.error("[configuracion] Error obteniendo:", error);
    res.status(500).json({ message: "Error al obtener configuración", error: error.message });
  }
});

router.put("/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;
    if (!idUsuario) return res.status(400).json({ message: "idUsuario es requerido" });

    const prefs = req.body;
    const actualizada = await svc.actualizarConfiguracion(Number(idUsuario), prefs);
    res.status(200).json({ message: "Configuración actualizada", configuracion: actualizada });
  } catch (error) {
    console.error("[configuracion] Error actualizando:", error);
    res.status(500).json({ message: "Error al actualizar configuración", error: error.message });
  }
});

export default router;