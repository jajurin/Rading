import notificacionRepository from '../repositories/notificacion/notificacion-repositories.js'

const formatoPrecio = (precio) =>
    Number(precio ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export default class NotificacionServices {
    #repo = new notificacionRepository()

    // ── Oferta nueva → le avisa al cliente ──────────────────────────────────
    notificarOfertaNueva = async ({ idTrabajo, idTrabajador, precio }) => {
        const ctx = await this.#repo.obtenerContextoOferta(idTrabajo, idTrabajador)
        if (!ctx?.idUsuarioCliente) return null

        const nombre = `${ctx.trabajadorNombre ?? ''} ${ctx.trabajadorApellido ?? ''}`.trim() || 'Un trabajador'
        const servicio = ctx.servicioNombre ?? 'tu solicitud'

        return this.#repo.crear({
            idUsuario: ctx.idUsuarioCliente,
            tipo: 'OFERTA_NUEVA',
            titulo: 'Nueva oferta recibida',
            mensaje: `${nombre} ofertó ${formatoPrecio(precio ?? ctx.precioSolicitud)} por "${
                servicio}".`,
            data: { idTrabajo, idTrabajador, precio: precio ?? ctx.precioSolicitud, servicioNombre: ctx.servicioNombre },
        })
    }

    // ── Oferta aceptada → le avisa al trabajador ganador ────────────────────
    notificarOfertaAceptada = async ({ idTrabajo, idTrabajador, precioFinal }) => {
        const ctx = await this.#repo.obtenerContextoTrabajo(idTrabajo)
        if (!ctx?.idUsuarioTrabajador) return null

        const cliente = `${ctx.clienteNombre ?? ''} ${ctx.clienteApellido ?? ''}`.trim() || 'El cliente'

        return this.#repo.crear({
            idUsuario: ctx.idUsuarioTrabajador,
            tipo: 'OFERTA_ACEPTADA',
            titulo: '¡Tu oferta fue aceptada!',
            mensaje: `${cliente} te asignó el trabajo "${ctx.servicioNombre ?? 'de tu oferta'}" por ${
                formatoPrecio(precioFinal ?? ctx.precio)}.`,
            data: { idTrabajo, idTrabajador, precio: precioFinal ?? ctx.precio },
        })
    }

    // ── Trabajo aceptado/asignado → le avisa al cliente (confirmación) ────
    notificarTrabajoAceptado = async ({ idTrabajo, precioFinal }) => {
        const ctx = await this.#repo.obtenerContextoTrabajo(idTrabajo)
        if (!ctx?.idUsuarioCliente) return null

        const trabajador = `${ctx.trabajadorNombre ?? ''} ${ctx.trabajadorApellido ?? ''}`.trim() || 'El trabajador'

        return this.#repo.crear({
            idUsuario: ctx.idUsuarioCliente,
            tipo: 'TRABAJO_ACEPTADO',
            titulo: 'Trabajo asignado',
            mensaje: `Aceptaste la oferta de ${trabajador} por ${formatoPrecio(precioFinal ?? ctx.precio)}. El trabajo quedó asignado.`,
            data: {
                idTrabajo,
                idTrabajador: ctx.idTrabajador ?? null,
                precio: precioFinal ?? ctx.precio,
                servicioNombre: ctx.servicioNombre ?? null,
            },
        })
    }

    // ── Oferta rechazada → le avisa a cada postulante que no ganó ───────────
    notificarOfertaRechazada = async ({ idTrabajo, idTrabajador, precioOfertado }) => {
        const ctx = await this.#repo.obtenerContextoTrabajo(idTrabajo)
        if (!ctx?.idUsuarioTrabajador) return null

        const servicio = ctx.servicioNombre ?? 'el trabajo'

        return this.#repo.crear({
            idUsuario: ctx.idUsuarioTrabajador,
            tipo: 'OFERTA_RECHAZADA',
            titulo: 'No fuiste elegido',
            mensaje: `Tu oferta para "${servicio}" no fue seleccionada por el cliente.`,
            data: { idTrabajo, idTrabajador, precio: precioOfertado ?? ctx.precio },
        })
    }

    // ── Mensaje nuevo → le avisa al destinatario (con throttle por chat) ────
    notificarMensaje = async ({ chatId, enviadorId, contenido = '', tipo = 'TEXTO' }) => {
        if (!chatId || !enviadorId) return null

        const ctx = await this.#repo.obtenerContextoChat(chatId)
        if (!ctx) return null

        // Destinatario = el que NO envió el mensaje
        let idDestino = null
        let nombreRemitente = null
        if (Number(enviadorId) === Number(ctx.idUsuarioCliente)) {
            idDestino = ctx.idUsuarioTrabajador
            nombreRemitente = ctx.clienteNombre
        } else {
            idDestino = ctx.idUsuarioCliente
            nombreRemitente = ctx.trabajadorNombre
        }
        if (!idDestino || Number(enviadorId) === Number(idDestino)) return null

        let mensaje = contenido?.trim()?.slice(0, 120)
        if (tipo === 'IMAGEN') mensaje = '📷 Te envió una imagen'
        else if (tipo === 'AUDIO') mensaje = '🎤 Te envió un audio'
        else if (tipo === 'VIDEO') mensaje = '🎬 Te envió un video'
        else if (tipo === 'ARCHIVO') mensaje = '📎 Te envió un archivo'
        else if (tipo === 'PROPUESTA') mensaje = '💼 Te hizo una propuesta'
        else if (tipo === 'OFERTA_TRABAJADOR') mensaje = '💰 Te mandó una oferta'
        else if (!mensaje) return null

        return this.#repo.crearMensajeConThrottle({
            idUsuario: idDestino,
            chatId,
            titulo: nombreRemitente ?? 'Nuevo mensaje',
            mensaje,
            data: { chatId, idCliente: ctx.idCliente, idTrabajador: ctx.idTrabajador },
        })
    }

    // ── Nueva solicitud → le avisa a los trabajadores de ese servicio ───────
    notificarSolicitudNueva = async ({ idTrabajo, servicioId, precio, fijo, emergencia }) => {
        if (!servicioId) return 0
        return this.#repo.crearParaTrabajadoresDeServicio({
            servicioId,
            titulo: 'Nueva solicitud disponible',
            mensaje: `Hay una nueva solicitud de ${
                fijo ? `precio fijo ${formatoPrecio(precio)}` : 'tipo subasta'
            }${emergencia ? ' (¡emergencia!)' : ''} disponible para tu especialidad.`,
            data: { idTrabajo, servicioId, precio, fijo, emergencia },
        })
    }

    // ── Código de llegada / fin generado → le avisa al trabajador ───────────
    notificarCodigo = async ({ idTrabajo, tipo, codigo }) => {
        const ctx = await this.#repo.obtenerContextoTrabajo(idTrabajo)
        if (!ctx?.idUsuarioTrabajador) return null

        const esLlegada = tipo === 'CODIGO_LLEGADA'
        return this.#repo.crear({
            idUsuario: ctx.idUsuarioTrabajador,
            tipo,
            titulo: esLlegada ? 'Código de llegada generado' : 'Código de cierre generado',
            mensaje: `El cliente generó el código de ${esLlegada ? 'llegada' : 'cierre'} para confirmar el trabajo.`,
            data: { idTrabajo, codigo: codigo ?? null },
        })
    }

    // ── Cierre de subasta (cron) → avisa al primero y al cliente ────────────
    notificarCierreSubasta = async ({ idTrabajo, idTrabajador, idUsuarioTrabajador, idUsuarioCliente, precio, nombreTrabajador }) => {
        if (idUsuarioTrabajador) {
            await this.#repo.crear({
                idUsuario: idUsuarioTrabajador,
                tipo: 'SUBASTA_CIERRE',
                titulo: 'Tu oferta quedó primera en la subasta',
                mensaje: `El plazo de la subasta terminó. Tu oferta de ${formatoPrecio(precio)} quedó primera. El cliente todavía tiene que confirmarte.`,
                data: { idTrabajo, idTrabajador, precio },
            })
        }

        if (idUsuarioCliente) {
            await this.#repo.crear({
                idUsuario: idUsuarioCliente,
                tipo: 'SUBASTA_CIERRE',
                titulo: 'Tu subasta terminó',
                mensaje: `La subasta cerró y ${nombreTrabajador ?? 'un trabajador'} quedó primero con ${
                    formatoPrecio(precio)}. Confirmá la oferta para asignar el trabajo.`,
                data: { idTrabajo, idTrabajador, precio },
            })
        }
        return true
    }

    // ── Trabajo finalizado (ambos confirmaron) → le avisa al cliente y al trabajador ──
    notificarTrabajoFinalizado = async ({ idTrabajo }) => {
        const ctx = await this.#repo.obtenerContextoTrabajo(idTrabajo)
        if (!ctx) return null

        const trabajador = `${ctx.trabajadorNombre ?? ''} ${ctx.trabajadorApellido ?? ''}`.trim() || 'tu trabajador'
        const cliente = `${ctx.clienteNombre ?? ''} ${ctx.clienteApellido ?? ''}`.trim() || 'tu cliente'
        const servicio = ctx.servicioNombre ?? 'el trabajo'
        const dataBase = {
            idTrabajo,
            idTrabajador: ctx.idTrabajador ?? null,
            precio: ctx.precio ?? null,
            servicioNombre: ctx.servicioNombre ?? null,
        }

        const resultados = []

        if (ctx.idUsuarioCliente) {
            resultados.push(await this.#repo.crear({
                idUsuario: ctx.idUsuarioCliente,
                tipo: 'TRABAJO_FINALIZADO',
                titulo: 'Trabajo finalizado',
                mensaje: `El trabajo "${servicio}" fue marcado como finalizado. ¡Gracias por usar Rading!`,
                data: dataBase,
            }))
        }

        if (ctx.idUsuarioTrabajador) {
            resultados.push(await this.#repo.crear({
                idUsuario: ctx.idUsuarioTrabajador,
                tipo: 'TRABAJO_FINALIZADO',
                titulo: 'Trabajo finalizado',
                mensaje: `El trabajo "${servicio}" con ${cliente} fue marcado como finalizado. ¡Felicitaciones! ${trabajador === 'tu trabajador' ? 'Recibirás tu pago.' : 'Esperamos verte pronto.'}`,
                data: dataBase,
            }))
        }

        return resultados
    }

    // ── Reseña recibida → le avisa al trabajador ────────────────────────────
    notificarReseña = async ({ idTrabajo, idTrabajador, idCliente, estrellas }) => {
        const ctx = await this.#repo.obtenerContextoTrabajo(idTrabajo)
        if (!ctx?.idUsuarioTrabajador) return null

        return this.#repo.crear({
            idUsuario: ctx.idUsuarioTrabajador,
            tipo: 'RESEÑA_NUEVA',
            titulo: 'Recibiste una reseña',
            mensaje: `${ctx.clienteNombre ?? 'Un cliente'} te calificó con ${estrellas} ${
                Number(estrellas) === 1 ? 'estrella' : 'estrellas'}.`,
            data: { idTrabajo, idTrabajador, idCliente, estrellas },
        })
    }
}