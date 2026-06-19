// src/services-ia/solicitudIA-service.js
import axios from 'axios';
import { generarJSON } from "./aiProvider.js";

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const PRECIO_MINIMO = 1500;

/**
 * Busca precios REALES en Argentina usando SerpAPI
 */
async function buscarPreciosRealesArgentina(nombreServicio) {
    try {
        const response = await axios.get('https://api.serpapi.com/search', {
            params: {
                q: `${nombreServicio} precio Buenos Aires Argentina`,
                location: 'Buenos Aires, Argentina',
                gl: 'ar',
                hl: 'es',
                api_key: SERPAPI_API_KEY
            },
            timeout: 8000
        });

        const data = response.data;
        const preciosEncontrados = [];

        // 1. Extraer de local_results (profesionales locales)
        if (data.local_results) {
            data.local_results.forEach(lugar => {
                if (lugar.price) {
                    const matches = lugar.price.match(/\d+/g);
                    if (matches) {
                        matches.forEach(m => preciosEncontrados.push(parseInt(m) * 1000));
                    }
                }
            });
        }

        // 2. Extraer de immersive_products
        if (data.immersive_products) {
            data.immersive_products.forEach(producto => {
                if (producto.extracted_price) {
                    preciosEncontrados.push(producto.extracted_price * 1000);
                }
            });
        }

        // 3. Buscar en snippets de organic results
        if (data.organic_results) {
            data.organic_results.forEach(result => {
                const regex = /\$?\s?(\d{1,3}(?:[.,]\d{3})*)/g;
                const matches = result.snippet?.matchAll(regex);
                if (matches) {
                    for (const match of matches) {
                        let precio = match[1].replace(/[.,]/g, '');
                        precio = parseInt(precio);
                        if (precio > 500 && precio < 500000) {
                            preciosEncontrados.push(precio);
                        }
                    }
                }
            });
        }

        if (preciosEncontrados.length === 0) {
            console.log(`⚠️  SerpAPI no devolvió precios para "${nombreServicio}"`);
            return null;
        }

        const min = Math.min(...preciosEncontrados);
        const max = Math.max(...preciosEncontrados);
        const promedio = Math.round(
            preciosEncontrados.reduce((a, b) => a + b) / preciosEncontrados.length
        );

        console.log(`✅ SerpAPI - ${nombreServicio}: $${min}-$${max} (promedio: $${promedio}, ${preciosEncontrados.length} fuentes)`);

        return { min, max, promedio, cantidad: preciosEncontrados.length };
    } catch (err) {
        console.warn(`❌ Error SerpAPI para "${nombreServicio}":`, err.message);
        return null;
    }
}

/**
 * Calcula el precio final EN CÓDIGO (no en el LLM), a partir de los datos
 * reales de SerpAPI y de la complejidad que devolvió el modelo.
 *
 * Esto es a propósito: los LLMs son poco confiables haciendo cuentas
 * ("30-50% del promedio") y tienden a repetir números de ejemplo del
 * prompt. Acá el cálculo es matemática pura en JS, 100% trazable.
 */
