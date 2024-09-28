import { getTopWords, getTopPhrases, getTopGlobalWords, getTopHashtags } from "../trends/ngrams.ts";
import { classifyText } from "../services/classifier.js";
import { saveTrend } from "../services/saveTrends.ts";

export async function getTrendingTopics(limit: number = 10, lang: string = 'pt', minCount: number = 5) {
    // Calculate limits for each type of topic 
    const wordLimit = Math.floor(limit * 0.4); // 40% of the limit
    const phraseLimit = Math.floor(limit * 0.2); // 20% of the limit
    const hashtagLimit = Math.floor(limit * 0.3); // 30% of the limit
    const globalWordLimit = limit - wordLimit - phraseLimit - hashtagLimit; // 10% of the limit

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Function to get top topics with retries
    async function getTopTopicsWithRetries(retries: number = 3, delay: number = 10000) {
        for (let attempt = 0; attempt < retries; attempt++) {
            const topWords = getTopWords(wordLimit, lang as 'pt' | 'en');
            const topPhrases = getTopPhrases(phraseLimit, lang as 'pt' | 'en');
            const topHashtags = getTopHashtags(hashtagLimit, lang as 'pt' | 'en');
            const topGlobalWords = getTopGlobalWords(globalWordLimit * 2, lang as 'pt' | 'en');

            // Check if all arrays are not empty
            if (topWords.length >= minCount || topPhrases.length >= minCount || topHashtags.length >= minCount || topGlobalWords.length >= minCount) {
                return { topWords, topPhrases, topHashtags, topGlobalWords };
            }

            console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay / 1000} seconds...`);
            await wait(delay);
        }

        return { topWords: [], topPhrases: [], topHashtags: [], topGlobalWords: [] };
    }

    // Get top topics with retries
    const { topWords, topPhrases, topHashtags, topGlobalWords } = await getTopTopicsWithRetries();

    // Filter out topGlobalWords that are already in topWords
    const filteredTopGlobalWords = topGlobalWords.filter(globalWord => 
        !topWords.some(word => word.item.toLowerCase() === globalWord.item.toLowerCase())
    ).slice(0, globalWordLimit);

    // Combine all topics into one array
    const allTopics = [
        ...topWords.map(word => ({ type: 'word', ...word })),
        ...topPhrases.map(phrase => ({ type: 'phrase', ...phrase })),
        ...topHashtags.map(hashtag => ({ type: 'hashtag', ...hashtag })),
        ...filteredTopGlobalWords.map(word => ({ type: 'globalWord', ...word }))
    ];

    // Filter topics with count greater than minCount 
    const filteredTopics = allTopics.filter(topic => topic.count > minCount);

    // Classify all topics
    const topics = filteredTopics.map(topic => topic.item);
    const classifications = await classifyText(topics);
    const classifiedTopics = filteredTopics.map((topic, index) => ({
        ...topic,
        classification: classifications[index]
    }));

    // Separate topics back into their respective categories
    const topWordClassified = classifiedTopics.filter(topic => topic.type === 'word').map(topic => ({
        topic: topic.item,
        category: topic.classification || 'none',
        count: topic.count
    }));
    const topPhraseClassified = classifiedTopics.filter(topic => topic.type === 'phrase').map(topic => ({
        topic: topic.item,
        category: topic.classification || 'none',
        count: topic.count
    }));
    const topHashtagsClassified = classifiedTopics.filter(topic => topic.type === 'hashtag').map(topic => ({
        topic: topic.item,
        category: topic.classification || 'none',
        count: topic.count
    }));
    const topGlobalWordsClassified = classifiedTopics.filter(topic => topic.type === 'globalWord').map(topic => ({
        topic: topic.item,
        category: topic.classification || 'none',
        count: topic.count
    }));

    const res = {
        words: topWordClassified,
        phrases: topPhraseClassified,
        hashtags: topHashtagsClassified,
        globalWords: topGlobalWordsClassified,
    };

    // Save trends to the database
    await saveTrend(res, lang);

    return res;
}