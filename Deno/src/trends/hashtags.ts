/**
 * Extracts hashtags from a given text.
 * @param text - Text to extract hashtags
 * @returns Array of hashtags
 */
function extractHashtags(text: string): string[] {
    return text.match(/#[a-z0-9]+/gi) || [];
};

export { extractHashtags };