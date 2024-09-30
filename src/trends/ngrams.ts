import { supabaseSvc as supabase } from "../config/supabase.ts";
import { compress, uncompress } from "lz4-napi";
import { updateTrends } from "../services/updateTrendsDB.ts";
import 'dotenv/config';

const isDev = process.env.DEV === 'true';
const STORAGE = isDev ? 'checkpoints_dev' : 'checkpoints';

class CountMinSketch {
    private depth: number;
    private width: number;
    private table: number[][];
    private hashFunctions: Array<(str: string) => number>;
    private ngramsCounter: Map<string, { original: string, count: number, lastUpdated: Date, dates: Date[] }>;
    private maxAgeInHours: number;
    private similarityThreshold: number;
    private cleanInterval: number;
    private minCount: number;
    private decayFactor: number;
    private maxDates: number;

    constructor(depth = 10, width = 10000, maxAgeInHours = 6, similarityThreshold = 0.8, cleanInterval = 1000 * 60 * 20, minCount = 20, decayFactor = 0.95, maxDates = 10) {
        this.depth = depth;
        this.width = width;
        this.table = Array.from({ length: depth }, () => Array(width).fill(0));
        this.hashFunctions = this.generateHashFunctions(depth, width);
        this.ngramsCounter = new Map();
        this.maxAgeInHours = maxAgeInHours;
        this.similarityThreshold = similarityThreshold;
        this.cleanInterval = cleanInterval;
        this.minCount = minCount;
        this.decayFactor = decayFactor;
        this.maxDates = maxDates;
        this.startPeriodicCleaning();
    }

    toJSON() {
        return {
            table: this.table,
            ngramsCounter: Array.from(this.ngramsCounter.entries())
        };
    }

    static fromJSON(
        data: { table: number[][], ngramsCounter: [string, { original: string, count: number, dates: string[], lastUpdated?: string }][] }
    ) {
        const sketch = new CountMinSketch();

        // Check if the dimensions of the table are different from the current sketch dimensions
        if (data.table.length !== sketch.depth || data.table[0].length !== sketch.width) {
            const newTable = Array.from({ length: sketch.depth }, () => Array(sketch.width).fill(0));

            // Map the values from the old table to the new table
            for (let i = 0; i < data.table.length; i++) {
                if (!data.table[i]) continue; 
                for (let j = 0; j < data.table[i].length; j++) {
                    const value = data.table[i][j];

                    const newI = Math.floor(i * (sketch.depth / data.table.length));
                    const newJ = Math.floor(j * (sketch.width / data.table[i].length));

                    newTable[newI][newJ] += value;
                }
            }

            sketch.table = newTable;
        } else {
            sketch.table = data.table;
        }

        // Map the values from the old ngramsCounter to the new ngramsCounter
        sketch.ngramsCounter = new Map(
            data.ngramsCounter.map(([key, value]) => {
                let lastUpdated: Date;

                if (!value.lastUpdated) {
                    lastUpdated = value.dates.length > 0 ? new Date(value.dates[value.dates.length - 1]) : new Date();
                }
                else {
                    lastUpdated = new Date(value.lastUpdated);
                }

                return [key, { original: value.original, count: value.count, lastUpdated, dates: value.dates.map(dateStr => new Date(dateStr)) }];
            })
        );

        return sketch;
    }

    async saveToSupabase(lang: string, type: string) {
        if (!supabase) {
            console.warn('Supabase client is not initialized');
            return null;
        }
        const data = JSON.stringify(this.toJSON());
        const compressedData = compress(Buffer.from(new TextEncoder().encode(data)));
        const { error } = await supabase.storage
            .from(STORAGE)
            .upload(`${lang}_${type}_checkpoint.lz4`, new File([await compressedData], `${lang}_${type}_checkpoint.lz4`), {
                upsert: true,
            });

        if (error) {
            console.error(`Error saving ${type} checkpoint to Supabase:`, error);
        } else {
            console.log(`${type} checkpoint saved to Supabase`);
        }
        await updateTrends();
    }

    static async loadFromSupabase(lang: string, type: string): Promise<CountMinSketch | null> {
        if (!supabase) {
            console.warn('Supabase client is not initialized');
            return null;
        }

        const { data, error } = await supabase.storage
            .from('checkpoints')
            .download(`${lang}_${type}_checkpoint.lz4`);

        if (error) {
            console.log('No checkpoint found for', lang, type);
            return null;
        } else {
            const compressedData = await data.arrayBuffer();
            const decompressedData = await uncompress(Buffer.from(new Uint8Array(compressedData)));
            const jsonData = new TextDecoder().decode(decompressedData);
            console.log('Checkpoint loaded from Supabase:', lang, type);
            return CountMinSketch.fromJSON(JSON.parse(jsonData));
        }
    }

    // Generate hash functions to be used in the Count-Min Sketch algorithm
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

    // Algorithm to calculate the Levenshtein distance between two strings (used to calculate similarity)
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

    // Calculate the similarity between two strings for merging similar words/phrases
    private similarity(a: string, b: string): number {
        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 1.0;
        return (maxLen - this.levenshtein(a, b)) / maxLen;
    }

    // Apply decay to the count of an entry based on the time between posts
    private applyDecay(entry: { count: number, dates: Date[] }, now: Date) {
        const dateDifferences = [];
        
        for (let i = 1; i < entry.dates.length; i++) {
            const prev = entry.dates[i - 1].getTime();
            const current = entry.dates[i].getTime();
            dateDifferences.push((current - prev) / (1000 * 60 * 60)); 
        }
        
        // Calculate the average time between posts
        const averageDifference = dateDifferences.length > 0
            ? dateDifferences.reduce((acc, diff) => acc + diff, 0) / dateDifferences.length
            : 0;
        
        const timeSinceLast = (now.getTime() - entry.dates[entry.dates.length - 1].getTime()) / (1000 * 60 * 60);
        const decay = Math.pow(this.decayFactor, averageDifference + timeSinceLast);

        entry.count = Math.floor(entry.count * decay); // Apply decay to the count
    }

