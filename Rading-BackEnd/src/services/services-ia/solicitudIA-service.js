import { generarJSON } from "./aiProvider.js";

const PRECIO_MINIMO = 1500;

function normalizarPrecios(resultado) {
    let { precioSugerido } = resultado;
    precioSugerido = Number(precioSugerido);

    if (!Number.isFinite(precioSugerido)) return null;

    precioSugerido = Math.max(Math.round(precioSugerido * 4.28), PRECIO_MINIMO);
    const precioMin = Math.round(precioSugerido * 0.73);
    const precioMax = Math.round(precioSugerido * 1.75);

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

**REGLA CRÍTICA SOBRE ACLARACIONES — LEÉ ESTO PRIMERO:**
El texto del cliente puede incluir una o más secciones "— Aclaración: ...", que son
respuestas que el cliente YA DIO a preguntas anteriores. Antes de generar una nueva
"preguntaAclaracion", releé TODO el texto del cliente (descripción original +
TODAS las aclaraciones) y verificá si el dato que estás a punto de pedir ya está
ahí, aunque esté con otras palabras o en otro orden.
- Ejemplo: si el texto dice "...hornito eléctrico... — Aclaración: es eléctrico",
  el tipo de horno YA ESTÁ RESPONDIDO. NO vuelvas a preguntar gas/eléctrico.
- Si ya hay al menos UNA aclaración en el texto y todavía falta un dato menor,
  preferí no preguntar de nuevo: elegí el servicio más cercano posible con lo que
  hay, marcá "necesitaAclaracion": false, y poné el dato faltante en "notas".
  Solo repreguntá si es literalmente imposible clasificar sin ese dato.
- Nunca generes una "preguntaAclaracion" que sea igual o muy similar a algo que
  el cliente ya contestó en una aclaración anterior.
- SI LA ACLARACIÓN DEL CLIENTE ES DEL TIPO "no sé", "no tengo idea", "ni idea",
  "no sabría decirte", "no sé explicarlo", "no entiendo la pregunta", o
  cualquier variante que indique que el cliente no puede dar ese dato:
  marcá "necesitaAclaracion": false INMEDIATAMENTE, no insistas con otra
  pregunta relacionada, elegí el servicio más cercano posible con lo que ya
  tenés, y poné en "notas" que falta ese dato para precisar mejor.

**LO QUE TENÉS QUE DEVOLVER:**

1. "descripcionMejorada": reescribí el pedido del cliente en español neutro
   rioplatense, claro y completo, integrando la descripción original y todas
   las aclaraciones en un solo texto coherente. SIN inventar datos que el
   cliente no dio.

2. "servicioId": el id EXACTO de la lista de arriba que mejor corresponde.
   Si ninguno corresponde bien, elegí el más cercano posible.

3. "emergencia": true SOLO si hay pérdida de agua activa, corte de luz
   total, o riesgo estructural inmediato. false en cualquier otro caso.

4. "complejidad": "simple" | "media" | "compleja"

5. "confianza":
   - "alta": descripción clara y completa, podés cotizar con precisión
   - "media": falta algún dato relevante pero podés estimar igual
   - "baja": descripción demasiado vaga, ambigua o sin sentido para el rubro

6. "necesitaAclaracion": true SOLO si te falta un dato imprescindible para
   clasificar el servicio Y ese dato NO aparece ya en el texto (incluyendo
   aclaraciones previas). false si el cliente ya dijo que no sabe, no puede
   dar más detalles, o si ya respondió aclaraciones antes — en esos casos
   elegí el servicio más cercano posible y procedé sin preguntar más.

7. "preguntaAclaracion": si necesitaAclaracion es true, escribí UNA sola
   pregunta corta y concreta, que NO repita algo ya contestado. Ejemplos:
   "¿La pérdida es en una canilla, un caño o el inodoro?",
   "¿En qué ambiente necesitás la pintura y cuántos m² aproximadamente?".
   Si necesitaAclaracion es false, dejá este campo vacío "".

8. "notas": info que falta para cotizar bien pero no impide clasificar.
   Si no falta nada importante, dejalo vacío "".

9. "precioSugerido": estimá UN SOLO precio en ARS según el mercado argentino
   para este trabajo específico. Nunca menos de ${PRECIO_MINIMO} ARS.
   Variá el precio según la complejidad y lo que describió el cliente.

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
  "precioSugerido": <number>
}
`.trim();

    const userPrompt = `Descripción del cliente (incluye aclaraciones previas si las hay): "${descripcionOriginal}"`;

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