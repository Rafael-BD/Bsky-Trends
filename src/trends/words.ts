import nlp from 'npm:compromise@14.14.0';
import Three from "npm:compromise@14.14.0/view/three";

/**
 * Indentify topics in a document
 * @param doc - Document to identify topics
 */
function identifyTopics(doc: Three) {
    const entities = doc.topics().out('array');
    return entities;
}

/**
 * Extract words from a text with compromise nlp library
 * @param text - Text to extract words
 */
export function extractWords(text: string): string[] {
    const doc = nlp(text);
    const topics = identifyTopics(doc).filter((entity: string) => {
        return !entity.startsWith('#');
    });
    return [...topics];
}