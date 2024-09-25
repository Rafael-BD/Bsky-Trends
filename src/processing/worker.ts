// deno-lint-ignore-file no-explicit-any
import { filterSentences, filterWords } from "../filters/filter.ts";
import { extractSentences } from "../processing/sentences.ts";
import { extractWords } from "../processing/words.ts";
import { extractHashtags } from "../processing/hashtags.ts";
import { updateSketches, updateGlobalSketch } from "../processing/countMinSketch.ts";
import { stopwords_pt } from "../filters/stopwords/stopwords_pt.ts";
import { preProcessText } from "../utils/preProcess.ts";
(self as any).onmessage = (event: MessageEvent) => {
    const { type, payload, date } = event.data;

    if (type === 'processPost') {
        const { text, lang } = payload;

        const processedText = preProcessText(text.trim());

        if (lang === 'pt') {
            if (processedText.split(" ").every((word: string) => stopwords_pt.has(word))) return;
            const phrases = filterSentences(extractSentences(processedText));
            const words = filterWords(extractWords(processedText), 'pt');
            const hashtags = filterWords(extractHashtags(processedText), 'pt');
            updateSketches({ words, phrases, hashtags }, new Date(date));
        } 
        else {
            if (processedText.split(" ").every((word: string) => stopwords_pt.has(word))) return;
                const words = filterWords(extractWords(processedText), 'global');
                updateGlobalSketch({ words }, new Date(date));
        }
    }
};
