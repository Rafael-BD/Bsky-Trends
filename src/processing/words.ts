import nlp from 'npm:compromise@14.14.0';
import { stopwords } from "../filters/stopwords.ts";
import Three from "npm:compromise@14.14.0/view/three";

function identifyTopics(doc: Three) {
    const entities = doc.topics().out('array');
    return entities;
}

export function extractWords(text: string): string[] {
    const doc = nlp(text);
    const topics = identifyTopics(doc).filter((entity: string) => !stopwords.has(entity.toLowerCase()));
    return [...topics];
}