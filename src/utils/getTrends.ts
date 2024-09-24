import { getTopWords, getTopPhrases } from "../processing/countMinSketch.ts";

export function getTrendingTopics(limit: number = 10) {
    // Função auxiliar para pegar os itens mais frequentes de um sketc

    const topWords = getTopWords(limit);
    const topPhrases = getTopPhrases(limit);

    return {
        words: topWords,
        phrases: topPhrases,
    };
}
