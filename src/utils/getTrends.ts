import { getTopWords, getTopPhrases, getTopGlobalWords, getTopHashtags } from "../processing/countMinSketch.ts";

export function getTrendingTopics(limit: number = 3) {
    // Função auxiliar para pegar os itens mais frequentes de um sketc

    const topWords = getTopWords(limit);
    const topPhrases = getTopPhrases(limit);
    const topHashtags = getTopHashtags(limit);
    const topGlobalWords = getTopGlobalWords(limit);

    return {
        words: topWords,
        phrases: topPhrases,
        hashtags: topHashtags,
        globalWords: topGlobalWords
    };
}
