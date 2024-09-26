class CountMinSketch {
    private depth: number;
    private width: number;
    private table: number[][];
    private hashFunctions: Array<(str: string) => number>;
    private ngramsCounter: Map<string, { original: string, count: number, dates: Date[] }>;
    private maxDates: number;
    private maxAgeInHours: number;
    private similarityThreshold: number;
    private cleanInterval: number;
    private cleanIntervalId: NodeJS.Timeout | null;
    private minCount: number;

    /**
     * @param depth Depth of the table (number of hash functions)
     * @param width Width of the table (size of each row)
     * @param maxDates Maximum number of dates to be stored
     * @param maxAgeInHours Maximum age in hours to keep entries
     * @param similarityThreshold Similarity threshold to group similar words/phrases
     * @param cleanInterval Interval in milliseconds to clean old entries
     * @param minCount Minimum count to keep entries
     */
    constructor(depth = 5, width = 1000, maxDates = 5, maxAgeInHours = 12, similarityThreshold = 0.8, cleanInterval = 1800000, minCount = 10) {  
        this.depth = depth;
        this.width = width;
        this.table = Array.from({ length: depth }, () => Array(width).fill(0));
        this.hashFunctions = this.generateHashFunctions(depth, width);
        this.ngramsCounter = new Map(); // To store the actual counts of n-grams
        this.maxDates = maxDates; // Maximum number of dates to be stored
        this.maxAgeInHours = maxAgeInHours; // Maximum age in hours to keep entries
        this.similarityThreshold = similarityThreshold; // Similarity threshold to group similar words/phrases
        this.cleanInterval = cleanInterval; // Interval to clean old entries
        this.cleanIntervalId = null;
        this.minCount = minCount; // Minimum count to keep entries
        this.startPeriodicCleaning();
    }

    /**
     * Generate hash functions to be used in the Count-Min Sketch
     * @param depth Depth of the table (number of hash functions)
     * @param width Width of the table (size of each row)
     * @returns Array of hash functions
     */
    private generateHashFunctions(depth: number, width: number): Array<(str: string) => number> {
        const hashFunctions = [];
        for (let i = 0; i < depth; i++) {
            const seed = Math.floor(Math.random() * 1000);
            hashFunctions.push((str: string) => {
                let hash = seed;
                for (const char of str) {
                    hash = (hash * 31 + char.charCodeAt(0)) % width;
                }
                return hash;
            });
        }
        return hashFunctions;
    }

    /**
     * Calculate the Levenshtein distance between two strings
     * @param a First string
     * @param b Second string
     * @returns Levenshtein distance
     */
    private levenshtein(a: string, b: string): number {
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[a.length][b.length];
    }

    /**
     * Calculate the similarity between two strings for indentifying and merge similar topics
     * @param a First string
     * @param b Second string
     * @returns Similarity between the strings
     */
    private similarity(a: string, b: string): number {
        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 1.0;
        return (maxLen - this.levenshtein(a, b)) / maxLen;
    }

    /**
     * Update the Count-Min Sketch with a new item
     * @param item Item to be updated
     * @param date Date of the item
     * @param _lang Language of the item
     */
    update(item: string, date: Date, _lang: string) {
        // console.log('Updating item:', item, 'at', date, 'for lang:', _lang);
        const lowerCaseItem = item.toLowerCase();

        let similarKey = lowerCaseItem;
        for (const key of this.ngramsCounter.keys()) {
            if (this.similarity(lowerCaseItem, key) >= this.similarityThreshold) {
                similarKey = key;
                break;
            }
        }

        for (let i = 0; i < this.depth; i++) {
            const index = this.hashFunctions[i](similarKey);
            this.table[i][index]++;
        }
        const entry = this.ngramsCounter.get(similarKey);
        if (entry) {
            entry.count++;
            entry.dates.push(date);
            if (entry.dates.length > this.maxDates) {
                entry.dates.shift(); // Remove the oldest date if the maximum number of dates is reached
            }
        } else {
            this.ngramsCounter.set(similarKey, { original: item, count: 1, dates: [date] });
        }
    }

    /**
     * Get the top N n-grams from the Count-Min Sketch
     * @param n Number of n-grams to return
     * @returns Array of the top n-grams
    */
    getTopNgrams(n = 10): Array<{ item: string, count: number }> {
        const now = new Date();
        // Return the top n-grams sorted by weight (count / age)
        return Array.from(this.ngramsCounter.entries())
            .map(([_key, value]) => {
                const ageInHours = value.dates.reduce((sum, date) => sum + (now.getTime() - date.getTime()) / (1000 * 60 * 60), 0) / value.dates.length;
                const weight = value.count / (1 + ageInHours); // Weight decreases with age (older entries have less weight)
                return { item: value.original, count: value.count, weight };
            })
            .sort((a, b) => b.weight - a.weight)
            .slice(0, n)
            .map(entry => ({ item: entry.item, count: entry.count }));
    }

    /**
     * Clean old entries from the Count-Min Sketch based on the maximum age and minimum count
     */
    private cleanOldEntries() {
        const now = new Date();
        for (const [key, value] of this.ngramsCounter.entries()) {
            value.dates = value.dates.filter(date => (now.getTime() - date.getTime()) / (1000 * 60 * 60) <= this.maxAgeInHours);
            if (value.dates.length === 0 || value.count < this.minCount) {
                this.ngramsCounter.delete(key);
            }
        }
    }

    private startPeriodicCleaning() {
        this.cleanIntervalId = setInterval(() => this.cleanOldEntries(), this.cleanInterval) as unknown as NodeJS.Timeout;
    }

    stopPeriodicCleaning() {
        if (this.cleanIntervalId) {
            clearInterval(this.cleanIntervalId);
            this.cleanIntervalId = null;
        }
    }
}

