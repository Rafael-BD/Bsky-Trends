import { supabaseSvc as supabase } from "../config/supabase.ts";
import { compress, decompress } from "https://deno.land/x/lz4@0.1.3/mod.ts";
import { updateTrends } from "../services/updateTrendsDB.ts";
// const isDev = Deno.env.get('DEV') === 'true';

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

    toJSON() {
        return {
            depth: this.depth,
            width: this.width,
            table: this.table,
            ngramsCounter: Array.from(this.ngramsCounter.entries()),
            maxDates: this.maxDates,
            maxAgeInHours: this.maxAgeInHours,
            similarityThreshold: this.similarityThreshold,
            cleanInterval: this.cleanInterval,
            minCount: this.minCount,
        };
    }

    static fromJSON(data: { depth: number, width: number, table: number[][], ngramsCounter: [string, { original: string, count: number, dates: string[] }][], maxDates: number, maxAgeInHours: number, similarityThreshold: number, cleanInterval: number, minCount: number }) {
        const sketch = new CountMinSketch(
            data.depth,
            data.width,
            data.maxDates,
            data.maxAgeInHours,
            data.similarityThreshold,
            data.cleanInterval,
            data.minCount
        );
        sketch.table = data.table;
        sketch.ngramsCounter = new Map(data.ngramsCounter.map(([key, value]) => [key, { ...value, dates: value.dates.map(dateStr => new Date(dateStr)) }]));
        return sketch;
    }

    async saveToSupabase(lang: string, type: string) {
        const data = JSON.stringify(this.toJSON());
        const compressedData = compress(new TextEncoder().encode(data));
        const { error } = await supabase.storage
            .from("checkpoints")
            .upload(`${lang}_${type}_checkpoint.lz4`, new File([compressedData], `${lang}_${type}_checkpoint.lz4`), {
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
        const { data, error } = await supabase.storage
            .from("checkpoints")
            .download(`${lang}_${type}_checkpoint.lz4`);

        if (error) {
            console.log('No checkpoint found for', lang, type);
            return null;
        } else {
            const compressedData = await data.arrayBuffer();
            const decompressedData = decompress(new Uint8Array(compressedData));
            const jsonData = new TextDecoder().decode(decompressedData);
            console.log('Checkpoint loaded from Supabase:', lang, type);
            return CountMinSketch.fromJSON(JSON.parse(jsonData));
        }
    }

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

    private similarity(a: string, b: string): number {
        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 1.0;
        return (maxLen - this.levenshtein(a, b)) / maxLen;
    }

    update(item: string, date: Date, _lang: string) {
        const lowerCaseItem = item.toLowerCase();
        console.log('Updating:', lowerCaseItem);
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

    getTopNgrams(n = 10): Array<{ item: string, count: number }> {
        const now = new Date();
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

const saveInterval = 5 * 60 * 1000; // 5 minutos em milissegundos

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