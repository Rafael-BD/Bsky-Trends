class CountMinSketch {
    private depth: number;
    private width: number;
    private table: number[][];
    private hashFunctions: Array<(str: string) => number>;
    private ngramsCounter: Map<string, { original: string, count: number, dates: Date[] }>;
    private maxDates: number;

    constructor(depth = 5, width = 1000, maxDates = 5) {
        this.depth = depth;
        this.width = width;
        this.table = Array.from({ length: depth }, () => Array(width).fill(0));
        this.hashFunctions = this.generateHashFunctions(depth, width);
        this.ngramsCounter = new Map(); // Para armazenar as contagens reais dos n-gramas
        this.maxDates = maxDates; // Número máximo de datas a serem armazenadas
    }

    private generateHashFunctions(depth: number, width: number): Array<(str: string) => number> {
        // Gera uma lista de funções hash simples
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

    update(item: string, date: Date) {
        const lowerCaseItem = item.toLowerCase(); // Converter para minúsculas
        for (let i = 0; i < this.depth; i++) {
            const index = this.hashFunctions[i](lowerCaseItem);
            this.table[i][index]++;
        }
        const entry = this.ngramsCounter.get(lowerCaseItem);
        if (entry) {
            entry.count++;
            entry.dates.push(date);
            if (entry.dates.length > this.maxDates) {
                entry.dates.shift(); // Remove a data mais antiga se exceder o máximo
            }
        } else {
            this.ngramsCounter.set(lowerCaseItem, { original: item, count: 1, dates: [date] });
        }
    }

    estimate(item: string): number {
        const lowerCaseItem = item.toLowerCase(); // Converter para minúsculas
        return Math.min(
            ...this.hashFunctions.map((hash, i) => this.table[i][hash(lowerCaseItem)])
        );
    }

    getTopNgrams(n = 10): Array<{ item: string, count: number }> {
        const now = new Date();
        // Retorna os n-gramas mais frequentes com base no contador de n-gramas e na média ponderada das datas
        return Array.from(this.ngramsCounter.entries())
            .map(([_key, value]) => {
                const ageInHours = value.dates.reduce((sum, date) => sum + (now.getTime() - date.getTime()) / (1000 * 60 * 60), 0) / value.dates.length;
                const weight = value.count / (1 + ageInHours); // Peso decresce com a idade média dos posts
                return { item: value.original, count: value.count, weight };
            })
            .sort((a, b) => b.weight - a.weight)
            .slice(0, n)
            .map(entry => ({ item: entry.item, count: entry.count }));
    }
}

const wordSketch = new CountMinSketch();
const phraseSketch = new CountMinSketch();
const hashtagsSketch = new CountMinSketch();
const wordSketchGlobal = new CountMinSketch();

function updateSketches(ngrams: { words: string[], phrases: string[], hashtags: string[] }, date: Date) {
    // Filtra phrases e words inválidos como strings vazias ou compostos apenas de espaços ou letras únicas
    const filterNgrams = (ngrams: string[]) => ngrams.filter(ngram => ngram.trim().length > 1);

    const filteredWords = filterNgrams(ngrams.words);
    const filteredPhrases = filterNgrams(ngrams.phrases);
    const filteredHashtags = filterNgrams(ngrams.hashtags);

    filteredWords.forEach(ngram => wordSketch.update(ngram, date));
    filteredPhrases.forEach(ngram => phraseSketch.update(ngram, date));
    filteredHashtags.forEach(ngram => hashtagsSketch.update(ngram, date));
}

function updateGlobalSketch(ngrams: { words: string[] }, date: Date) {
    const filteredWords = ngrams.words.filter(ngram => ngram.trim().length > 1);
    filteredWords.forEach(ngram => wordSketchGlobal.update(ngram, date));
}

function getTopWords(n = 10) {
    return wordSketch.getTopNgrams(n);
}

function getTopPhrases(n = 10) {
    return phraseSketch.getTopNgrams(n);
}

function getTopHashtags(n = 10) {
    return hashtagsSketch.getTopNgrams(n);
}

function getTopGlobalWords(n = 10) {
    return wordSketchGlobal.getTopNgrams(n);
}

export { getTopWords, getTopPhrases, updateSketches, getTopGlobalWords, updateGlobalSketch, getTopHashtags };