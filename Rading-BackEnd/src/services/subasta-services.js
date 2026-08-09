import trabajadorRepository from '../repositories/trabajador/trabajador-repositories.js'
import chatRepository from '../repositories/chat/chat-repositories.js'

export default class SubastaServices {
    #trabajadorRepo = new trabajadorRepository()
    #chatRepo = new chatRepository()

    // Corre periódicamente (cron). NO asigna el trabajo automáticamente:
    // solo detecta subastas vencidas, identifica quién iba primero por
    // precio, y le avisa por chat. La asignación real la sigue haciendo
    // el cliente a mano, vía ClienteServices.aceptarOferta.
    avisarSubastasVencidas = async () => {
        const vencidas = await this.#trabajadorRepo.avisarSubastasVencidas()

        for (const v of vencidas) {
            try {
                const chatId = await this.#chatRepo.buscarOCrearChat(v.idCliente, v.idTrabajador)
                await this.#chatRepo.enviarMensaje({
                    chatId,
                    // 👇 el mensaje va dirigido AL trabajador, avisándole que
                    // quedó primero. Tiene que figurar como enviado por el
                    // cliente (que es quien decide, no el trabajador).
                    enviadorId: v.idUsuarioCliente,
                    contenido: `El plazo de la subasta terminó. Tu oferta de $${Number(v.precio).toLocaleString('es-AR')} quedó primera. El cliente todavía tiene que confirmarte para que el trabajo sea tuyo.`,
                    tipo: 'TEXTO',
                })
            } catch (err) {
                console.error(`No se pudo avisar el cierre de subasta ${v.idTrabajo}:`, err)
            }
        }

        return vencidas
    }
}