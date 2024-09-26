import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import  contextPrompt  from '../assets/contextPrompt.js';
import { load } from "https://deno.land/std@0.214.0/dotenv/mod.ts";

const env = await load();

const key = env['GOOGLE_API_KEY'] || Deno.env.get('GOOGLE_API_KEY');
const allowedCategories = ["science", "music", "politics", "entertainment", "sports", "technology", "health", "none", "lgbt", "economy", "education", "environment", "food", "lifestyle", "religion", "social", "travel"];

if(!key) {
    console.error("API Key not found");
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
    console.error("Error loading model: ", error);
}

/**
 * Classify the given topics
 * @param {Array} topics - List of topics to classify
 * @returns {Array} - List of categories for each topic
 */
async function classifyText(topics) {
    const data = {
        prompt: topics
    }

    let result = '';
    try {
        result = await model.generateContent(JSON.stringify(data));
    } catch (error) {
        console.error("Error generating content: ", error);
    }

    let categories = topics.map(() => 'none');

    try {
        if(result === '') {
            return categories;
        }

        categories = JSON.parse(result.response.text().replace(/```json|```|\*\*/g, "")).categories;
        categories = categories.map((category) => {
            if(!allowedCategories.includes(category)) {
                return 'none';
            }
            return category;
        });
    } catch (error) {
        console.error("Error parsing result: ", error);
    }

    return categories;
}

export { classifyText };