    update(item: string, date: Date, _lang: string) {
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
        // console.log('Updating:', similarKey, entry?.count ?? 0);

        if (entry) {
            this.applyDecay(entry, date);
            entry.count++;
            entry.lastUpdated = date;
            entry.dates.push(date);
            if (entry.dates.length > this.maxDates) {
                entry.dates.shift();
            }
        } else {
            this.ngramsCounter.set(similarKey, { original: item, count: 1, lastUpdated: date, dates: [date] });
        }
    }

    // Get the top N n-grams (top words, phrases, hashtags, etc.)
    getTopNgrams(n = 10): Array<{ item: string, count: number }> {
        const now = new Date();
        return Array.from(this.ngramsCounter.entries())
            .map(([_key, value]) => {
                const dateDifferences = [];
                for (let i = 1; i < value.dates.length; i++) {
                    const prev = value.dates[i - 1].getTime();
                    const current = value.dates[i].getTime();
                    dateDifferences.push((current - prev) / (1000 * 60 * 60));
                }

                const averageDifference = dateDifferences.length > 0
                    ? dateDifferences.reduce((acc, diff) => acc + diff, 0) / dateDifferences.length
                    : 0;

                const timeSinceLast = (now.getTime() - value.dates[value.dates.length - 1].getTime()) / (1000 * 60 * 60);
                const weight = value.count * Math.pow(this.decayFactor, averageDifference + timeSinceLast); // Weight decreases with age and frequency

                return { item: value.original, count: value.count, weight };
            })
            .sort((a, b) => b.weight - a.weight)
            .slice(0, n)
            .map(entry => ({ item: entry.item, count: entry.count }));
    }

    // Clean old entries from the n-grams counter (entries with count < minCount and older than maxAgeInHours)
    private cleanOldEntries() {
        const now = new Date();
        let deletedEntries = 0; 
        for (const [key, value] of this.ngramsCounter.entries()) {
            const ageInHours = (now.getTime() - value.lastUpdated.getTime()) / (1000 * 60 * 60);

            if (ageInHours > this.maxAgeInHours || value.count < this.minCount) {
                // console.log('Deleting due to age or low count:', key, value.lastUpdated, value.count);
                this.ngramsCounter.delete(key);
                deletedEntries++;
            }
        }
        console.log("Num entries before cleaning:", this.ngramsCounter.size);
        console.log('Deleted', deletedEntries, 'entries');
    }

    private startPeriodicCleaning() {
        setInterval(() => this.cleanOldEntries(), this.cleanInterval) as unknown as NodeJS.Timeout;
    }
}

const sketchesByLang = {
    pt: {
        wordSketch: await CountMinSketch.loadFromSupabase("pt", "wordSketch") || new CountMinSketch(),
        phraseSketch: await CountMinSketch.loadFromSupabase("pt", "phraseSketch") || new CountMinSketch(),
        hashtagsSketch: await CountMinSketch.loadFromSupabase("pt", "hashtagsSketch") || new CountMinSketch(),
    },
    en: {
        wordSketch: await CountMinSketch.loadFromSupabase("en", "wordSketch") || new CountMinSketch(),
        phraseSketch: await CountMinSketch.loadFromSupabase("en", "phraseSketch") || new CountMinSketch(),
        hashtagsSketch: await CountMinSketch.loadFromSupabase("en", "hashtagsSketch") || new CountMinSketch(),
    },
};


function updateSketches(ngrams: { words: string[], phrases: string[], hashtags: string[] }, date: Date, lang: 'pt' | 'en') {
    const filterNgrams = (ngrams: string[]) => ngrams.filter(ngram => ngram.trim().length > 1);

    const filteredWords = filterNgrams(ngrams.words);
    const filteredPhrases = filterNgrams(ngrams.phrases);
    const filteredHashtags = filterNgrams(ngrams.hashtags);

    filteredWords.forEach(ngram => sketchesByLang[lang].wordSketch.update(ngram, date, lang));
    filteredPhrases.forEach(ngram => sketchesByLang[lang].phraseSketch.update(ngram, date, lang));
    filteredHashtags.forEach(ngram => sketchesByLang[lang].hashtagsSketch.update(ngram, date, lang));
}

const saveInterval = 20 * 60 * 1000; // 20 minutes

setInterval(async () => {
    for (const lang in sketchesByLang) {
        const language = lang as 'pt' | 'en';
        await sketchesByLang[language].wordSketch.saveToSupabase(language, "wordSketch");
        await sketchesByLang[language].phraseSketch.saveToSupabase(language, "phraseSketch");
        await sketchesByLang[language].hashtagsSketch.saveToSupabase(language, "hashtagsSketch");
    }
}, saveInterval);

function getTopWords(n = 10, lang: 'pt' | 'en') {
    return sketchesByLang[lang].wordSketch.getTopNgrams(n);
}

function getTopPhrases(n = 10, lang: 'pt' | 'en') {
    return sketchesByLang[lang].phraseSketch.getTopNgrams(n);
}

function getTopHashtags(n = 10, lang: 'pt' | 'en') {
    return sketchesByLang[lang].hashtagsSketch.getTopNgrams(n);
}

// Get the top global words (words that are trending in the other languages)
function getTopGlobalWords(n = 10, langToExclude: 'pt' | 'en') {
    const allWords = Object.entries(sketchesByLang)
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