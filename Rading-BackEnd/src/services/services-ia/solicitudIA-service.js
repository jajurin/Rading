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
// (Valores aumentados manualmente x1.3 respecto a la investigación original)
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
- Visita/diagnóstico: $19.500–$45.500
- Cambio de canilla o cuerito: $15.500–$32.500
- Cambio de canilla monocomando: $32.500–$58.500
- Reparación de pérdida visible: $26.000–$78.000
- Reparación de pérdida en cañería empotrada: $45.500–$117.000
- Destape de pileta/bacha/inodoro: $23.500–$71.500
- Destape con máquina / cañería principal: $45.500–$130.000
- Cambio de flexible o llave de paso: $13.000–$45.500
- Cambio de grifería completa: $39.000–$78.000
- Cambio de inodoro o bidet: $65.000–$156.000
- Instalación de termotanque eléctrico: $71.500–$156.000
- Instalación de bomba presurizadora: $70.000–$156.000
- Reforma de baño completa (solo plomería): $195.000–$520.000+
- Cambio de cañería completa de un depto: $260.000–$650.000+

GASISTA MATRICULADO (siempre requiere matrícula ENARGAS — nunca "plomero")
- Visita/diagnóstico: $39.000–$65.000
- Detección de fuga / prueba de hermeticidad: $52.000–$117.000
- Instalación de calefón: $140.500–$240.500
- Instalación de termotanque a gas: $97.500–$234.000
- Rehabilitación de gas ante distribuidora (Metrogas/Ecogas/Camuzzi): $312.000–$468.000
- Habilitación completa nueva / instalación desde cero: $390.000+
- Fuga de gas activa = EMERGENCIA: cotizar en el techo o por encima
  ($78.000-$156.000+ solo la visita urgente, más la reparación puntual)

ELECTRICISTA MATRICULADO
- Visita/diagnóstico: $26.000–$59.500
- Instalación de toma/interruptor (boca): $36.500–$65.000 por punto
- Búsqueda y reparación de cortocircuito: $58.500–$123.500
- Cambio de llave térmica/disyuntor: $36.500–$71.500
- Armado de tablero (hasta 6 circuitos): $234.000–$546.000
- Instalación de línea para aire acondicionado: $56.000–$97.500
- Puesta a tierra (departamento estándar): $104.000–$260.000
- Certificado DCI (obligatorio para alquilar): $156.000–$312.000
- Corte de luz total en la vivienda = EMERGENCIA: priorizar el techo del rango

CERRAJERO
- Apertura de puerta simple (sin daño): $25.500–$65.000
- Apertura de puerta de seguridad: $71.500–$117.000+
- Cambio de cerradura común: $45.500–$91.000
- Cambio de cerradura de seguridad (Trabex, MUL-T-LOCK): $104.000–$195.000
- Instalación de cerradura nueva (sin cerradura previa): $26.000–$65.000
- Duplicado de llaves: $6.500–$19.500
- Cerradura electrónica/inteligente (con instalación): $273.000–$676.000
- Recargo urgencia nocturna/fin de semana/feriado: +30% a +100%

JARDINERO
- Corte de pasto (jardín chico/mediano): $26.000–$78.000 por visita
- Limpieza y mantenimiento general (jardín chico): $32.500–$78.000
- Limpieza profunda + desmalezado + poda: $78.000–$156.000
- Poda de árboles grandes / trabajo de altura: $65.000+ según complejidad
- Mantenimiento mensual recurrente: $26.000–$65.000/mes

LIMPIEZA (doméstica)
- Por hora (con retiro, tarea general): ~$4.900–$5.500 la hora
- Limpieza de departamento estándar (2-3 amb, 3-4hs): $19.500–$32.500
- Limpieza profunda / post-obra: $32.500–$65.000+
- Limpieza de oficina/local: cotizar por m² o por hora según superficie

── DISEÑO Y SERVICIOS DIGITALES ──

