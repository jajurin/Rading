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

    obtenerChatsCliente = async (idCliente, idUsuario) => {
        return await this.#repo.obtenerChatsCliente(idCliente, idUsuario)
    }

    obtenerChatsTrabajador = async (idTrabajador, idUsuario) => {
        return await this.#repo.obtenerChatsTrabajador(idTrabajador, idUsuario)
    }

    obtenerMensajes = async (chatId) => {
        return await this.#repo.obtenerMensajes(chatId)
    }

    buscarChat = async (idCliente, idTrabajador) => {
        if (!idCliente || !idTrabajador) throw new Error('Faltan idCliente o idTrabajador')
        return await this.#repo.buscarChat(idCliente, idTrabajador)
    }

    enviarMensaje = async (body) => {
        const { chatId, idCliente, idTrabajador, enviadorId, contenido, tipo, servicioId, precio, precioOfertado, notaOferta } = body

        if (!enviadorId || !contenido) {
            throw new Error('Faltan enviadorId o contenido')
        }
        if (!chatId && (!idCliente || !idTrabajador)) {
            throw new Error('Falta chatId, o idCliente + idTrabajador para crear el chat')
        }
        if (tipo === 'PROPUESTA' && (!servicioId || precio == null)) {
            throw new Error('Faltan servicioId o precio para la propuesta')
        }
        if (tipo === 'OFERTA_TRABAJADOR' && precioOfertado == null) {
            throw new Error('Falta el precio ofertado')
        }

        return await this.#repo.enviarMensaje({
            chatId, idCliente, idTrabajador, enviadorId, contenido, tipo,
            servicioId, precio, precioOfertado, notaOferta,
        })
    }

    enviarMensajeArchivo = async ({ chatId, idCliente, idTrabajador, enviadorId, archivoUrl, archivoNombre, tipo, duracionAudio }) => {
        if (!enviadorId || !archivoUrl) {
            throw new Error('Faltan enviadorId o archivoUrl')
        }
        if (!chatId && (!idCliente || !idTrabajador)) {
            throw new Error('Falta chatId, o idCliente + idTrabajador para crear el chat')
        }
        return await this.#repo.enviarMensajeArchivo({
            chatId, idCliente, idTrabajador, enviadorId, archivoUrl, archivoNombre, tipo, duracionAudio,
        })
    }

    editarMensaje = async (mensajeId, contenido, userId) => {
        if (!mensajeId || !contenido || !userId) throw new Error('Faltan datos para editar el mensaje')
        return await this.#repo.editarMensaje(mensajeId, contenido, userId)
    }

    marcarComoLeidos = async (chatId, userId) => {
        if (!chatId || !userId) throw new Error('Faltan chatId o userId')
        return await this.#repo.marcarComoLeidos(chatId, userId)
    }
}