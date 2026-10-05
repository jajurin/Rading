import ubicacionRepository from "../repositories/ubicacion/ubicacion-repositories.js"   // 👈 con .js

const repo = new ubicacionRepository()

const esCoordValida = (lat, lng) =>
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180

export default class UbicacionServices {

    guardarUbicacionTrabajador = async (idTrabajo, idTrabajador, lat, lng) => {
        const la = Number(lat)
        const ln = Number(lng)
        if (!esCoordValida(la, ln)) throw new Error('Coordenadas inválidas')

        const guardado = await repo.guardarUbicacionTrabajador(idTrabajo, idTrabajador, la, ln)
        if (!guardado) {
            throw new Error('Este trabajo no te pertenece, no está en proceso o ya confirmaste la llegada')
        }
        return { ok: true }
    }

    obtenerUbicacionTrabajador = async (idTrabajo, idCliente) => {
        const u = await repo.obtenerUbicacionTrabajador(idTrabajo, idCliente)
        if (!u) return null
        return {
            lat: Number(u.lat),
            lng: Number(u.lng),
            actualizadoEn: u.actualizadoEn,
            vigente: !!u.vigente,
        }
    }
}