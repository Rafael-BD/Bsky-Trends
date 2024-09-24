// Preprocess text to remove URLs, punctuation, and other unwanted characters
function preProcessText(text: string): string {
    return text
        .replace(/https?:\/\/[^\s]+/g, '')  // Remover URLs com http ou https
        .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,6}\b(?:\/[^\s]*)?/gi, '')  // Remover URLs sem http ou https
        .replace(/[^\w\s]/gi, '')  // Remover pontuação e caracteres especiais
        .replace(/\\[a-zA-Z0-9]+/g, '')  // Remover escapes
        .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/g, '')  // Remover símbolos
        .trim();  // Remover espaços desnecessários
}

// Filter sentences to remove sentences that have duplicate words and sentences with less than 2 words or more than 3 words
function filterSentences(sentences: string[]): string[] {
    return sentences.filter(sentence => {
        const words = sentence.split(" ");
        const uniqueWords = new Set(words);
        return words.length >= 2 && words.length <= 3 && uniqueWords.size === words.length;
    });
}

export { preProcessText, filterSentences };