// src/services-ia/solicitudIA-service.js
import { generarJSON } from "./aiProvider.js";

const PRECIO_MINIMO = 1500;

/**
 * Ajusta/valida los precios que devolvió el modelo, garantizando
 * coherencia (min <= sugerido <= max) y el piso de la plataforma.
 */
function normalizarPrecios(resultado) {
    let { precioMin, precioMax, precioSugerido } = resultado;

    precioMin = Number(precioMin);
    precioMax = Number(precioMax);
    precioSugerido = Number(precioSugerido);

    if (!Number.isFinite(precioMin) || !Number.isFinite(precioMax) || !Number.isFinite(precioSugerido)) {
        return null;
    }

    if (precioMin > precioMax) [precioMin, precioMax] = [precioMax, precioMin];

    precioMin = Math.max(Math.round(precioMin), PRECIO_MINIMO);
    precioMax = Math.max(Math.round(precioMax), PRECIO_MINIMO);
    precioSugerido = Math.round(precioSugerido);
    precioSugerido = Math.min(Math.max(precioSugerido, precioMin), precioMax);

    return { precioMin, precioMax, precioSugerido };
}

/**
 * @param {string} descripcionOriginal
 * @param {Array} servicios
 */
export async function analizarSolicitud(descripcionOriginal, servicios) {
    if (!descripcionOriginal || descripcionOriginal.trim().length < 10) {
        throw new Error("descripcionOriginal es requerida (mínimo 10 caracteres)");
    }
    if (!servicios || servicios.length === 0) {
        throw new Error("No hay servicios cargados en la base de datos");
    }

    const listaServicios = servicios
        .map((s) => `[${s.id}] ${s.nombre} (${s.categoria_nombre})`)
        .join("\n");

    const systemPrompt = `
Sos un clasificador y cotizador experto en servicios (changas) en Argentina.

**SERVICIOS DISPONIBLES (elegí uno, por id):**
${listaServicios}

**LO QUE TENÉS QUE DEVOLVER:**

1. "descripcionMejorada": reescribí el pedido del cliente en español neutro
   rioplatense, claro y completo, SIN inventar datos que el cliente no dio.

2. "servicioId": el id EXACTO de la lista de arriba que mejor corresponde.
   Si ninguno corresponde bien, elegí el más cercano posible.

3. "emergencia": true SOLO si hay pérdida de agua activa, corte de luz
   total, o riesgo estructural inmediato. false en cualquier otro caso
   (mantenimiento, mejora, trabajo de rutina).

4. "complejidad": evaluá qué tan complejo es el trabajo en sí mismo:
   - "simple": tarea chica, rápida, sin materiales especiales
   - "media": tarea estándar, complejidad normal del rubro
   - "compleja": tarea grande, varios pasos, materiales o riesgo mayor

5. "confianza": qué tan segura es tu clasificación y estimación:
   - "alta": descripción clara y completa
   - "media": falta algún dato relevante (medidas, cantidad, zona)
   - "baja": descripción muy vaga o ambigua

6. "notas": si falta info crítica para cotizar bien (medidas, cantidad,
   zona, urgencia), mencionalo acá en una frase corta. Si no falta nada,
   dejalo vacío.

7. "precioMin", "precioMax", "precioSugerido": estimá un rango de precio
   REALISTA en pesos argentinos (ARS) para este trabajo, según precios
   habituales de mercado en Argentina para changas/servicios de este tipo,
   ajustado por la complejidad y la zona si se menciona. Nunca menos de
   ${PRECIO_MINIMO} ARS. precioMin <= precioSugerido <= precioMax.

**RESPONDÉ SOLO JSON, SIN MARKDOWN, SIN TEXTO ADICIONAL, con EXACTAMENTE
estas claves:**
{
  "descripcionMejorada": "<string>",
  "servicioId": <number, debe ser uno de los ids listados>,
  "emergencia": <boolean>,
  "complejidad": "<simple|media|compleja>",
  "confianza": "<alta|media|baja>",
  "notas": "<string, puede ser vacío>",
  "precioMin": <number>,
  "precioMax": <number>,
  "precioSugerido": <number>
}
`.trim();

    const userPrompt = `Descripción original del cliente: "${descripcionOriginal}"`;

    console.log("📞 Enviando clasificación + cotización a Gemini...");
    const resultado = await generarJSON(systemPrompt, userPrompt);

    // --- Validaciones defensivas sobre lo que devolvió el modelo ---
    const idsValidos = new Set(servicios.map((s) => s.id));
    if (!idsValidos.has(resultado.servicioId)) {
        console.warn(`⚠️  servicioId ${resultado.servicioId} no válido, seteando null`);
        resultado.servicioId = null;
    }

    const complejidadesValidas = new Set(["simple", "media", "compleja"]);
    if (!complejidadesValidas.has(resultado.complejidad)) {
        resultado.complejidad = "media";
    }

    // --- Precios: validados/normalizados en JS, pero ESTIMADOS por el modelo ---
    const precios = normalizarPrecios(resultado);

    if (precios) {
        resultado.precioMin = precios.precioMin;
        resultado.precioMax = precios.precioMax;
        resultado.precioSugerido = precios.precioSugerido;
        resultado.fuentePrecios = "gemini_estimado";
    } else {
        console.warn(`⚠️  El modelo no devolvió precios válidos, usando piso mínimo`);
        resultado.precioMin = PRECIO_MINIMO;
        resultado.precioMax = PRECIO_MINIMO;
        resultado.precioSugerido = PRECIO_MINIMO;
        resultado.fuentePrecios = "sin_datos";
        resultado.confianza = "baja";
    }

    console.log(`✅ Resultado final:`, resultado);
    return resultado;
}