import chatRepository from '../repositories/chat/chat-repositories.js'

export default class ChatServices {
    #repo

    constructor() {
        this.#repo = new chatRepository()
    }

    obtenerOCrearChat = async (idCliente, idTrabajador) => {
        if (!idCliente || !idTrabajador) throw new Error('Faltan idCliente o idTrabajador')
        return await this.#repo.buscarOCrearChat(idCliente, idTrabajador)
    }

    obtenerChatsCliente = async (idCliente) => {
        return await this.#repo.obtenerChatsCliente(idCliente)
    }

    obtenerChatsTrabajador = async (idTrabajador) => {
        return await this.#repo.obtenerChatsTrabajador(idTrabajador)
    }

    obtenerMensajes = async (chatId) => {
        return await this.#repo.obtenerMensajes(chatId)
    }

    enviarMensaje = async (body) => {
    const { chatId, idCliente, idTrabajador, enviadorId, contenido, tipo } = body

    if (!enviadorId || !contenido) {
        throw new Error('Faltan enviadorId o contenido')
    }
    if (!chatId && (!idCliente || !idTrabajador)) {
        throw new Error('Falta chatId, o idCliente + idTrabajador para crear el chat')
    }

    return await this.#repo.enviarMensaje({ chatId, idCliente, idTrabajador, enviadorId, contenido, tipo })
}
enviarMensajeArchivo = async ({ chatId, idCliente, idTrabajador, enviadorId, archivoUrl, archivoNombre, tipo }) => {
    if (!enviadorId || !archivoUrl) {
        throw new Error('Faltan enviadorId o archivoUrl')
    }
    if (!chatId && (!idCliente || !idTrabajador)) {
        throw new Error('Falta chatId, o idCliente + idTrabajador para crear el chat')
    }
    return await this.#repo.enviarMensajeArchivo({ chatId, idCliente, idTrabajador, enviadorId, archivoUrl, archivoNombre, tipo })
}
    marcarComoLeidos = async (chatId, userId) => {
        if (!chatId || !userId) throw new Error('Faltan chatId o userId')
        return await this.#repo.marcarComoLeidos(chatId, userId)
    }
}