DISEÑADOR GRÁFICO
- Logo/isotipo simple (cliente particular/profesional): $195.000–$390.000
- Identidad corporativa completa (logo + manual + papelería, PyME): $390.000–$910.000
- Pieza gráfica suelta (flyer, díptico, post): $19.500–$52.000
- Ilustración digital por pieza: $39.000–$104.000
- Community manager (diseño de piezas incluido, ver más abajo)

PROGRAMADOR / DESARROLLADOR WEB
- Landing page simple: $325.000–$455.000
- Sitio institucional/corporativo (varias secciones): $455.000–$1.040.000
- Tienda online (e-commerce): $780.000–$1.690.000+
- Hora de trabajo freelance (ajustes, mantenimiento): $10.500–$32.500
- Mantenimiento mensual de sitio: desde $39.000/mes
- Proyectos grandes / a medida (sistemas, apps): cotizar aparte, arrancan en USD

REDACTOR
- Artículo/nota estándar (500-800 palabras): $10.500–$32.500 por pieza
- Redacción SEO o técnica especializada: $19.500–$52.000 por pieza
- Corrección/edición de texto: $6.500–$19.500 por página

EDITOR DE VIDEO
- Edición de reel/short (hasta 1 min, redes): $10.500–$26.000 por pieza
- Edición de video estándar (varios minutos, cortes+color+sonido): $19.500–$52.000
- Paquete mensual (varios videos/mes para una marca): $195.000–$520.000/mes

COMMUNITY MANAGER
- Freelance junior (2-3 redes, 12-15 posteos/mes): $195.000–$325.000/mes
- Freelance con experiencia (estrategia + contenido): $325.000–$585.000/mes
- Agencia / servicio integral: $520.000–$1.040.000/mes
- Sesión de fotos/video para contenido (aparte): $65.000–$195.000

── PROFESIONALES MATRICULADOS ──

ABOGADO
- Consulta verbal simple: $19.500–$52.000 (referencia gremial ~$403.000 tope alto)
- Consulta escrita / dictamen breve: $39.000–$104.000
- Redacción de contrato estándar (locación, prestación servicios): $78.000–$234.000
- Trámite puntual (sucesión simple, divorcio de mutuo acuerdo sin bienes):
  $650.000–$2.600.000
- Honorarios judiciales: regulados por Ley 27.423, van del 10-25% del valor
  del litigio — no aplica a consultas puntuales

CONTADOR
- Consulta puntual: $26.000–$65.000
- Recategorización de monotributo: $71.500–$234.000 según complejidad
- Abono mensual monotributista (llevar impuestos al día): $39.000–$104.000/mes
- Abono mensual responsable inscripto/PyME: $104.000–$325.000/mes
- Balance anual / cierre de sociedad: $195.000–$650.000+
- Inscripción o constitución de sociedad: $195.000–$520.000

ARQUITECTO
- Consulta/asesoramiento puntual: $39.000–$104.000
- Proyecto + dirección de obra: 8%-15% del costo total de la obra
- Solo anteproyecto/planos (vivienda chica): $260.000–$780.000
- Render/visualización 3D: $104.000–$325.000 por imagen
- Referencia de costo de obra (para calcular %): USD 700-1.600 el m²

MÉDICO (consulta particular, sin obra social)
- Consulta clínica general: $32.500–$78.000
- Consulta con especialista: $52.000–$117.000
- Primera consulta (más extensa): recargo ~30% sobre el valor de consulta normal

PSICÓLOGO
- Sesión individual (45-50 min), particular: $32.500–$78.000
- Sesión de pareja: $58.500–$104.000
- Sesión a domicilio: recargo sobre el valor de consulta estándar

INGENIERO
- Consulta/informe técnico puntual (estructural, instalaciones): $104.000–$390.000
- Informe o certificación formal con firma profesional (honorario mínimo
  de colegio profesional): desde $650.000
- Trabajos de mayor escala (proyecto industrial, cálculo estructural grande):
  cotizar aparte, escalan fuerte con la complejidad

