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

    generarCodigoLlegada = async (idTrabajo) => {
        if (!idTrabajo) throw new Error('Falta idTrabajo')
        return await this.#repo.generarCodigoLlegada(idTrabajo)
    }

    confirmarLlegadaConCodigo = async (idTrabajo, codigo) => {
        if (!idTrabajo || !codigo) throw new Error('Faltan idTrabajo o codigo')
        const resultado = await this.#repo.confirmarLlegadaConCodigo(idTrabajo, codigo)

        try {
            const estado = await this.#repo.obtenerEstado(idTrabajo)
            const chatId = await this.#chatRepo.buscarOCrearChat(estado.idCliente, estado.idTrabajador)
            await this.#chatRepo.enviarMensaje({
                chatId,
                enviadorId: estado.idUsuarioTrabajador,
                contenido: `El trabajador ingresó el código correctamente. ¡Trabajo iniciado!`,
                tipo: 'TEXTO',
            })
        } catch (err) {
            console.error(`No se pudo notificar confirmarLlegadaConCodigo del trabajo ${idTrabajo}:`, err)
        }

        return resultado
    }

    // NUEVO: análogo a confirmarLlegadaConCodigo, para el cierre del trabajo.
    confirmarFinConCodigo = async (idTrabajo, codigo) => {
        if (!idTrabajo || !codigo) throw new Error('Faltan idTrabajo o codigo')
        const resultado = await this.#repo.confirmarFinConCodigo(idTrabajo, codigo)

        try {
            const estado = await this.#repo.obtenerEstado(idTrabajo)
            const chatId = await this.#chatRepo.buscarOCrearChat(estado.idCliente, estado.idTrabajador)
            await this.#chatRepo.enviarMensaje({
                chatId,
                enviadorId: estado.idUsuarioTrabajador,
                contenido: `El trabajador ingresó el código correctamente. ¡Trabajo finalizado!`,
                tipo: 'TEXTO',
            })
        } catch (err) {
            console.error(`No se pudo notificar confirmarFinConCodigo del trabajo ${idTrabajo}:`, err)
        }

        return resultado
    }

    obtenerEstado = async (idTrabajo) => {
        const estado = await this.#repo.obtenerEstado(idTrabajo)
        if (!estado) throw new Error('El trabajo no existe')
        return estado
    }

    // Flujo alternativo por botón (rol CLIENTE | TRABAJADOR), sin código.
    confirmarLlegada = async (idTrabajo, rol) => {
        if (!idTrabajo || !ROLES.includes(rol)) {
            throw new Error('Faltan idTrabajo o rol (CLIENTE | TRABAJADOR)')
        }
        const resultado = await this.#repo.confirmarLlegada(idTrabajo, rol)

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
generarCodigoFin = async (idTrabajo) => {
    if (!idTrabajo) throw new Error('Falta idTrabajo')
    return await this.#repo.generarCodigoFin(idTrabajo)
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