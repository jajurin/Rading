import { generarJSON } from "./aiProvider.js";

const PRECIO_MINIMO = 1500;

// ─────────────────────────────────────────────────────────────────────────
// PRECIOS DE REFERENCIA — ARGENTINA 2026
// Investigado a partir de tarifarios de colegios profesionales (CPACF, CPIC,
// Colegio de Psicólogos, CPAU, Colegio de Ingenieros), guías de precios de
// plataformas del rubro (Clickie, Solvit, Roomix, Tegu, Ellaburante, Muovi,
// Servidos), notas periodísticas (Cronista, Infobae, Los Andes) y tarifarios
// gremiales de diseño (tarifario.org, tarifario.info). Actualizado a julio 2026.
// Son ANCLAS de mercado, no una lista cerrada: el modelo debe interpolar
// cuando el pedido no calza exacto, y ajustar por urgencia/complejidad/zona.
// ─────────────────────────────────────────────────────────────────────────
const PRECIOS_REFERENCIA = `
**PRECIOS DE REFERENCIA ARGENTINA 2026 (mano de obra, salvo aclaración):**
Usá estos rangos como ANCLA de mercado real para estimar "precioSugerido". No es
una lista cerrada: si el pedido no encaja exacto, interpolá con el rango más
parecido según complejidad, cantidad de trabajo y zona (asumí CABA/GBA si no se
aclara nada). Trabajos de noche, fin de semana o feriado: sumá 30-80% sobre el
valor base. Emergencias reales (pérdida de agua activa, olor a gas, corte total
de luz, riesgo estructural): cotizá en el techo del rango o por encima.

── OFICIOS Y SERVICIOS PARA EL HOGAR ──

PLOMERO
- Visita/diagnóstico: $15.000–$35.000
- Cambio de canilla o cuerito: $12.000–$25.000
- Cambio de canilla monocomando: $25.000–$45.000
- Reparación de pérdida visible: $20.000–$60.000
- Reparación de pérdida en cañería empotrada: $35.000–$90.000
- Destape de pileta/bacha/inodoro: $18.000–$55.000
- Destape con máquina / cañería principal: $35.000–$100.000
- Cambio de flexible o llave de paso: $10.000–$35.000
- Cambio de grifería completa: $30.000–$60.000
- Cambio de inodoro o bidet: $50.000–$120.000
- Instalación de termotanque eléctrico: $55.000–$120.000
- Instalación de bomba presurizadora: $54.000–$120.000
- Reforma de baño completa (solo plomería): $150.000–$400.000+
- Cambio de cañería completa de un depto: $200.000–$500.000+

GASISTA MATRICULADO (siempre requiere matrícula ENARGAS — nunca "plomero")
- Visita/diagnóstico: $30.000–$50.000
- Detección de fuga / prueba de hermeticidad: $40.000–$90.000
- Instalación de calefón: $108.000–$185.000
- Instalación de termotanque a gas: $75.000–$180.000
- Rehabilitación de gas ante distribuidora (Metrogas/Ecogas/Camuzzi): $240.000–$360.000
- Habilitación completa nueva / instalación desde cero: $300.000+
- Fuga de gas activa = EMERGENCIA: cotizar en el techo o por encima
  ($60.000-$120.000+ solo la visita urgente, más la reparación puntual)

ELECTRICISTA MATRICULADO
- Visita/diagnóstico: $20.000–$46.000
- Instalación de toma/interruptor (boca): $28.000–$50.000 por punto
- Búsqueda y reparación de cortocircuito: $45.000–$95.000
- Cambio de llave térmica/disyuntor: $28.000–$55.000
- Armado de tablero (hasta 6 circuitos): $180.000–$420.000
- Instalación de línea para aire acondicionado: $43.000–$75.000
- Puesta a tierra (departamento estándar): $80.000–$200.000
- Certificado DCI (obligatorio para alquilar): $120.000–$240.000
- Corte de luz total en la vivienda = EMERGENCIA: priorizar el techo del rango

CERRAJERO
- Apertura de puerta simple (sin daño): $19.500–$50.000
- Apertura de puerta de seguridad: $55.000–$90.000+
- Cambio de cerradura común: $35.000–$70.000
- Cambio de cerradura de seguridad (Trabex, MUL-T-LOCK): $80.000–$150.000
- Instalación de cerradura nueva (sin cerradura previa): $20.000–$50.000
- Duplicado de llaves: $5.000–$15.000
- Cerradura electrónica/inteligente (con instalación): $210.000–$520.000
- Recargo urgencia nocturna/fin de semana/feriado: +30% a +100%

JARDINERO
- Corte de pasto (jardín chico/mediano): $20.000–$60.000 por visita
- Limpieza y mantenimiento general (jardín chico): $25.000–$60.000
- Limpieza profunda + desmalezado + poda: $60.000–$120.000
- Poda de árboles grandes / trabajo de altura: $50.000+ según complejidad
- Mantenimiento mensual recurrente: $20.000–$50.000/mes

LIMPIEZA (doméstica)
- Por hora (con retiro, tarea general): ~$3.800–$4.200 la hora
- Limpieza de departamento estándar (2-3 amb, 3-4hs): $15.000–$25.000
- Limpieza profunda / post-obra: $25.000–$50.000+
- Limpieza de oficina/local: cotizar por m² o por hora según superficie

── DISEÑO Y SERVICIOS DIGITALES ──

DISEÑADOR GRÁFICO
- Logo/isotipo simple (cliente particular/profesional): $150.000–$300.000
- Identidad corporativa completa (logo + manual + papelería, PyME): $300.000–$700.000
- Pieza gráfica suelta (flyer, díptico, post): $15.000–$40.000
- Ilustración digital por pieza: $30.000–$80.000
- Community manager (diseño de piezas incluido, ver más abajo)

PROGRAMADOR / DESARROLLADOR WEB
- Landing page simple: $250.000–$350.000
- Sitio institucional/corporativo (varias secciones): $350.000–$800.000
- Tienda online (e-commerce): $600.000–$1.300.000+
- Hora de trabajo freelance (ajustes, mantenimiento): $8.000–$25.000
- Mantenimiento mensual de sitio: desde $30.000/mes
- Proyectos grandes / a medida (sistemas, apps): cotizar aparte, arrancan en USD

REDACTOR
- Artículo/nota estándar (500-800 palabras): $8.000–$25.000 por pieza
- Redacción SEO o técnica especializada: $15.000–$40.000 por pieza
- Corrección/edición de texto: $5.000–$15.000 por página

EDITOR DE VIDEO
- Edición de reel/short (hasta 1 min, redes): $8.000–$20.000 por pieza
- Edición de video estándar (varios minutos, cortes+color+sonido): $15.000–$40.000
- Paquete mensual (varios videos/mes para una marca): $150.000–$400.000/mes

COMMUNITY MANAGER
- Freelance junior (2-3 redes, 12-15 posteos/mes): $150.000–$250.000/mes
- Freelance con experiencia (estrategia + contenido): $250.000–$450.000/mes
- Agencia / servicio integral: $400.000–$800.000/mes
- Sesión de fotos/video para contenido (aparte): $50.000–$150.000

── PROFESIONALES MATRICULADOS ──

ABOGADO
- Consulta verbal simple: $15.000–$40.000 (referencia gremial ~$310.000 tope alto)
- Consulta escrita / dictamen breve: $30.000–$80.000
- Redacción de contrato estándar (locación, prestación servicios): $60.000–$180.000
- Trámite puntual (sucesión simple, divorcio de mutuo acuerdo sin bienes):
  $500.000–$2.000.000
- Honorarios judiciales: regulados por Ley 27.423, van del 10-25% del valor
  del litigio — no aplica a consultas puntuales

CONTADOR
- Consulta puntual: $20.000–$50.000
- Recategorización de monotributo: $55.000–$180.000 según complejidad
- Abono mensual monotributista (llevar impuestos al día): $30.000–$80.000/mes
- Abono mensual responsable inscripto/PyME: $80.000–$250.000/mes
- Balance anual / cierre de sociedad: $150.000–$500.000+
- Inscripción o constitución de sociedad: $150.000–$400.000

ARQUITECTO
- Consulta/asesoramiento puntual: $30.000–$80.000
- Proyecto + dirección de obra: 8%-15% del costo total de la obra
- Solo anteproyecto/planos (vivienda chica): $200.000–$600.000
- Render/visualización 3D: $80.000–$250.000 por imagen
- Referencia de costo de obra (para calcular %): USD 700-1.600 el m²

MÉDICO (consulta particular, sin obra social)
- Consulta clínica general: $25.000–$60.000
- Consulta con especialista: $40.000–$90.000
- Primera consulta (más extensa): recargo ~30% sobre el valor de consulta normal

PSICÓLOGO
- Sesión individual (45-50 min), particular: $25.000–$60.000
- Sesión de pareja: $45.000–$80.000
- Sesión a domicilio: recargo sobre el valor de consulta estándar

INGENIERO
- Consulta/informe técnico puntual (estructural, instalaciones): $80.000–$300.000
- Informe o certificación formal con firma profesional (honorario mínimo
  de colegio profesional): desde $500.000
- Trabajos de mayor escala (proyecto industrial, cálculo estructural grande):
  cotizar aparte, escalan fuerte con la complejidad

PARA CUALQUIER SERVICIO NO LISTADO ARRIBA: no inventes un número al voleo.
Razoná por analogía usando complejidad + PRECIO_MINIMO como piso: una changa o
arreglo puntual ronda $15.000-$60.000, un trabajo de mediana complejidad
$60.000-$180.000, un proyecto grande o con entregable profesional (balance,
diseño de marca completo, sitio web, informe técnico firmado) $180.000-$600.000+.
`.trim();

function normalizarPrecios(resultado) {
    let { precioSugerido } = resultado;
    precioSugerido = Number(precioSugerido);

    if (!Number.isFinite(precioSugerido)) return null;

    precioSugerido = precioSugerido*1.1;
    const precioMin =precioSugerido*0.7 ;
    const precioMax = precioSugerido*1.6         ;

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

${PRECIOS_REFERENCIA}

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
   para este trabajo específico, usando la tabla de PRECIOS DE REFERENCIA de
   arriba como ancla. Nunca menos de ${PRECIO_MINIMO} ARS. Variá el precio
   según la complejidad, la urgencia y lo que describió el cliente.

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

    console.log("📞 Enviando clasificación + cotización a MiniMax-M3...");
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
        resultado.fuentePrecios  = "minimax_m3_estimado";
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