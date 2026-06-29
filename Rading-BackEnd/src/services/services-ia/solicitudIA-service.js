// src/services-ia/solicitudIA-service.js
import { generarJSON } from "./aiProvider.js";

const PRECIO_MINIMO = 1500;

function normalizarPrecios(resultado) {
    let { precioMin, precioMax, precioSugerido } = resultado;

    precioMin      = Number(precioMin);
    precioMax      = Number(precioMax);
    precioSugerido = Number(precioSugerido);

    if (!Number.isFinite(precioMin) || !Number.isFinite(precioMax) || !Number.isFinite(precioSugerido)) {
        return null;
    }

    // 1) Calculás el sugerido con tu fórmula
    const promedio = (precioMax * 1.3 + precioMin) / 2;
    precioSugerido = Math.max(Math.round(promedio * 1.9), PRECIO_MINIMO);

    // 2) El rango se adapta al sugerido
    precioMin = Math.round(precioSugerido * 0.7);
    precioMax = Math.round(precioSugerido * 1.3);

    return { precioMin, precioMax, precioSugerido };
}

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
   total, o riesgo estructural inmediato. false en cualquier otro caso.

4. "complejidad": "simple" | "media" | "compleja"

5. "confianza": 
   - "alta": descripción clara y completa, podés cotizar con precisión
   - "media": falta algún dato relevante pero podés estimar igual
   - "baja": descripción demasiado vaga, ambigua o sin sentido para el rubro

6. "necesitaAclaracion": true si la confianza es "baja" o si para clasificar
   correctamente el servicio necesitás saber algo más del cliente. false si
   con lo que hay alcanza para proceder.

7. "preguntaAclaracion": si necesitaAclaracion es true, escribí UNA sola
   pregunta corta y concreta para el cliente que te permita clasificar y
   cotizar mejor. Ejemplos: "¿El horno es a gas o eléctrico?",
   "¿La pérdida es en una canilla, un caño o el inodoro?",
   "¿En qué ambiente necesitás la pintura y cuántos m² aproximadamente?".
   Si necesitaAclaracion es false, dejá este campo vacío "".

8. "notas": info que falta para cotizar bien pero no impide clasificar.
   Si no falta nada importante, dejalo vacío "".

9. "precioMin", "precioMax", "precioSugerido": estimación en ARS según
   precios de mercado en Argentina. Nunca menos de ${PRECIO_MINIMO} ARS.
   Si la confianza es baja, igual estimá un rango amplio.

**RESPONDÉ SOLO JSON, SIN MARKDOWN, SIN TEXTO ADICIONAL:**
{
  "descripcionMejorada": "<string>",
  "servicioId": <number>,
  "emergencia": <boolean>,
  "complejidad": "<simple|media|compleja>",
  "confianza": "<alta|media|baja>",
  "necesitaAclaracion": <boolean>,
  "preguntaAclaracion": "<string>",
  "notas": "<string>",
  "precioMin": <number>,
  "precioMax": <number>,
  "precioSugerido": <number>
}
`.trim();

    const userPrompt = `Descripción original del cliente: "${descripcionOriginal}"`;

    console.log("📞 Enviando clasificación + cotización a Gemini...");
    const resultado = await generarJSON(systemPrompt, userPrompt);

    // --- Validaciones defensivas ---
    const idsValidos = new Set(servicios.map((s) => s.id));
    if (!idsValidos.has(resultado.servicioId)) {
        console.warn(`⚠️  servicioId ${resultado.servicioId} no válido, seteando null`);
        resultado.servicioId = null;
    }

    const complejidadesValidas = new Set(["simple", "media", "compleja"]);
    if (!complejidadesValidas.has(resultado.complejidad)) {
        resultado.complejidad = "media";
    }

    // Si el servicioId no es válido, forzamos necesitaAclaracion


    // --- Precios ---
    const precios = normalizarPrecios(resultado);
    if (precios) {
        resultado.precioMin      = precios.precioMin;
        resultado.precioMax      = precios.precioMax;
        resultado.precioSugerido = precios.precioSugerido;
        resultado.fuentePrecios  = "gemini_estimado";
    } else {
        console.warn(`⚠️  El modelo no devolvió precios válidos, usando piso mínimo`);
        resultado.precioMin      = PRECIO_MINIMO;
        resultado.precioMax      = PRECIO_MINIMO;
        resultado.precioSugerido = PRECIO_MINIMO;
        resultado.fuentePrecios  = "sin_datos";
        resultado.confianza      = "baja";
        resultado.necesitaAclaracion = true;
        resultado.preguntaAclaracion = resultado.preguntaAclaracion ||
            "¿Podés dar más detalles sobre lo que necesitás?";
    }

    console.log(`✅ Resultado final:`, resultado);
    return resultado;
}