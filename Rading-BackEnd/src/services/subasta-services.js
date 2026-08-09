import trabajadorRepository from '../repositories/trabajador/trabajador-repositories.js'
import chatRepository from '../repositories/chat/chat-repositories.js'

export default class SubastaServices {
    #trabajadorRepo = new trabajadorRepository()
    #chatRepo = new chatRepository()

    cerrarSubastasVencidas = async () => {
        const cerradas = await this.#trabajadorRepo.cerrarSubastasVencidas()

        for (const c of cerradas) {
            try {
                const chatId = await this.#chatRepo.buscarOCrearChat(c.idCliente, c.idTrabajador)
                await this.#chatRepo.enviarMensaje({
                    chatId,
                    enviadorId: c.idUsuarioTrabajador,
                    contenido: `¡Ganaste la subasta! Ofertaste $${Number(c.precio).toLocaleString('es-AR')} y quedaste asignado a este trabajo.`,
                    tipo: 'TEXTO',
                })
            } catch (err) {
                console.error(`No se pudo notificar el cierre de subasta ${c.idTrabajo}:`, err)
            }
        }

        return cerradas
    }
}