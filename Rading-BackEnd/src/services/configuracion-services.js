import { ConfiguracionRepository } from "../repositories/configuracion-repositories.js";

const DEFAULTS = {
  modoOscuro: false,
  notifOfertas: true,
  notifMensajes: true,
  notifResenas: true,
  notifSonido: true,
  notifVibracion: true,
  ubicacionHabilitada: true,
  datosUso: false,
};

export class ConfiguracionServices {
  constructor() {
    this.repo = new ConfiguracionRepository();
  }

  async obtenerConfiguracion(idUsuario) {
    let config = await this.repo.obtenerPorUsuario(idUsuario);
    if (!config) {
      config = await this.repo.crear(idUsuario);
    }
    return { ...DEFAULTS, ...config };
  }

  async actualizarConfiguracion(idUsuario, prefs) {
    // Asegura que la fila exista antes de actualizar (usuarios nuevos
    // que nunca pasaron por el GET, o que quedaron afuera del INSERT masivo).
    await this.obtenerConfiguracion(idUsuario);

    const actualizada = await this.repo.actualizar(idUsuario, prefs);
    if (!actualizada) {
      throw new Error("No se encontró la configuración del usuario");
    }
    return { ...DEFAULTS, ...actualizada };
  }
}