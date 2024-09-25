import { stopwords_pt } from "./filters/stopwords/stopwords_pt.ts";
import {
    ComAtprotoSyncSubscribeRepos,
    SubscribeReposMessage,
    subscribeRepos,
} from 'npm:atproto-firehose@0.2.2';
import { extractSentences } from "./processing/sentences.ts";
import { preProcessText } from "./utils/preProcess.ts";
import { filterSentences, filterWords } from "./filters/filter.ts";
import { updateSketches, updateGlobalSketch } from "./processing/countMinSketch.ts";
import { extractWords } from "./processing/words.ts"; // Importando o identificador de entidades
import { extractHashtags } from "./processing/hashtags.ts";

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
                        if (payload.$type !== "app.bsky.feed.post" || !payload.text) return;

                        const postDate = new Date(payload.createdAt);
                        const currentDate = new Date();
                        const diff = currentDate.getTime() - postDate.getTime();
                        const diffInHours = diff / (1000 * 60 * 60); 
                        if (diffInHours > 12) return;

                        const txt = payload.text.trim();
                    
                        const processedText = preProcessText(txt);
                        const date = new Date(payload.createdAt);
                    
                        if(payload.langs.includes('pt')){
                            if (processedText.split(" ").every(word => stopwords_pt.has(word))) return;
                            const phrases = filterSentences(extractSentences(processedText));
                            const words = filterWords(extractWords(processedText), 'pt');
                            const hashtags = filterWords(extractHashtags(processedText), 'pt');
                            updateSketches({ words, phrases, hashtags }, date);
                        }
                        if (!payload.langs.includes('pt')){
                            if (processedText.split(" ").every(word => stopwords_pt.has(word))) return;
                            const words = filterWords(extractWords(processedText), 'global');
                            updateGlobalSketch({ words }, date);
                        }
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
