import rateLimit from 'express-rate-limit'

const base = { standardHeaders: true, legacyHeaders: false }

// Límite general para toda la API (por IP).
export const limiteGeneral = rateLimit({
    ...base,
    windowMs: 60 * 1000,
    limit: 300,
    message: { message: 'Demasiadas solicitudes, probá de nuevo en un momento' }
})

// Login: 8 intentos fallidos cada 15 min por IP + identificador. Los exitosos no cuentan.
export const limiteLogin = rateLimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 8,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${req.ip}|${String(req.body?.identificador ?? '').toLowerCase()}`,
    validate: { keyGeneratorIpFallback: false },
    message: { message: 'Demasiados intentos de inicio de sesión. Esperá 15 minutos.' }
})

// Registro, envío de códigos y consultas de existencia: poco frecuentes por IP.
export const limiteSensible = rateLimit({
    ...base,
    windowMs: 10 * 60 * 1000,
    limit: 20,
    message: { message: 'Demasiadas solicitudes. Probá más tarde.' }
})

// Envío de mails: evita usar el servidor como spammer.
export const limiteEnvioCodigo = rateLimit({
    ...base,
    windowMs: 60 * 60 * 1000,
    limit: 5,
    keyGenerator: (req) => `${req.ip}|${String(req.body?.email ?? '').toLowerCase()}`,
    validate: { keyGeneratorIpFallback: false },
    message: { message: 'Pediste demasiados códigos. Probá en una hora.' }
})

// Endpoints que cuestan plata (IA, uploads).
export const limiteCostoso = rateLimit({
    ...base,
    windowMs: 60 * 1000,
    limit: 10,
    message: { message: 'Demasiadas solicitudes a este servicio. Esperá un momento.' }
})