
import trabajadorRepository from "../repositories/trabajador/trabajador-repositories.js";
import Trabajador from '../entities/trabajador.js'
 
export default class TrabajadorServices {
    #repo
    
    mostrarTodosLosTrabajadores = async () => {
        return await this.#repo.mostrarTodosLosTrabajadores()
    }

    constructor() {
        this.#repo = new trabajadorRepository()
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
            body.IdCuentaBancaria,
            body.categoria,
            body.descripcion,
            body.zonaTrabajo,
            body.DispComienzo,
            body.DispFinal,
            body.foto
        )
        return await this.#repo.registrarTrabajador(trabajador)
    }
 
    mostrarTrabajosRealizados = async (idTrabajador) => {
        return await this.#repo.mostrarTrabajosRealizados(idTrabajador)
    }
 
    /**
     * Busca clientes combinando texto libre + filtros opcionales.
     * Si se pasan filtros, primero obtiene los ids que los cumplen
     * y luego busca por texto entre esos ids.
     */
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