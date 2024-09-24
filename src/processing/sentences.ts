import nlp from 'npm:compromise@14.14.0';

function extractSentences(text: string): string[] {
    const doc = nlp(text);
    return doc.sentences().out('array');
}


export { extractSentences };