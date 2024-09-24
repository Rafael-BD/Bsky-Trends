import { blacklist_pt } from "./blacklist_pt.ts";
import { stopwords_pt } from "./stopwords_pt.ts";

const blacklistRegexes = Array.from(blacklist_pt).map(word => {
    const regexString = word.replace(/\*/g, '.*').replace(/\+/g, '.+');
    return new RegExp(`^${regexString}$`, 'i');
});

// Filter sentences to remove sentences that have duplicate words, sentences with less than 2 words or more than 3 words, words that are hashtags, or words in the blacklist
function filterSentences(sentences: string[]): string[] {
    return sentences.filter(sentence => {
        const words = sentence.split(" ");
        const uniqueWords = new Set(words);
        const hasHashtags = words.some(word => word.startsWith("#"));
        const hasBlacklistedWords = words.some(word => blacklistRegexes.some(regex => regex.test(word.toLowerCase())));
        return words.length >= 2 && words.length <= 3 && uniqueWords.size === words.length && !hasHashtags && !hasBlacklistedWords;
    });
}

function filterWords(words: string[]): string[] {
    return words.filter(word => {
        const lowerCaseWord = word.toLowerCase().replace(/^#/, '');
        const isBlacklisted = blacklistRegexes.some(regex => regex.test(lowerCaseWord));
        return !isBlacklisted && !stopwords_pt.has(lowerCaseWord);
    });
}

export { filterSentences, filterWords };