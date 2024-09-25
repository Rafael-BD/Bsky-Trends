import { getTopWords, getTopPhrases, getTopGlobalWords, getTopHashtags } from "../processing/countMinSketch.ts";
import { classifyText } from "../processing/classifier.js";

export async function getTrendingTopics(limit: number = 10) {
    const wordLimit = Math.floor(limit * 0.3);
    const phraseLimit = Math.floor(limit * 0.2);
    const hashtagLimit = Math.floor(limit * 0.3);
    const globalWordLimit = limit - wordLimit - phraseLimit - hashtagLimit;

    const topWords = getTopWords(wordLimit);
    const topPhrases = getTopPhrases(phraseLimit);
    const topHashtags = getTopHashtags(hashtagLimit);
    const topGlobalWords = getTopGlobalWords(globalWordLimit * 2);

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

    // Classify all topics
    const topics = allTopics.map(topic => topic.item);
    const classifications = await classifyText(topics);
    const classifiedTopics = allTopics.map((topic, index) => ({
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

    return {
        words: topWordClassified,
        phrases: topPhraseClassified,
        hashtags: topHashtagsClassified,
        globalWords: topGlobalWordsClassified
    };
}