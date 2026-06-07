import trabajadorRepository from "../repositories/trabajador/trabajador-repositories.js";
import Trabajador from '../entities/trabajador.js'

export default class TrabajadorServices {
    #repo

    constructor() {
        this.#repo = new trabajadorRepository()
    }

    mostrarTodosLosTrabajadores = async () => {
        return await this.#repo.mostrarTodosLosTrabajadores()
    }

    registrarTrabajador = async (body) => {
    const trabajador = new Trabajador(
        body.nombre,
        body.apellido,
        body.email,
        body.direccion,
        body.contrasena,
        body.telefono,
        body.fechaNac,
        body.dni,
        body.IdCuentaBancaria ?? null,
        body.servicios,       // array de ids
        body.descripcion ?? '',
        body.zonaTrabajo ?? '',
        body.DispComienzo ?? null,
        body.DispFinal ?? null,
        body.foto ?? null
    )
    return await this.#repo.registrarTrabajador(trabajador)
}

    mostrarTrabajosRealizados = async (idTrabajador) => {
        return await this.#repo.mostrarTrabajosRealizados(idTrabajador)
    }

    buscarConFiltrosTr = async (texto, estrellas, categoria, distancia, horario, fijo) => {
        let ids = []
        const hayFiltros = estrellas || categoria || distancia || horario || fijo !== undefined
        if (hayFiltros) {
            const filtrados = await this.#repo.filtrarCl(estrellas, categoria, distancia, horario, fijo)
            ids = filtrados.map(r => r.id)
            if (ids.length === 0) return []
        }
        return await this.#repo.buscarCliente(texto ?? '', ids)
    }
}