import config from '../../configs/dbconfig.js'
import usuarioRepository from '../general/usuario-repositories.js'
import pkg from 'pg'
const { Client } = pkg
 
export default class trabajadorRepository {
 #usuarioRepo = new usuarioRepository()
    /**
     * Busca clientes por nombre/apellido (texto libre).
     * Si se pasan ids, filtra solo entre esos ids (usado tras aplicar filtros).
     */
    buscarCliente = async (texto, ids = []) => {
    const client = new Client(config)
    let result

    try {
        await client.connect()

        let sql = `
            SELECT
                c.id,
                u.nombre,
                u.apellido,
                u.email,
                u.direccion,
                u.telefono,
                c.categoria_id,
                c.estrellas
            FROM "Cliente" c
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            WHERE (
                u.nombre ILIKE $1
                OR u.apellido ILIKE $1
            )
        `

        const values = [`%${texto}%`]

        if (ids.length > 0) {
            sql += ` AND c.id = ANY($2)`
            values.push(ids)
        }

        result = await client.query(sql, values)

    } catch (err) {
        console.error('Error en buscarCliente:', err)
        throw err
    } finally {
        await client.end()
    }

    return result?.rows ?? []
}
 
    /**
     * Muestra los trabajos realizados (TERMINADO o CANCELADO) de un trabajador.
     */
    mostrarTrabajosRealizados = async (idTrabajador) => {
        const client = new Client(config)
        let result
 
        try {
            await client.connect()
 
            const sql = `
                SELECT
                    u.nombre,
                    u.apellido,
                    ct.distancia,
                    ct.horario,
                    ct.categoria,
                    ct.fijo,
                    ct.estado,
                    ct."fecha_iniciado",
                    ct."fecha_acabado"
                FROM "Cliente-Trabajador" ct
                INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
                INNER JOIN "Usuario" u ON c."IdPersona" = u.id
                WHERE ct."IdTrabajador" = $1
                AND ct.estado IN ('TERMINADO', 'CANCELADO')
            `
 
            result = await client.query(sql, [idTrabajador])
 
        } catch (err) {
            console.error('Error en mostrarTrabajosRealizados:', err)
            throw err
        } finally {
            await client.end()
        }
 
        return result?.rows ?? []
    }
 
    /**
     * Registra un trabajador: inserta en Usuario y luego en Trabajador.
     * Recibe un objeto con todos los campos del modelo.
     */
 registrarTrabajador = async (trabajador) => {
    const client = new Client(config)

    try {
        const usuario = await this.#usuarioRepo.buscarPorEmail(trabajador.email)
        if (!usuario) throw new Error(`No existe un usuario con el email ${trabajador.email}`)

        await client.connect()

        const existeTrabajador = await client.query(
            `SELECT id FROM "Trabajador" WHERE "IdPersona" = $1`,
            [usuario.id]
        )
        if (existeTrabajador.rows.length > 0) throw new Error(`El usuario ${trabajador.email} ya es trabajador`)

        // Insertar en Trabajador SIN servicio_id
        const sqlTrabajador = `
            INSERT INTO "Trabajador"
            ("IdPersona", descripcion, "zonaTrabajo", "DispComienzo", "DispFinal", foto, estrellas)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING id
        `
        const resultTrabajador = await client.query(sqlTrabajador, [
            usuario.id,
            trabajador.descripcion,
            trabajador.zonaTrabajo,
            trabajador.DispComienzo,
            trabajador.DispFinal,
            trabajador.foto,
            trabajador.estrellas
        ])

        const idTrabajador = resultTrabajador.rows[0].id

        // Insertar cada servicio en Trabajador_Servicio
        for (const servicioId of trabajador.servicios) {
            await client.query(
                `INSERT INTO "Trabajador_Servicio" (trabajadores_id, servicios_id) VALUES ($1, $2)`,
                [idTrabajador, servicioId]
            )
        }

        return { success: true, idUsuario: usuario.id, idTrabajador }

    } catch (err) {
        console.error('Error en registrarTrabajador:', err)
        throw err
    } finally {
        await client.end()
    }
}

    mostrarTodosLosTrabajadores = async () => {
        const client = new Client(config)
        let result

        try {
            await client.connect()

            const sql = `
                SELECT
                    t.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.direccion,
                    u.telefono
                FROM "Trabajador" t
                INNER JOIN "Usuario" u ON t."IdPersona" = u.id
            `

            result = await client.query(sql)

        } catch (err) {
            console.error('Error en mostrarTodosLosClientes:', err)
            throw err
        } finally {
            await client.end()
        }

        return result?.rows ?? []
    }
   buscarSolicitudes = async (texto, ids = []) => {
    const client = new Client(config)
    try {
        await client.connect()

        let sql = `
            SELECT
                ct.id,
                ct.servicio_id,
                ct.horario_requerido,
                ct.distancia,
                ct.fijo,
                ct.emergencia,
                ct.estado,
                ct.fecha_iniciado,
                u.nombre,
                u.apellido,
                u.email,
                u.telefono,
                c.estrellas
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            INNER JOIN "Usuario" u ON c."IdPersona" = u.id
            WHERE ct.estado = 'PENDIENTE'
            AND ct."IdTrabajador" IS NULL
        `

        const values = []

        if (texto && texto.trim()) {
            sql += ` AND (u.nombre ILIKE $1 OR u.apellido ILIKE $1)`
            values.push(`%${texto.trim()}%`)
        }

        if (ids.length > 0) {
            sql += ` AND ct.id = ANY($${values.length + 1})`
            values.push(ids)
        }

        const result = await client.query(sql, values)
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en buscarSolicitudes:', err)
        throw err
    } finally {
        await client.end()
    }
}

filtrarSolicitudes = async (estrellas, servicio_id, fijo, emergencia, distanciaMax, horarioDesde, horarioHasta) => {
    const client = new Client(config)
    try {
        await client.connect()

        let sql = `
            SELECT DISTINCT ct.id
            FROM "Cliente-Trabajador" ct
            INNER JOIN "Cliente" c ON ct."IdCliente" = c.id
            WHERE ct.estado = 'PENDIENTE'
            AND ct."IdTrabajador" IS NULL
        `

        const values = []
        let i = 1

        if (estrellas) {
            sql += ` AND c.estrellas >= $${i++}`
            values.push(Number(estrellas))
        }

      if (servicio_id) {
    sql += ` AND ct.servicio_id = $${i++}`
    values.push(Number(servicio_id))
}

        // fijo: 'true' = fijo, 'false' = subasta
        if (fijo !== undefined && fijo !== null && fijo !== '') {
            sql += ` AND ct.fijo = $${i++}`
            values.push(fijo === 'true')
        }

        if (emergencia !== undefined && emergencia !== null && emergencia !== '') {
            sql += ` AND ct.emergencia = $${i++}`
            values.push(emergencia === 'true')
        }

        if (distanciaMax) {
            sql += ` AND ct.distancia <= $${i++}`
            values.push(Number(distanciaMax))
        }

        // horario_requerido: filtrar por rango
      if (horarioDesde) {
    sql += ` AND ct.horario_requerido <= $${i++}`
    values.push(horarioDesde)
}
if (horarioHasta) {
    sql += ` AND ct.horario_finalizado <= $${i++}`
    values.push(horarioHasta)
}

        const result = await client.query(sql, values)
        return result?.rows ?? []
    } catch (err) {
        console.error('Error en filtrarSolicitudes:', err)
        throw err
    } finally {
        await client.end()
    }
}
}