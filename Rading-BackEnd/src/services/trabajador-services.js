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
            body.nombre, body.apellido, body.email, body.direccion,
            body.contrasena, body.telefono, body.fechaNac, body.dni,
            body.IdCuentaBancaria ?? null, body.servicios,
            body.descripcion ?? '', body.zonaTrabajo ?? '',
            body.DispComienzo ?? null, body.DispFinal ?? null,
            body.foto ?? null
        )
        return await this.#repo.registrarTrabajador(trabajador)
    }

    buscarConFiltrosTr = async (texto, estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta, precioMin, precioMax) => {
    const hayTexto   = texto && texto.trim()
    const hayFiltros = estrellas || servicio_id || (fijo !== undefined && fijo !== '')
                    || emergencia || distanciaMax || horarioDesde || horarioHasta
                    || precioMin || precioMax   // ← nuevo

    if (!hayTexto && !hayFiltros) return []

    let ids = null

    if (hayFiltros) {
        const filtrados = await this.#repo.filtrarSolicitudes(
            estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta,
            precioMin, precioMax   // ← nuevo
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
