// Preprocess text to remove URLs, punctuation, and other unwanted characters, but keep hashtags
function preProcessText(text: string): string {
    return text
        .replace(/https?:\/\/[^\s]+/g, '') 
        .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,6}\b(?:\/[^\s]*)?/gi, '') 
        .replace(/[^\w\s#]/gi, '') 
        .replace(/\\[a-zA-Z0-9]+/g, '') 
        .trim(); 
}

export { preProcessText };