// src/services-ia/aiProvider.js
//
// Punto único de contacto con el modelo de IA.
// Si mañana cambiás de proveedor (Gemini, OpenAI, Ollama propio), solo
// tocás este archivo: el resto de la app llama a `generarJSON(...)`.

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<object>}
 */
export async function generarJSON(systemPrompt, userPrompt) {
    const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    try {
        return JSON.parse(raw);
    } catch (err) {
        throw new Error(`La IA devolvió un JSON inválido: ${raw}`);
    }
}