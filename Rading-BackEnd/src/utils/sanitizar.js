const CAMPOS_PRIVADOS = ['contrasena', 'password']

/** Devuelve una copia del usuario sin campos sensibles. */
export const sinSecretos = (usuario) => {
    if (!usuario || typeof usuario !== 'object') return usuario
    const copia = { ...usuario }
    for (const campo of CAMPOS_PRIVADOS) delete copia[campo]
    return copia
}