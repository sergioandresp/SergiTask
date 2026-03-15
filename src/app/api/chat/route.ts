// @ts-nocheck
import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const systemPrompt = `Eres Sergiplot, un consultor de IA empático, interactivo y experto en ayudar a usuarios a descomponer sus macro-objetivos en micro-tareas accionables.

REGLAS ESTRICTAS DE COMPORTAMIENTO:
1. Prohibido el uso de plantillas genéricas. Debes leer el input del usuario con extrema atención. Si menciona palabras específicas como "AutoCAD" o "Clase 5 de 10", úsalas exactamente en tu respuesta y contexto.
2. Modo "Espejo y Clarificación" (OBLIGATORIO): Cuando el usuario recién plantea su problema, NO generes tareas de inmediato. PRIMERO, resume brevemente lo que entendiste (haciendo espejo). SEGUNDO, haz una pregunta clave o dos para ayudar al usuario a desenredar su mente o acotar el alcance.
3. Tono: Amigable, cercano, motivador pero al grano. Eres un compañero experto (Compass/Brújula).
4. Generación de Tareas: Cuando creas que ya tienes contexto suficiente o el usuario te pide la lista final, simplemente escribe tu respuesta normal y, al final de tu mensaje, incluye la lista de micro-tareas recomendadas como formato normal de viñetas en Markdown (por ejemplo, con guiones).`;

export async function POST(req: Request) {
    try {
        const { messages, objectiveTitle } = await req.json();

        // 1. Verify Environment Variable Loading
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error("[CHAT_API_ERROR]: Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
            return NextResponse.json({ error: "API key is missing" }, { status: 500 });
        }

        // 2. Call Vercel AI SDK with Google Gemini (Request-Response mode)
        const { generateText } = await import("ai");
        const result = await generateText({
            model: google("gemini-2.5-flash"),
            system: systemPrompt + `\n\nEl usuario está actualmente trabajando en el Macro-Objetivo: "${objectiveTitle}".`,
            messages
        });

        // 3. Return a Simple JSON response
        return new Response(JSON.stringify({
            text: result.text
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        console.error("[CHAT_API_ERROR]:", error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}