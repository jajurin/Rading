        // src/services-ia/aiProvider.js

        import OpenAI from "openai";

        const MODEL = "accounts/fireworks/models/minimax-m3";
        const BASE_URL = "https://api.fireworks.ai/inference/v1";
        const MAX_REINTENTOS_POR_KEY = 3; // reintentos ante error transitorio (503, etc.)
        const ESPERA_BASE_MS = 1000; // 1s, luego 2s, luego 4s...

        function getApiKeys() {
            const keys = [];

            if (process.env.FIREWORKS_API_KEY) {
                keys.push(process.env.FIREWORKS_API_KEY);
            }

            let i = 1;
            while (process.env[`FIREWORKS_API_KEY_BACKUP_${i}`]) {
                keys.push(process.env[`FIREWORKS_API_KEY_BACKUP_${i}`]);
                i++;
            }

            if (keys.length === 0) {
                throw new Error("No se configuró ninguna FIREWORKS_API_KEY.");
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
                msg.includes("invalid api key") ||
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
                status === 502 ||
                status === 504 ||
                msg.includes("unavailable") ||
                msg.includes("high demand") ||
                msg.includes("overloaded") ||
                msg.includes("timeout")
            );
        }

        function sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        export async function generarJSON(systemPrompt, userPrompt) {
            let lastError;

            for (let idx = 0; idx < API_KEYS.length; idx++) {
                const apiKey = API_KEYS[idx];
                const client = new OpenAI({ apiKey, baseURL: BASE_URL });

                for (let intento = 0; intento < MAX_REINTENTOS_POR_KEY; intento++) {
                    try {
                        const response = await client.chat.completions.create({
                            model: MODEL,
                            temperature: 0.4,
                            response_format: { type: "json_object" },
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt },
                            ],
                        });

                        const raw = response.choices?.[0]?.message?.content ?? "{}";

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
                            console.warn(`[aiProvider] Key #${idx + 1} falló: ${err.message}. Probando siguiente key...`);
                            break; // sale del loop de reintentos, pasa a la siguiente key
                        }

                        // Caso 3: se acabaron los reintentos Y las keys, o error no recuperable (ej: JSON inválido)
                        throw new Error(`Error llamando a Fireworks/MiniMax-M3: ${err.message}`, {
                            cause: err,
                        });
                    }
                }
            }

            throw new Error(`Error llamando a Fireworks/MiniMax-M3: ${lastError?.message}`, {
                cause: lastError,
            });
        }