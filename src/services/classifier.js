import { GoogleGenerativeAI } from '@google/generative-ai';
import contextPrompt from '../assets/contextPrompt.js';
import 'dotenv/config';

const key = process.env.GOOGLE_API_KEY;
const allowedCategories = ["science", "music", "politics", "entertainment", "sports", "technology", "health", "none", "economy", "food", "lifestyle", "TV", "movies", "games", "books", "celebrities", "art", "geek"];


let genAI = null;
let model = null;

try {
    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: contextPrompt
    });
} catch (error) {
    console.warn("Gemini model not loaded: ", error);
}

/**
 * Classify the given topics
 * @param {Array} topics - List of topics to classify
 * @returns {Promise<Array>} - Promise that resolves to a list of categories for each topic
 */
function classifyText(topics) {
    return new Promise(async (resolve) => {
        if(!key || !model || !genAI) {
            console.warn("Model not loaded");
            return resolve(topics.map(() => 'none'));
        }
        const data = {
            prompt: topics
        }

        await model.generateContent(JSON.stringify(data))
            .then(result => {
                let categories = topics.map(() => 'none');

                if (result === '') {
                    return resolve(categories);
                }

                try {
                    categories = JSON.parse(result.response.text().replace(/```json|```|\*\*/g, "")).categories;
                    categories = categories.map((category) => {
                        if (!allowedCategories.includes(category)) {
                            return 'none';
                        }
                        return category;
                    });
                } catch (error) {
                    console.error("Error parsing result: ", error);
                    return resolve(categories);
                }

                resolve(categories);
            })
            .catch(error => {
                console.error("Error generating content: ", error);
                resolve(topics.map(() => 'none'));
            });
    });
}

export { classifyText };
