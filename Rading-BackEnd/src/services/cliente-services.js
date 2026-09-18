import clienteRepository from "../repositories/cliente/cliente-repositories.js";
import chatRepository from '../repositories/chat/chat-repositories.js'
import NotificacionServices from './notificacion-services.js'
import Cliente from '../entities/cliente.js'

export default class ClienteServices {
    #repo
    #chatRepo
    #notifSvc

    constructor() {
        this.#repo = new clienteRepository()
        this.#chatRepo = new chatRepository()
        this.#notifSvc = new NotificacionServices()
    }

    mostrarCategorias = async () => {
        return await this.#repo.mostrarCategorias()
    }

    mostrarServiciosPorCategoria = async (categoriaId) => {
        return await this.#repo.mostrarServiciosPorCategoria(categoriaId)
    }

    mostrarServiciosPreferidos = async (idCliente) => {
        const categoriaId = await this.#repo.obtenerCategoriaCliente(idCliente)
        if (!categoriaId) return []
        return await this.#repo.mostrarServiciosPorCategoria(categoriaId)
    }

    crearReseñaCliente = async (body) => {
        if (!body.idTrabajador || !body.idCliente || !body.idTrabajo) {
            throw new Error('Faltan idTrabajador, idCliente o idTrabajo')
        }
        if (!body.estrellas || !body.razon) {
            throw new Error('Faltan estrellas o razon')
        }
        const resultado = await this.#repo.crearReseñaCliente(body)

        try {
            await this.#notifSvc.notificarReseña({
                idTrabajo: body.idTrabajo,
                idTrabajador: body.idTrabajador,
                idCliente: body.idCliente,
                estrellas: body.estrellas,
            })
        } catch (err) {
            console.error('No se pudo notificar la reseña nueva:', err)
        }

        return resultado
    }

    buscarOfertasPorTrabajo = async (idTrabajo) => {
        return await this.#repo.buscarOfertasPorTrabajo(idTrabajo)
    }

    // 👇 ahora, además de aceptar, avisa por chat al trabajador ganador
    // (antes solo pasaba esto en el cierre automático de SubastaServices).
    // Si el repo tira error porque perdió la carrera contra el cierre
    // automático, ese error se propaga tal cual para que el router lo
    // traduzca a un 409.
    aceptarOferta = async (idOferta) => {
    const resultado = await this.#repo.aceptarOferta(idOferta)

    try {
        const chatId = await this.#chatRepo.buscarOCrearChat(resultado.idCliente, resultado.idTrabajador)
        await this.#chatRepo.enviarMensaje({
            chatId,
            enviadorId: resultado.idUsuarioCliente, // ✅ el cliente es quien "manda" el aviso
            contenido: `¡Tu oferta fue aceptada! Quedaste asignado a este trabajo por $${Number(resultado.precioFinal).toLocaleString('es-AR')}.`,
            tipo: 'TEXTO',
        })
    } catch (err) {
        console.error(`No se pudo notificar la aceptación de oferta ${idOferta}:`, err)
    }

    try {
        await this.#notifSvc.notificarOfertaAceptada({
            idTrabajo: resultado.idTrabajo,
            idTrabajador: resultado.idTrabajador,
            precioFinal: resultado.precioFinal,
        })
        for (const r of resultado.ofertasRechazadas ?? []) {
            await this.#notifSvc.notificarOfertaRechazada({
                idTrabajo: resultado.idTrabajo,
                idTrabajador: r.idTrabajador,
            })
        }
    } catch (err) {
        console.error(`No se pudieron crear notificaciones de la oferta ${idOferta}:`, err)
    }

    return resultado
}
mostrarMisSolicitudes = async (idCliente) => {
    return await this.#repo.mostrarMisSolicitudes(idCliente)
}
    contarOfertasPendientes = async (idCliente) => {
        return await this.#repo.contarOfertasPendientes(idCliente)
    }

    mostrarRecientes = async (idCliente) => {
        return await this.#repo.mostrarRecientes(idCliente)
    }

    registrarCliente = async (body) => {
        const cliente = new Cliente(
            body.nombre, body.apellido, body.email, body.direccion,
            body.contrasena, body.telefono, body.fechaNac, body.dni,
            body.IdCuentaBancaria,
            body.categoriaId ?? null
        )
        return await this.#repo.registrarCliente(cliente)
    }

    mostrarTodosLosClientes = async () => {
        return await this.#repo.mostrarTodosLosClientes()
    }

    mostrarTrabajosActivos = async (idCliente) => {
        return await this.#repo.mostrarTrabajosActivos(idCliente)
    }

    buscarConFiltrosCl = async (filtros) => {
        const { texto, estrellas, especialidad, horarioDesde, horarioHasta, lat, lng, radioKm } = filtros
        const hayTexto   = texto && texto.trim()
        const hayFiltros = estrellas || especialidad || horarioDesde || horarioHasta || radioKm
        if (!hayTexto && !hayFiltros) return []
        return await this.#repo.buscarTrabajador({ texto, estrellas, especialidad, horarioDesde, horarioHasta, lat, lng, radioKm })
    }

    obtenerPerfil = async (idCliente) => {
        return await this.#repo.obtenerPerfil(idCliente)
    }

    actualizarPerfil = async (idCliente, body) => {
        return await this.#repo.actualizarPerfil(idCliente, body)
    }
}