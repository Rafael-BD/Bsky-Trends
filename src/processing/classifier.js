import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import  contextPrompt  from '../assets/contextPrompt.js';
import { load } from "https://deno.land/std@0.214.0/dotenv/mod.ts";

const env = await load();

const key = env['GOOGLE_API_KEY'] || Deno.env.get('GOOGLE_API_KEY');
if(!key) {
    console.error("Chave de API do Google não encontrada");
}

const genAI = new GoogleGenerativeAI(key);
let model = null;

try {
    model = genAI.getGenerativeModel({
        model: 'models/gemini-1.5-flash',
        systemInstruction: contextPrompt
    });
}
catch (error) {
    console.error("Erro ao iniciar o chat com o assistente: ", error);
}

async function classifyText(topics) {
    const data = {
        prompt: topics
    }

    let result = '';
    try {
        result = await model.generateContent(JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao gerar conteudo: ", error);
    }

    let categories = topics.map(() => 'none');

    try {
        if(result === '') {
            return categories;
        }

        categories = JSON.parse(result.response.text().replace(/```json|```|\*\*/g, "")).categories;
    } catch (error) {
        console.error("Erro ao classificar texto: ", error);
    }

    return categories;
}

export { classifyText };


