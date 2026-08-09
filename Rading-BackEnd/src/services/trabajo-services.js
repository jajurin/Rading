import trabajoRepository from '../repositories/trabajo/trabajo-repositories.js'

import chatRepository from '../repositories/chat/chat-repositories.js'

const ROLES = ['CLIENTE', 'TRABAJADOR']

export default class TrabajoServices {
    #repo
    #chatRepo

    constructor() {
        this.#repo = new trabajoRepository()
        this.#chatRepo = new chatRepository()
    }

    obtenerEstado = async (idTrabajo) => {
        const estado = await this.#repo.obtenerEstado(idTrabajo)
        if (!estado) throw new Error('El trabajo no existe')
        return estado
    }

    confirmarLlegada = async (idTrabajo, rol) => {
        if (!idTrabajo || !ROLES.includes(rol)) {
            throw new Error('Faltan idTrabajo o rol (CLIENTE | TRABAJADOR)')
        }
        const resultado = await this.#repo.confirmarLlegada(idTrabajo, rol)

        // El aviso por chat es "best effort": si falla, no rompe la
        // confirmación en sí (misma filosofía que aceptarOferta).
        try {
            const estado = await this.#repo.obtenerEstado(idTrabajo)
            const chatId = await this.#chatRepo.buscarOCrearChat(estado.idCliente, estado.idTrabajador)
            const enviadorId = rol === 'CLIENTE' ? estado.idUsuarioCliente : estado.idUsuarioTrabajador
            const quien = rol === 'CLIENTE' ? 'El cliente' : 'El trabajador'

            await this.#chatRepo.enviarMensaje({
                chatId,
                enviadorId,
                contenido: `${quien} confirmó su llegada al domicilio.`,
                tipo: 'TEXTO',
            })

            if (resultado.trabajoIniciadoAhora) {
                await this.#chatRepo.enviarMensaje({
                    chatId,
                    enviadorId,
                    contenido: `¡Trabajo iniciado! Ambos confirmaron la llegada.`,
                    tipo: 'TEXTO',
                })
            }
        } catch (err) {
            console.error(`No se pudo notificar confirmarLlegada del trabajo ${idTrabajo}:`, err)
        }

        return resultado
    }

    confirmarFin = async (idTrabajo, rol) => {
        if (!idTrabajo || !ROLES.includes(rol)) {
            throw new Error('Faltan idTrabajo o rol (CLIENTE | TRABAJADOR)')
        }
        const resultado = await this.#repo.confirmarFin(idTrabajo, rol)

        try {
            const estado = await this.#repo.obtenerEstado(idTrabajo)
            const chatId = await this.#chatRepo.buscarOCrearChat(estado.idCliente, estado.idTrabajador)
            const enviadorId = rol === 'CLIENTE' ? estado.idUsuarioCliente : estado.idUsuarioTrabajador
            const quien = rol === 'CLIENTE' ? 'El cliente' : 'El trabajador'

            await this.#chatRepo.enviarMensaje({
                chatId,
                enviadorId,
                contenido: `${quien} confirmó que el trabajo finalizó.`,
                tipo: 'TEXTO',
            })

            if (resultado.trabajoTerminadoAhora) {
                await this.#chatRepo.enviarMensaje({
                    chatId,
                    enviadorId,
                    contenido: `¡Trabajo finalizado! Ambos confirmaron el cierre.`,
                    tipo: 'TEXTO',
                })
            }
        } catch (err) {
            console.error(`No se pudo notificar confirmarFin del trabajo ${idTrabajo}:`, err)
        }

        return resultado
    }
}