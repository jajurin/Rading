// src/services-ia/aiProvider.js

import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash-lite";
const MAX_REINTENTOS_POR_KEY = 3; // reintentos ante error transitorio (503, etc.)
const ESPERA_BASE_MS = 1000; // 1s, luego 2s, luego 4s...

function getApiKeys() {
    const keys = [];

    if (process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }

    let i = 1;
    while (process.env[`GEMINI_API_KEY_BACKUP_${i}`]) {
        keys.push(process.env[`GEMINI_API_KEY_BACKUP_${i}`]);
        i++;
    }

    if (keys.length === 0) {
        throw new Error("No se configuró ninguna GEMINI_API_KEY.");
    }

    return keys;
}

const API_KEYS = getApiKeys();

function getStatus(err) {
    return err?.status ?? err?.response?.status ?? null;
}

// Error de cuota/permisos -> cambiar de KEY tiene sentido
function esErrorDeKeyInvalidaOAgotada(err) {
    const status = getStatus(err);
    const msg = (err?.message ?? "").toLowerCase();

    return (
        status === 429 ||
        status === 403 ||
        status === 401 ||
        msg.includes("quota") ||
        msg.includes("api key not valid") ||
        msg.includes("permission")
    );
}

// Error transitorio del servidor -> reintentar con la MISMA key tiene sentido
function esErrorTransitorio(err) {
    const status = getStatus(err);
    const msg = (err?.message ?? "").toLowerCase();

    return (
        status === 503 ||
        status === 500 ||
        status === 429 || // rate limit por minuto también conviene esperar un toque
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded")
    );
}

function esCuotaDiariaAgotada(err) {
    const msg = err?.message ?? "";
    return msg.includes("PerDay") || msg.includes("generate_content_free_tier_requests");
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generarJSON(systemPrompt, userPrompt) {
    let lastError;

    for (let idx = 0; idx < API_KEYS.length; idx++) {
        const apiKey = API_KEYS[idx];
        const ai = new GoogleGenAI({ apiKey });

        for (let intento = 0; intento < MAX_REINTENTOS_POR_KEY; intento++) {
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
                    // JSON inválido no es error de red ni de key, no tiene sentido reintentar
                    throw new Error(`La IA devolvió un JSON inválido: ${raw}`);
                }
            } catch (err) {
                lastError = err;

                // Caso 1: error transitorio (503/500) -> reintentar la MISMA key con backoff
                if (esErrorTransitorio(err) && intento < MAX_REINTENTOS_POR_KEY - 1) {
                    const espera = ESPERA_BASE_MS * Math.pow(2, intento); // 1s, 2s, 4s...
                    console.warn(
                        `[aiProvider] Key #${idx + 1}, intento ${intento + 1} falló (${err.message}). Reintentando en ${espera}ms...`
                    );
                    await sleep(espera);
                    continue; // reintenta con la misma key
                }

                // Caso 2: cuota agotada o key inválida -> probar la SIGUIENTE key (sin esperar)
                const quedanKeys = idx < API_KEYS.length - 1;
                if (quedanKeys && esErrorDeKeyInvalidaOAgotada(err)) {
                    const motivo = esCuotaDiariaAgotada(err)
                        ? "cuota DIARIA agotada (se resetea en 24h)"
                        : err.message;
                    console.warn(`[aiProvider] Key #${idx + 1} falló: ${motivo}. Probando siguiente key...`);
                    break; // sale del loop de reintentos, pasa a la siguiente key
                }

                // Caso 3: se acabaron los reintentos Y las keys, o error no recuperable (ej: JSON inválido)
                throw new Error(`Error llamando a Gemini: ${err.message}`, {
                    cause: err,
                });
            }
        }
    }

    throw new Error(`Error llamando a Gemini: ${lastError?.message}`, {
        cause: lastError,
    });
}