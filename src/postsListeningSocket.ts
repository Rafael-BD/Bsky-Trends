import { stopwords } from "./filters/stopwords.ts";
// deno-lint-ignore-file require-await
import {
    ComAtprotoSyncSubscribeRepos,
    SubscribeReposMessage,
    subscribeRepos,
} from 'npm:atproto-firehose@0.2.2';
import { extractSentences } from "./processing/sentences.ts";
import { preProcessText, filterSentences } from "./utils/preProcess.ts";
import { updateSketches } from "./processing/countMinSketch.ts";
import { extractWords } from "./processing/words.ts"; // Importando o identificador de entidades

function createWebSocketClient() {
    function connectToWebSocket() {
        try {
            const client = subscribeRepos(`wss://bsky.network`, { decodeRepoOps: true })
            client.on('message', (m: SubscribeReposMessage) => {
                if (ComAtprotoSyncSubscribeRepos.isCommit(m)) {
                    m.ops.forEach((op) => {
                        if (!op?.payload) return;
                        const payload = op.payload as { $type: string; text?: string; langs?: string[]; createdAt: string; };
                        if (!payload.langs) return;
                        if (!payload.langs.includes('pt')) return;
                        if (payload.$type !== "app.bsky.feed.post" || !payload.text) return;
                        // so considera posts das ultimas 6 horas
                        const postDate = new Date(payload.createdAt);
                        const currentDate = new Date();
                        const diff = currentDate.getTime() - postDate.getTime();
                        const diffInHours = diff / (1000 * 60 * 60);
                        if (diffInHours > 6) return;
                        const txt = payload.text.trim();
                    
                        const processedText = preProcessText(txt);
                    
                        // Ignorar texto composto apenas de stopwords
                        if (processedText.split(" ").every(word => stopwords.has(word))) return;

                        // Extrair sentenças e filtra por sentenças com no mínimo 2 palavras e no maximo 3
                        const phrases = filterSentences(extractSentences(processedText));

                        // Extrair n-grams para frases e palavras
                        // const phrases = sentences.flatMap(sentence => extractNgrams(preprocessText(sentence), 2, 3));
                        const words = extractWords(processedText);
                    
                        // Atualizar os sketches
                        updateSketches({ words, phrases });
                    });
                }
            })

            client.on('error', (e) => {
                console.error('Erro na conexão WebSocket:', e);
                setTimeout(() => connectToWebSocket(), 5000);
            })

            client.on('close', () => {
                console.error('Conexão WebSocket fechada');
                setTimeout(() => connectToWebSocket(), 5000);
            })
        } catch (error) {
            console.error('Erro na conexão WebSocket:', error);
            setTimeout(() => connectToWebSocket(), 5000);
        }
    }

    connectToWebSocket();
}


export { createWebSocketClient };
