import trabajadorRepository from "../repositories/trabajador/trabajador-repositories.js";
import Trabajador from '../entities/trabajador.js'
import chatRepository from "../repositories/chat/chat-repositories.js";

const ROLES = ['CLIENTE', 'TRABAJADOR']
export default class TrabajadorServices {
    #repo
      #chatRepo
    constructor() {
        this.#repo = new trabajadorRepository()
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
    editarOferta = async (idOferta, idTrabajador, datos) => {
    if (!idOferta || !idTrabajador || datos?.precio == null) {
        throw new Error('Faltan idOferta, idTrabajador o precio')
    }
    return await this.#repo.editarOferta(idOferta, idTrabajador, datos)
}
mostrarMisOfertas = async (idTrabajador) => {
    return await this.#repo.mostrarMisOfertas(idTrabajador)
}
    mostrarTodosLosTrabajadores = async () => {
        return await this.#repo.mostrarTodosLosTrabajadores()
    }
obtenerDetalleOferta = async (idTrabajo, idTrabajador) => {
    return await this.#repo.obtenerDetalleOferta(idTrabajo, idTrabajador ?? null)
}
enviarOferta = async (idTrabajo, idTrabajador, datos) => {
    if (!idTrabajo || !idTrabajador || datos?.precio == null) {
        throw new Error('Faltan idTrabajo, idTrabajador o precio')
    }
    return await this.#repo.enviarOferta(idTrabajo, idTrabajador, datos)
}

cerrarSubastasVencidas = async () => {
    return await this.#repo.cerrarSubastasVencidas()
}
    registrarTrabajador = async (body) => {
        const trabajador = new Trabajador(
            body.nombre, body.apellido, body.email, body.direccion,
            body.contrasena, body.telefono, body.fechaNac, body.dni,
            body.IdCuentaBancaria ?? null, body.servicios,
            body.descripcion ?? '', body.zonaTrabajo ?? '',
            body.DispComienzo ?? null, body.DispFinal ?? null,
            body.foto ?? null
        )
        return await this.#repo.registrarTrabajador(trabajador)
    }

    buscarConFiltrosTr = async (texto, estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta, precioMin, precioMax, idTrabajador) => {
    const hayTexto   = texto && texto.trim()
    const hayFiltros = estrellas || servicio_id || (fijo !== undefined && fijo !== '')
                    || emergencia || distanciaMax || horarioDesde || horarioHasta
                    || precioMin || precioMax

    if (!hayTexto && !hayFiltros) return []

    let ids = null

    if (hayFiltros) {
        // idTrabajador es necesario para poder calcular la distancia real
        // (haversine) desde su ubicación cuando se filtra por distanciaMax.
        const filtrados = await this.#repo.filtrarSolicitudes(
            idTrabajador ?? null, estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta,
            precioMin, precioMax
        )
        ids = filtrados.map(r => r.id)
        if (ids.length === 0) return []
    }

    return await this.#repo.buscarSolicitudes(texto ?? '', ids ?? [])
}

    mostrarTrabajosRealizados = async (idTrabajador) => {
        return await this.#repo.mostrarTrabajosRealizados(idTrabajador)
    }
    mostrarTrabajosActivos = async (idTrabajador) => {
    return await this.#repo.mostrarTrabajosActivos(idTrabajador)
}
buscarOfertasCercanas = async (idTrabajador, radioKm) => {
    return await this.#repo.buscarOfertasCercanas(idTrabajador, radioKm ?? 5)
}

    obtenerResumenDiario = async (idTrabajador) => {
        return await this.#repo.obtenerResumenDiario(idTrabajador)
    }
}