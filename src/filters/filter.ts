import { blacklist } from "./blacklist.ts";
import { stopwords_pt } from "./stopwords/stopwords_pt.ts";
import { stopwords_en } from "./stopwords/stopwords_en.ts";

const blacklistRegexes = Array.from(blacklist).map(word => {
    const regexString = word.replace(/\*/g, '.*').replace(/\+/g, '.+');
    return new RegExp(`^${regexString}$`, 'i');
});


function filterSentences(sentences: string[]): string[] {
    return sentences.filter(sentence => {
        const words = sentence.split(" ");
        const uniqueWords = new Set(words);
        const hasHashtags = words.some(word => word.startsWith("#"));
        const hasBlacklistedWords = words.some(word => blacklistRegexes.some(regex => regex.test(word.toLowerCase())));
        return words.length >= 2 && words.length <= 3 && uniqueWords.size === words.length && !hasHashtags && !hasBlacklistedWords;
    });
}

function filterWords(words: string[], lang: string): string[] {
    return words.filter(word => {
        const lowerCaseWord = word.toLowerCase().replace(/^#/, '');
        const isBlacklisted = blacklistRegexes.some(regex => regex.test(lowerCaseWord));
        const hasMoreThanOneChar = lowerCaseWord.length > 1;
        const isOneWordOnly = lowerCaseWord.split(" ").length === 1;

        let hasStopword = false;
        switch (lang) {
            case 'pt':
                hasStopword = stopwords_pt.has(lowerCaseWord);
                break;
            case 'en':
                hasStopword = stopwords_en.has(lowerCaseWord);
                break
            default:
                hasStopword = stopwords_pt.has(lowerCaseWord) || stopwords_en.has(lowerCaseWord);
                break;
        }

        const isValidWord = hasMoreThanOneChar && isOneWordOnly && !hasStopword && !isBlacklisted;
        return isValidWord;
    });
}

export { filterSentences, filterWords };