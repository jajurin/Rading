import clienteRepository from "../repositories/cliente/cliente-repositories.js";
import Cliente from '../entities/cliente.js'

export default class ClienteServices {
    #repo

    constructor() {
        this.#repo = new clienteRepository()
    }
mostrarCategorias = async () => {
    return await this.#repo.mostrarCategorias()
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
mostrarRecientes = async (idCliente) => {
    return await this.#repo.mostrarRecientes(idCliente)
}
crearReseñaCliente = async (body) => {
    if (!body.idTrabajador || !body.idCliente || !body.idTrabajo) {
        throw new Error('Faltan idTrabajador, idCliente o idTrabajo')
    }
    if (!body.estrellas || !body.razon) {
        throw new Error('Faltan estrellas o razon')
    }
    return await this.#repo.crearReseñaCliente(body)
}
buscarOfertasPorTrabajo = async (idTrabajo) => {
    return await this.#repo.buscarOfertasPorTrabajo(idTrabajo)
}

aceptarOferta = async (idOferta) => {
    return await this.#repo.aceptarOferta(idOferta)
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

    return await this.#repo.buscarTrabajador({
        texto,
        estrellas,
        especialidad,
        horarioDesde,
        horarioHasta,
        lat,
        lng,
        radioKm,
    })
}
}