function calcularPrecios(datosReales, complejidad) {
    // Sin datos reales de SerpAPI: no podemos basarnos en mercado.
    // Devolvemos null para que el caller decida cómo marcarlo (confianza baja).
    if (!datosReales) return null;

    const { min, max, promedio } = datosReales;

    // Rangos de ajuste según complejidad declarada por el modelo.
    const FACTORES = {
        simple: { min: 0.3, max: 0.5 },
        media: { min: 0.5, max: 0.8 },
        compleja: { min: 0.8, max: 1.5 },
    };
    const factor = FACTORES[complejidad] ?? FACTORES.media;

    let precioMin = Math.round(promedio * factor.min);
    let precioMax = Math.round(promedio * factor.max);
    let precioSugerido = Math.round((precioMin + precioMax) / 2);

    // Nunca por debajo del mínimo de la plataforma.
    precioMin = Math.max(precioMin, PRECIO_MINIMO);
    precioMax = Math.max(precioMax, PRECIO_MINIMO);
    precioSugerido = Math.max(precioSugerido, PRECIO_MINIMO);

    // Coherencia min <= sugerido <= max
    if (precioMin > precioMax) [precioMin, precioMax] = [precioMax, precioMin];
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

    // 🔍 BUSCAR PRECIOS REALES EN ARGENTINA CON SERPAPI (para TODOS los servicios)
    console.log("🌐 Buscando precios reales en Argentina con SerpAPI...");
    const preciosReales = {};

    for (const servicio of servicios) {
        const precios = await buscarPreciosRealesArgentina(servicio.nombre);
        if (precios) {
            preciosReales[servicio.id] = precios;
        }
    }

    const cantidadConDatos = Object.keys(preciosReales).length;
    console.log(`🌐 SerpAPI: ${cantidadConDatos}/${servicios.length} servicios con datos reales`);

    // Armar lista de servicios — SIN precios, porque el modelo NO decide
    // precios, solo elige el servicio. Los precios se calculan después en JS.
    const listaServicios = servicios
        .map((s) => `[${s.id}] ${s.nombre} (${s.categoria_nombre})`)
        .join("\n");

    // ⭐ PROMPT: el modelo SOLO clasifica, nunca inventa números.
    const systemPrompt = `
Sos un clasificador experto en servicios (changas) en Argentina.

Tu ÚNICA tarea es leer la descripción del cliente y devolver una clasificación.
NO calculás precios. NO inventás montos en pesos. Eso lo hace otro sistema
con datos reales de mercado — vos no tenés esa información y no debés
adivinarla.

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

4. "complejidad": evaluá qué tan complejo es el trabajo en sí mismo
   (no el precio):
   - "simple": tarea chica, rápida, sin materiales especiales
   - "media": tarea estándar, complejidad normal del rubro
   - "compleja": tarea grande, varios pasos, materiales o riesgo mayor

5. "confianza": qué tan segura es tu clasificación:
   - "alta": descripción clara y completa
   - "media": falta algún dato relevante (medidas, cantidad, zona)
   - "baja": descripción muy vaga o ambigua

6. "notas": si falta info crítica para cotizar bien (medidas, cantidad,
   zona, urgencia), mencionalo acá en una frase corta. Si no falta nada,
   dejalo vacío.

**RESPONDÉ SOLO JSON, SIN MARKDOWN, SIN TEXTO ADICIONAL, con EXACTAMENTE
estas claves (los valores de ejemplo son solo para mostrar el TIPO de
dato esperado, no los copies):**
{
  "descripcionMejorada": "<string>",
  "servicioId": <number, debe ser uno de los ids listados>,
  "emergencia": <boolean>,
  "complejidad": "<simple|media|compleja>",
  "confianza": "<alta|media|baja>",
  "notas": "<string, puede ser vacío>"
}
`.trim();

    const userPrompt = `Descripción original del cliente: "${descripcionOriginal}"`;

    console.log("📞 Enviando clasificación a Groq...");
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

    // --- Precios: SIEMPRE calculados en JS con datos de SerpAPI ---
    const datosReales = resultado.servicioId ? preciosReales[resultado.servicioId] : null;
    const precios = calcularPrecios(datosReales, resultado.complejidad);

    if (precios) {
        resultado.precioMin = precios.precioMin;
        resultado.precioMax = precios.precioMax;
        resultado.precioSugerido = precios.precioSugerido;
        resultado.fuentePrecios = "serpapi";
    } else {
        // No hay datos de SerpAPI para este servicio: no inventamos un
        // número de mercado. Devolvemos el mínimo de plataforma y bajamos
        // la confianza para que el frontend avise al usuario que el precio
        // es solo un piso, no una estimación de mercado.
        console.warn(`⚠️  Sin datos de SerpAPI para servicioId=${resultado.servicioId}, usando piso mínimo`);
        resultado.precioMin = PRECIO_MINIMO;
        resultado.precioMax = PRECIO_MINIMO;
        resultado.precioSugerido = PRECIO_MINIMO;
        resultado.fuentePrecios = "sin_datos";
        resultado.confianza = "baja";
    }

    console.log(`✅ Resultado final:`, resultado);
    return resultado;
}