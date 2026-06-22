// src/services-ia/aiProvider.js

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-2.5-flash";

export async function generarJSON(systemPrompt, userPrompt) {
    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.4,
                responseMimeType: "application/json",
            },
        });

        const raw = response.text ?? "{}";

        try {
            return JSON.parse(raw);
        } catch {
            throw new Error(`La IA devolvió un JSON inválido: ${raw}`);
        }
    } catch (err) {
        throw new Error(`Error llamando a Gemini: ${err.message}`, {
            cause: err,
        });
    }
}