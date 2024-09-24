import nlp from 'npm:compromise@14.14.0';
import { stopwords } from "../filters/stopwords.ts";

function extractSentences(text: string): string[] {
    const doc = nlp(text);
    return doc.sentences().out('array');
}

function extractNgrams(text: string, minN: number = 1, maxN: number = 3): string[] {
    const words = text.split(/\s+/).filter(word => !stopwords.has(word));
    const ngrams: string[] = [];

    for (let n = minN; n <= maxN; n++) {
        for (let i = 0; i <= words.length - n; i++) {
            const ngram = words.slice(i, i + n).join(" ");
            ngrams.push(ngram);
        }
    }
    return ngrams;
}

export { extractSentences, extractNgrams };