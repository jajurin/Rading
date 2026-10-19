import usuarioRepository from "../repositories/general/usuario-repositories.js";
import { ConfiguracionRepository } from "../repositories/configuracion-repositories.js";
import Usuario from "../entities/usuario.js"
import { verificar, hashear } from "../utils/password.js"
import { sinSecretos } from "../utils/sanitizar.js"

export const MSG_CREDENCIALES = "Usuario o contraseña incorrectos"

export default class UsuarioServices {
    #repo
    #configRepo

    constructor() {
        this.#repo = new usuarioRepository()
        this.#configRepo = new ConfiguracionRepository()
    }

    login = async ({ identificador, contrasena }) => {
        let usuario = await this.#repo.buscarPorEmail(identificador)
        if (!usuario) usuario = await this.#repo.buscarPorDni(identificador)

        // Mismo mensaje para "no existe" y "contraseña mala": evita enumerar usuarios.
        if (!usuario) throw new Error(MSG_CREDENCIALES)

        const { ok, necesitaRehash } = await verificar(contrasena, usuario.contrasena)
        if (!ok) throw new Error(MSG_CREDENCIALES)

        // Migración transparente: si seguía en texto plano, se guarda hasheada.
        if (necesitaRehash) {
            try {
                await this.#repo.actualizarContrasena(usuario.id, await hashear(contrasena))
            } catch (e) {
                console.error('No se pudo rehashear la contraseña del usuario', usuario.id, e.message)
            }
        }

        const esTrabajador = await this.#repo.esTrabajador(usuario.id)
        let idCliente = null
        let idTrabajador = null

        if (!esTrabajador) idCliente = await this.#repo.buscarIdCliente(usuario.id)
        else idTrabajador = await this.#repo.buscarIdTrabajador(usuario.id)

        return { ...sinSecretos(usuario), tipo: esTrabajador ? 'trabajador' : 'cliente', idCliente, idTrabajador }
    }

    registrarUsuario = async (body) => {
        const { nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria, lat, lng } = body

        const emailExiste = await this.#repo.buscarPorEmail(email)
        if (emailExiste) throw new Error(`El email ${email} ya está registrado`)

        const dniExiste = await this.#repo.buscarPorDni(dni)
        if (dniExiste) throw new Error(`El DNI ${dni} ya está registrado`)

        // El hash se aplica dentro del repositorio.
        const usuario = new Usuario(nombre, apellido, email, direccion, contrasena, telefono, fechaNac, dni, IdCuentaBancaria ?? null, lat ?? null, lng ?? null)
        const idUsuario = await this.#repo.registrarUsuario(usuario)

        try {
            await this.#configRepo.crear(idUsuario)
        } catch (e) {
            console.error('Error creando preferencias por defecto:', e.message)
        }
        return idUsuario
    }

    /** Siempre sin contraseña. Uso interno que necesite el hash debe ir directo al repositorio. */
    buscarPorEmail = async (email) => sinSecretos(await this.#repo.buscarPorEmail(email))

    existeEmail = async (email) => {
        const usuario = await this.#repo.buscarPorEmail(email)
        return usuario !== null
    }
}