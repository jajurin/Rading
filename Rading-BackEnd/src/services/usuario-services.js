import usuarioRepository from "../repositories/general/usuario-repositories.js";
import Usuario from "../entities/usuario.js"
export default class UsuarioServices {
    #repo

    constructor() {
        this.#repo = new usuarioRepository()
    }
login = async ({ identificador, contrasena }) => {
    let usuario = await this.#repo.buscarPorEmail(identificador)
    if (!usuario) {
        usuario = await this.#repo.buscarPorDni(identificador)
    }
    if (!usuario) throw new Error("Usuario no encontrado")
    if (usuario.contrasena !== contrasena) throw new Error("Contraseña incorrecta")

    const esTrabajador = await this.#repo.esTrabajador(usuario.id)

let idCliente = null
let idTrabajador = null

if (!esTrabajador) {
    idCliente = await this.#repo.buscarIdCliente(usuario.id)
} else {
    idTrabajador = await this.#repo.buscarIdTrabajador(usuario.id)
}

return { ...usuario, tipo: esTrabajador ? 'trabajador' : 'cliente', idCliente, idTrabajador }
}
    registrarUsuario = async (body) => {
    const { nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria, lat, lng } = body

    const emailExiste = await this.#repo.buscarPorEmail(email)
    if (emailExiste) throw new Error(`El email ${email} ya está registrado`)

    const dniExiste = await this.#repo.buscarPorDni(dni)
    if (dniExiste) throw new Error(`El DNI ${dni} ya está registrado`)

    const usuario = new Usuario(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria ?? null, lat ?? null, lng ?? null)

    return await this.#repo.registrarUsuario(usuario)
}

    buscarPorEmail = async (email) => {
        return await this.#repo.buscarPorEmail(email)
    }

    existeEmail = async (email) => {
        const usuario = await this.#repo.buscarPorEmail(email)
        return usuario !== null
    }
}