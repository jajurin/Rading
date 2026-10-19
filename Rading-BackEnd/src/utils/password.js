import bcrypt from 'bcryptjs'

const ROUNDS = 12
const RE_HASH = /^\$2[aby]\$\d{2}\$.{53}$/

export const esHash = (valor) => typeof valor === 'string' && RE_HASH.test(valor)

export const hashear = (plano) => bcrypt.hash(String(plano), ROUNDS)

/**
 * Verifica una contraseña contra lo guardado en la base.
 * Soporta filas legacy (texto plano) para no dejar afuera a nadie antes de correr
 * el script de migración. Devuelve { ok, necesitaRehash }.
 */
export const verificar = async (plano, guardado) => {
    if (typeof plano !== 'string' || !guardado) return { ok: false, necesitaRehash: false }
    if (esHash(guardado)) {
        return { ok: await bcrypt.compare(plano, guardado), necesitaRehash: false }
    }
    // Legacy: texto plano. Comparación en tiempo constante.
    const a = Buffer.from(plano)
    const b = Buffer.from(guardado)
    const ok = a.length === b.length && (await import('crypto')).timingSafeEqual(a, b)
    return { ok, necesitaRehash: ok }
}