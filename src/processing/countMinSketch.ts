class CountMinSketch {
    private depth: number;
    private width: number;
    private table: number[][];
    private hashFunctions: Array<(str: string) => number>;
    private ngramsCounter: Map<string, { original: string, count: number }>;

    constructor(depth = 5, width = 1000) {
        this.depth = depth;
        this.width = width;
        this.table = Array.from({ length: depth }, () => Array(width).fill(0));
        this.hashFunctions = this.generateHashFunctions(depth, width);
        this.ngramsCounter = new Map(); // Para armazenar as contagens reais dos n-gramas
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

    update(item: string) {
        const lowerCaseItem = item.toLowerCase(); // Converter para minúsculas
        for (let i = 0; i < this.depth; i++) {
            const index = this.hashFunctions[i](lowerCaseItem);
            this.table[i][index]++;
        }
        const entry = this.ngramsCounter.get(lowerCaseItem);
        if (entry) {
            entry.count++;
        } else {
            this.ngramsCounter.set(lowerCaseItem, { original: item, count: 1 });
        }
    }

    estimate(item: string): number {
        const lowerCaseItem = item.toLowerCase(); // Converter para minúsculas
        return Math.min(
            ...this.hashFunctions.map((hash, i) => this.table[i][hash(lowerCaseItem)])
        );
    }

    getTopNgrams(n = 10): Array<{ item: string, count: number }> {
        // Retorna os n-gramas mais frequentes com base no contador de n-gramas
        return Array.from(this.ngramsCounter.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, n)
            .map(entry => ({ item: entry[1].original, count: entry[1].count }));
    }
}

const wordSketch = new CountMinSketch();
const phraseSketch = new CountMinSketch();

function updateSketches(ngrams: { words: string[], phrases: string[] }) {
    // Filtra phrases e words inválidos como strings vazias ou compostos apenas de espaços ou letras únicas
    const filterNgrams = (ngrams: string[]) => ngrams.filter(ngram => ngram.trim().length > 1);

    const filteredWords = filterNgrams(ngrams.words);
    const filteredPhrases = filterNgrams(ngrams.phrases);

    filteredWords.forEach(ngram => wordSketch.update(ngram));
    filteredPhrases.forEach(ngram => phraseSketch.update(ngram));
}

function getTopWords(n = 10) {
    return wordSketch.getTopNgrams(n);
}

function getTopPhrases(n = 10) {
    return phraseSketch.getTopNgrams(n);
}

export { getTopWords, getTopPhrases, updateSketches };