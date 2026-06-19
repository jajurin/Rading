// src/services-ia/aiProvider.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL = "gemini-2.5-flash"; // modelo vigente (gemini-1.5 está dado de baja)

export async function generarJSON(systemPrompt, userPrompt) {
    const model = genAI.getGenerativeModel({
        model: MODEL,
        systemInstruction: systemPrompt,
        generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
        },
    });

    let result;
    try {
        result = await model.generateContent(userPrompt);
    } catch (err) {
        throw new Error(`Error llamando a Gemini: ${err.message}`);
    }

    const raw = result.response.text() ?? "{}";

    try {
        return JSON.parse(raw);
    } catch (err) {
        throw new Error(`La IA devolvió un JSON inválido: ${raw}`);
    }
}