PARA CUALQUIER SERVICIO NO LISTADO ARRIBA: no inventes un número al voleo.
Razoná por analogía usando complejidad + PRECIO_MINIMO como piso: una changa o
arreglo puntual ronda $19.500-$78.000, un trabajo de mediana complejidad
$78.000-$234.000, un proyecto grande o con entregable profesional (balance,
diseño de marca completo, sitio web, informe técnico firmado) $234.000-$780.000+.
`.trim();

function normalizarPrecios(resultado) {
    let { precioSugerido } = resultado;
    precioSugerido = Number(precioSugerido);

    if (!Number.isFinite(precioSugerido)) return null;

  precioSugerido = Math.round(precioSugerido * 1.6);
const precioMin = Math.round(precioSugerido * 0.8);
const precioMax = Math.round(precioSugerido * 1.2);

return { precioMin, precioMax, precioSugerido };
}

// Normaliza una lista de opciones/chips: siempre array de strings cortos.
function normalizarOpciones(valor) {
    if (!Array.isArray(valor)) return [];
    return valor
        .map((op) => (typeof op === "string" ? op.trim() : ""))
        .filter((op) => op.length > 0 && op.length <= 40)
        .slice(0, 4);
}

// Normaliza "preguntas": tiene que quedar como un array (0 a 3) de objetos
// { pregunta: string, opciones: string[] }. Si el modelo manda cualquier
// otra cosa (formato viejo, objetos incompletos, etc.), lo filtramos sin
// romper. Cada pregunta con 0 opciones válidas recibe un fallback ["No sé"].
function normalizarPreguntas(valor) {
    if (!Array.isArray(valor)) return [];
    return valor
        .map((p) => {
            if (!p || typeof p !== "object") return null;
            const pregunta = typeof p.pregunta === "string" ? p.pregunta.trim() : "";
            if (!pregunta) return null;
            let opciones = normalizarOpciones(p.opciones);
            if (opciones.length === 0) opciones = ["No sé"];
            return { pregunta, opciones };
        })
        .filter(Boolean)
        .slice(0, 3);
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

**REGLA CRÍTICA: CONSULTA/DIAGNÓSTICO vs. REPARACIÓN DIRECTA**
En casi todos los oficios (plomero, gasista, electricista, cerrajero, médico,
psicólogo, arquitecto, ingeniero, etc.) hay una diferencia GRANDE de precio entre:
  (a) una simple visita/consulta/diagnóstico — el profesional va, evalúa o
      revisa, y listo (precio bajo, ver "Visita/diagnóstico" o "Consulta" en
      la tabla de cada rubro), y
  (b) el trabajo de reparación/instalación/solución completo — mucho más caro.
Antes de cotizar, fijate qué pidió el cliente:
- Si el texto deja en claro que quiere que le SOLUCIONEN/ARREGLEN/INSTALEN algo
  puntual (ej: "se rompió la canilla, necesito que la cambien", "quiero que me
  instalen un termotanque"), cotizá directamente el precio de esa reparación
  o instalación específica, NO la visita.
- Si el texto deja en claro que solo quiere que alguien VAYA A VER, REVISE,
  DIAGNOSTIQUE o LE DIGA QUÉ TIENE, sin pedir explícitamente la solución
  (ej: "no sé qué le pasa a la heladera, quiero que la revisen", "necesito
  un diagnóstico"), cotizá el precio de "Visita/diagnóstico" o "Consulta",
  que es mucho más bajo.
- Si el texto es AMBIGUO en este punto — no se sabe si el cliente ya quiere
  la solución final o solo una revisión previa — y esto cambiaría el precio
  de forma significativa (más del doble entre ambas opciones), esta es una
  pregunta PRIORITARIA para incluir en "preguntas": algo como "¿Querés que
  vayan a diagnosticar el problema, o ya sabés qué hay que hacer y querés
  cotizar la reparación/instalación directamente?".
- Si ya hay una aclaración en el texto que resuelve esto (aunque sea con
  otras palabras), no vuelvas a preguntarlo: usá esa info para elegir el
  precio correcto.

**REGLA CRÍTICA: PLAZO/FECHA LÍMITE ELEGIDO POR EL CLIENTE**
El texto del cliente puede incluir una sección "— Urgencia según plazo elegido: ...".
Ese dato NO lo escribió el cliente a mano: se calculó automáticamente a partir
de la fecha y hora exacta que el cliente eligió con un selector de calendario,
comparándola contra el momento actual. Vas a recibir directamente la categoría
de urgencia ya calculada (por ejemplo "Muy urgente, dentro de las próximas 12hs",
"Mañana o en las próximas 48hs", "Dentro de esta semana" o "Sin apuro, más de
una semana"), y opcionalmente la fecha/hora exacta entre paréntesis a modo de
referencia. Usala así:
- Si la categoría indica urgencia MUY inmediata (dentro de las próximas 12 a
  24hs, especialmente si cae en horario nocturno o fin de semana): aplicá el
  mismo recargo de urgencia nocturna/fin de semana que ya figura en la tabla de
  precios (+30% a +80%) sobre el precio base del rubro correspondiente.
- Si la categoría es "mañana o en las próximas 48hs": aplicá un recargo menor
  y opcional, solo si además cae en horario nocturno/fin de semana/feriado.
- Si la categoría es "dentro de esta semana" o "sin apuro": NO apliques ningún
  recargo por plazo, cotizá el precio normal de la tabla.
- Este dato NO determina el campo "emergencia": "emergencia" depende de la
  regla específica de abajo, sin importar el plazo que haya elegido el cliente.
- Si no hay ninguna sección "— Urgencia según plazo elegido: ..." en el texto,
  asumí que no hay apuro particular y cotizá el precio normal.
- Nunca le preguntes al cliente por el plazo/fecha: ese dato se pide con un
  selector en la pantalla, no es algo que tengas que preguntar en "preguntas".

**REGLA CRÍTICA: EMERGENCIA DECLARADA POR EL CLIENTE (ANTES DEL ANÁLISIS)**
El texto del cliente puede incluir una sección "— Emergencia: ...". Esto
significa que el cliente marcó explícitamente, con un botón en la pantalla,
que este pedido es una emergencia — ANTES de que vos analices nada. No es
algo que tengas que inferir vos, ni algo que tengas que volver a preguntar
(el plazo, en este caso, ya viene forzado a "hoy mismo" también).
- Si aparece esta sección: seteá "emergencia": true en tu respuesta.
- Aplicá un recargo del 32,5% sobre el precio que le corresponde a este
  trabajo (multiplicá ese precio base por 1.325), SALVO que el rubro o la
  situación descripta ya tenga su propio recargo de emergencia indicado
  explícitamente en la tabla de PRECIOS DE REFERENCIA de arriba (por ejemplo
  "Fuga de gas activa = EMERGENCIA: cotizar en el techo o por encima" o
  "Corte de luz total = EMERGENCIA: priorizar el techo del rango"). En esos
  casos puntuales, con cotizar en el techo (o por encima) del rango ya
  alcanza: NO sumes además el 32,5% extra, para no aplicar el recargo de
  emergencia dos veces sobre el mismo trabajo.
- Este recargo del 32,5% es independiente del recargo por urgencia de plazo
  (nocturno/fin de semana/feriado) de la regla anterior: si corresponden los
  dos a la vez, podés aplicar ambos, pero usá el criterio para que el precio
  final tenga sentido y no se dispare de forma desproporcionada.
- Si NO aparece la sección "— Emergencia: ...", "emergencia" solo puede ser
  true si vos detectás por tu cuenta pérdida de agua activa, corte de luz
  total, o riesgo estructural inmediato en la descripción del cliente (ver
  regla de "LO QUE TENÉS QUE DEVOLVER", punto 3).
- Nunca le preguntes al cliente si es una emergencia: ese dato ya se decidió
  con un botón en la pantalla antes de llegar a vos.

**REGLA CRÍTICA SOBRE ACLARACIONES — LEÉ ESTO PRIMERO:**
El texto del cliente puede incluir una o más secciones "— Aclaración: ...", que son
respuestas que el cliente YA DIO a preguntas anteriores (pueden venir varias
preguntas y respuestas juntas, separadas por "|"). Antes de generar preguntas
nuevas, releé TODO el texto del cliente (descripción original + TODAS las
aclaraciones) y verificá si el dato que estás a punto de pedir ya está ahí,
aunque esté con otras palabras o en otro orden.
- Ejemplo: si el texto dice "...hornito eléctrico... — Aclaración: es eléctrico",
  el tipo de horno YA ESTÁ RESPONDIDO. NO vuelvas a preguntarlo.
- Si ya hay al menos UNA tanda de aclaraciones en el texto y todavía falta un
  dato menor, preferí no volver a preguntar: elegí el servicio más cercano
  posible con lo que hay, marcá "necesitaAclaracion": false, "preguntas": [],
  y poné el dato faltante en "notas". Solo repreguntá si es literalmente
  imposible clasificar o cotizar sin ese dato.
- Nunca repitas una pregunta igual o muy similar a algo que el cliente ya
  contestó antes.
- SI ALGUNA RESPUESTA DEL CLIENTE ES DEL TIPO "no sé", "no tengo idea", "ni
  idea", "no sabría decirte", "no sé explicarlo", "no entiendo la pregunta",
  o cualquier variante que indique que no puede dar ese dato puntual: no
  insistas con otra pregunta relacionada a ESE MISMO dato, elegí el servicio
  más cercano posible con lo que ya tenés, y poné en "notas" que falta
  precisar eso.

**REGLA CRÍTICA: AGRUPÁ LAS PREGUNTAS, NO PREGUNTES DE A UNA**
Si te faltan VARIOS datos independientes para clasificar o cotizar bien (por
ejemplo: tipo de problema + ambiente + urgencia), no preguntes uno por vez.
Agrupá hasta 2 o 3 preguntas juntas en el array "preguntas", para que el
cliente las responda todas de una sola vez y no tengas que ir de a poco.
- Preferí SIEMPRE la tanda más chica posible que resuelva la ambigüedad: si
  con 1 pregunta alcanza, mandá solo 1. Nunca mandes una pregunta "de relleno"
  solo para completar el cupo de 2 o 3.
- Máximo 3 preguntas por tanda.
- Cada pregunta tiene que ser sobre un dato DISTINTO e independiente de las
  demás (no repitas el mismo eje con otras palabras).
- No preguntes por el plazo/fecha límite ni por si es una emergencia: esos
  dos datos ya vienen resueltos por los selectores/botones de la pantalla
  antes de analizar, nunca son parte de "preguntas".

**LO QUE TENÉS QUE DEVOLVER:**

1. "descripcionMejorada": reescribí el pedido del cliente en español neutro
   rioplatense, claro y completo, integrando la descripción original y todas
   las aclaraciones en un solo texto coherente. SIN inventar datos que el
   cliente no dio.

2. "servicioId": el id EXACTO de la lista de arriba que mejor corresponde.
   Si ninguno corresponde bien, elegí el más cercano posible.

3. "emergencia": true si el texto incluye la sección "— Emergencia: ..." (el
   cliente ya lo marcó explícitamente antes del análisis), O si detectás por
   tu cuenta pérdida de agua activa, corte de luz total, o riesgo estructural
   inmediato en la descripción. false en cualquier otro caso.

4. "complejidad": "simple" | "media" | "compleja"

5. "confianza":
   - "alta": descripción clara y completa, podés cotizar con precisión
   - "media": falta algún dato relevante pero podés estimar igual
   - "baja": descripción demasiado vaga, ambigua o sin sentido para el rubro

6. "necesitaAclaracion": true SOLO si te falta al menos un dato imprescindible
   para clasificar o cotizar bien Y ese dato NO aparece ya en el texto
   (incluyendo aclaraciones previas). false si el cliente ya dijo que no
   sabe, no puede dar más detalles, o si ya respondió aclaraciones antes y
   no queda nada crítico por preguntar — en esos casos elegí el servicio más
   cercano posible y procedé sin preguntar más.

7. "preguntas": si necesitaAclaracion es true, un array de 1 a 3 objetos,
   cada uno con:
     - "pregunta": una pregunta corta y concreta, que NO repita algo ya
       contestado. Ejemplos: "¿La pérdida es en una canilla, un caño o el
       inodoro?", "¿En qué ambiente necesitás la pintura?".
     - "opciones": un array de 2 a 4 respuestas MUY cortas (2-4 palabras)
       para que el cliente pueda TOCAR UN BOTÓN en vez de escribir, cubriendo
       las respuestas más probables a esa pregunta puntual. Si "no sé" es una
       respuesta probable, incluila como opción ("No sé").
   Ejemplo de una tanda con 2 preguntas independientes:
   [
     { "pregunta": "¿Querés que vayan a diagnosticar el problema, o ya sabés
        qué hay que hacer?", "opciones": ["Ya sé qué necesito", "Que lo revisen primero", "No sé"] },
     { "pregunta": "¿La pérdida es en una canilla, un caño o el inodoro?",
       "opciones": ["En la canilla", "En un caño", "En el inodoro", "No sé"] }
   ]
   Si necesitaAclaracion es false, dejá este campo como array vacío [].

8. "notas": info que falta para cotizar bien pero no impide clasificar.
   Si no falta nada importante, dejalo vacío "".

9. "precioSugerido": estimá UN SOLO precio en ARS según el mercado argentino
   para este trabajo específico, usando la tabla de PRECIOS DE REFERENCIA de
   arriba como ancla, y aplicando el recargo de emergencia (1.325x) y/o de
   urgencia de plazo cuando corresponda según las reglas de arriba. Nunca
   menos de ${PRECIO_MINIMO} ARS. Variá el precio según la complejidad, la
   urgencia y lo que describió el cliente.

**RESPONDÉ SOLO JSON, SIN MARKDOWN, SIN TEXTO ADICIONAL:**
{
  "descripcionMejorada": "<string>",
  "servicioId": <number>,
  "emergencia": <boolean>,
  "complejidad": "<simple|media|compleja>",
  "confianza": "<alta|media|baja>",
  "necesitaAclaracion": <boolean>,
  "preguntas": [
    { "pregunta": "<string>", "opciones": ["<string>", "..."] }
  ],
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

    // Siempre dejamos "preguntas" como array válido de { pregunta, opciones }.
    resultado.preguntas = normalizarPreguntas(resultado.preguntas);

    // Mantenemos "necesitaAclaracion" consistente con si hay o no preguntas:
    // si el modelo dijo que sí pero no mandó ninguna pregunta usable, le
    // damos un fallback genérico para que el usuario pueda avanzar igual.
    if (resultado.necesitaAclaracion && resultado.preguntas.length === 0) {
        resultado.preguntas = [
            { pregunta: "¿Podés dar más detalles sobre lo que necesitás?", opciones: ["No sé"] },
        ];
    }
    // Si el modelo dijo que NO hace falta aclaración pero igual mandó
    // preguntas, respetamos su decisión final (false) y las descartamos.
    if (!resultado.necesitaAclaracion) {
        resultado.preguntas = [];
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
        if (resultado.preguntas.length === 0) {
            resultado.preguntas = [
                { pregunta: "¿Podés dar más detalles sobre lo que necesitás?", opciones: ["No sé"] },
            ];
        }
    }

    console.log(`✅ Resultado final:`, resultado);
    return resultado;
}