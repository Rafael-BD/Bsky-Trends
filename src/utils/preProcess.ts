// Preprocess text to remove URLs, punctuation, and other unwanted characters, but keep hashtags, exclamation marks, and question marks
function preProcessText(text: string): string {
    return text
        .replace(/https?:\/\/[^\s]+/g, '') 
        .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,6}\b(?:\/[^\s]*)?/gi, '') 
        .replace(/\\[a-zA-Z0-9]+/g, '') 
        .replace(/[@*%$(){}<>[\],.;:"'^&|~`]/g, '')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim(); 
}

export { preProcessText };