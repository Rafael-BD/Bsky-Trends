function extractHashtags(text: string): string[] {
    return text.match(/#[a-z0-9]+/gi) || [];
};

export { extractHashtags };