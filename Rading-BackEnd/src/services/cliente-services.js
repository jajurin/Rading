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

    buscarConFiltrosCl = async (texto, estrellas, especialidad, horarioDesde, horarioHasta) => {
        const hayTexto   = texto && texto.trim();
        const hayFiltros = estrellas || especialidad || horarioDesde || horarioHasta;

        if (!hayTexto && !hayFiltros) return [];

        let ids = null;

        if (hayFiltros) {
            const filtrados = await this.#repo.filtrarTr(estrellas, especialidad, horarioDesde, horarioHasta);
            ids = filtrados.map(r => r.id);
            if (ids.length === 0) return [];
        }

        if (!hayTexto && ids !== null) {
            return await this.#repo.buscarTrabajadorPorIds(ids);
        }

        return await this.#repo.buscarTrabajador(texto.trim(), ids ?? []);
    }
}