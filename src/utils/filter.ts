import { blacklist } from "../filters/blacklist.ts";
import { stopwords_pt } from "../filters/stopwords/stopwords_pt.ts";
import { stopwords_en } from "../filters/stopwords/stopwords_en.ts";

// Create regexes for each word in the blacklist
const blacklistRegexes = Array.from(blacklist).map(word => {
    const regexString = word.replace(/\*/g, '.*').replace(/\+/g, '.+');
    return new RegExp(`^${regexString}$`, 'i');
});

// Filter out sentences that have less than 2 words, more than 3 words, repeated words, hashtags or blacklisted words
function filterSentences(sentences: string[]): string[] {
    return sentences.filter(sentence => {
        const words = sentence.split(" ");
        const uniqueWords = new Set(words);
        const hasHashtags = words.some(word => word.startsWith("#"));
        const hasBlacklistedWords = words.some(word => blacklistRegexes.some(regex => regex.test(word.toLowerCase())));
        return words.length >= 2 && words.length <= 3 && uniqueWords.size === words.length && !hasHashtags && !hasBlacklistedWords;
    });
}

// Filter out words that are stopwords, hashtags, blacklisted, have less than 2 characters, or are composed of multiple words
function filterWords(words: string[], _lang: string): string[] {
    return words.filter(word => {
        const isHashtag = word.startsWith("#");
        const lowerCaseWord = word.toLowerCase().replace(/^#/, '');
        const isBlacklisted = blacklistRegexes.some(regex => regex.test(lowerCaseWord));
        const hasMoreThanOneChar = lowerCaseWord.length > 1;
        const isOneWordOnly = lowerCaseWord.split(" ").length === 1;

        const stopwordsUnified = new Set([...stopwords_pt, ...stopwords_en]);

        const hasStopword = stopwordsUnified.has(lowerCaseWord);

        const isValidWord = hasMoreThanOneChar && isOneWordOnly && (!hasStopword || isHashtag) && !isBlacklisted;
        return isValidWord;
    });
}

export { filterSentences, filterWords };