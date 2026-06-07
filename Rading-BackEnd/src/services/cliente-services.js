

import clienteRepository from "../repositories/cliente/cliente-repositories.js";
import Cliente from '../entities/cliente.js'

export default class ClienteServices {
    #repo

    constructor() {
        this.#repo = new clienteRepository()
    }

    registrarCliente = async (body) => {
        const cliente = new Cliente(
            body.nombre,
            body.apellido,
            body.email,
            body.direccion,
            body.contrasena,
            body.telefono,
            body.fechaNac,
            body.dni,
            body.IdCuentaBancaria,
            body.preferencias
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
        let ids = []

        // Solo filtra si al menos uno de los parámetros de filtro fue enviado
        const hayFiltros = estrellas || categoria || distancia || horario
        if (hayFiltros) {
            const filtrados = await this.#repo.filtrarTr(estrellas, categoria, distancia, horario)
            ids = filtrados.map(r => r.id)
            // Si los filtros no dieron resultados, devolver vacío directamente
            if (ids.length === 0) return []
        }

        return await this.#repo.buscarTrabajador(texto ?? '', ids)
    }
}