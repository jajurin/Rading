

import clienteRepository from "../repositories/cliente/cliente-repositories.js";
import Cliente from '../entities/cliente.js'

export default class ClienteServices {
    #repo

    constructor() {
        this.#repo = new clienteRepository()
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

    /**
     * Busca trabajadores combinando texto libre + filtros opcionales.
     * Si se pasan filtros, primero obtiene los ids que los cumplen
     * y luego busca por texto entre esos ids.
     */
  buscarConFiltrosCl = async (texto, estrellas, categoria, distancia, horario) => {
    // Si no hay texto ni filtros, no busca nada
    if (!texto || !texto.trim()) return []

    let ids = []
    const hayFiltros = estrellas || categoria || distancia || horario
    if (hayFiltros) {
        const filtrados = await this.#repo.filtrarTr(estrellas, categoria, distancia, horario)
        ids = filtrados.map(r => r.id)
        if (ids.length === 0) return []
    }

    return await this.#repo.buscarTrabajador(texto.trim(), ids)
}
}