const sketchesByLang = {
    pt: {
        wordSketch: new CountMinSketch(),
        phraseSketch: new CountMinSketch(),
        hashtagsSketch: new CountMinSketch(),
    },
    en: {
        wordSketch: new CountMinSketch(),
        phraseSketch: new CountMinSketch(),
        hashtagsSketch: new CountMinSketch(),
    },
    es: {
        wordSketch: new CountMinSketch(),
        phraseSketch: new CountMinSketch(),
        hashtagsSketch: new CountMinSketch(),
    }
};

const kv = await Deno.openKv();

/**
 * Update the Count-Min Sketches with new n-grams
 * @param ngrams Object containing the n-grams to be updated
 * @param date Date of the n-grams
 * @param lang Language of the n-grams
*/
function updateSketches(ngrams: { words: string[], phrases: string[], hashtags: string[] }, date: Date, lang: 'pt' | 'en' | 'es') {
    // Filter out n-grams with less than 2 characters
    const filterNgrams = (ngrams: string[]) => ngrams.filter(ngram => ngram.trim().length > 1);

    const filteredWords = filterNgrams(ngrams.words);
    const filteredPhrases = filterNgrams(ngrams.phrases);
    const filteredHashtags = filterNgrams(ngrams.hashtags);

    filteredWords.forEach(ngram => sketchesByLang[lang].wordSketch.update(ngram, date, lang));
    filteredPhrases.forEach(ngram => sketchesByLang[lang].phraseSketch.update(ngram, date, lang));
    filteredHashtags.forEach(ngram => sketchesByLang[lang].hashtagsSketch.update(ngram, date, lang));

    
    kv.set(['sketches'], JSON.stringify(sketchesByLang)).then(() => {
        console.log('Sketches saved to KV');
    }).catch((error) => {
        console.error('Error saving sketches to KV:', error);
    });
}

async function getTopWords(n = 10, lang: 'pt' | 'en' | 'es') {
    const sketchesEntry = await kv.get(['sketches']);
    if (!sketchesEntry.value) return [];
    try {
        const sketches = JSON.parse(sketchesEntry.value as string);
        return sketches[lang].wordSketch.getTopNgrams(n);
    } catch (error) {
        console.error('Error getting top words:', error);
        return [];
    }
}

async function getTopPhrases(n = 10, lang: 'pt' | 'en' | 'es') {
    const sketchesEntry = await kv.get(['sketches']);
    if (!sketchesEntry.value) return [];
    try {
        const sketches = JSON.parse(sketchesEntry.value as string); 
        return sketches[lang].phraseSketch.getTopNgrams(n);
    } catch (error) {
        console.error('Error getting top phrases:', error);
        return [];
    }
}

async function getTopHashtags(n = 10, lang: 'pt' | 'en' | 'es') {
    const sketchesEntry = await kv.get(['sketches']);
    if (!sketchesEntry.value) return [];
    try {
        const sketches = JSON.parse(sketchesEntry.value as string);
        return sketches[lang].hashtagsSketch.getTopNgrams(n);
    } catch (error) {
        console.error('Error getting top hashtags:', error);
        return [];
    }
}

async function getTopGlobalWords(n = 10, langToExclude: 'pt' | 'en' | 'es') {
    const sketchesEntry = await kv.get(['sketches']);
    if (!sketchesEntry.value) return [];
    let sketches = null;
    try {
        sketches = JSON.parse(sketchesEntry.value as string);
    } catch (error) {
        console.error('Error getting top global words:', error);
        return [];
    }
    const allWords = Object.entries(sketches)
        .filter(([key]) => key !== langToExclude)
        .flatMap(([, sketch]) => (sketch as { wordSketch: CountMinSketch }).wordSketch.getTopNgrams(n));

    const wordCounts = new Map<string, number>();
    allWords.forEach(word => {
        wordCounts.set(word.item, (wordCounts.get(word.item) || 0) + word.count);
    });

    // Return the top global words sorted by count
    return Array.from(wordCounts.entries())
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

export { getTopWords, getTopPhrases, updateSketches, getTopGlobalWords, getTopHashtags };
