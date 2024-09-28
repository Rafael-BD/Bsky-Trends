import nlp from 'compromise';

/**
 * Extract sentences from a text with compromise nlp library
 * @param text - Text to extract sentences
 */
function extractSentences(text: string): string[] {
    const doc = nlp(text);
    return doc.sentences().out('array');
}


export { extractSentences };