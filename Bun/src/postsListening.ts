// deno-lint-ignore-file require-await
import { stopwords_pt } from "./filters/stopwords/stopwords_pt.ts";
import {
    ComAtprotoSyncSubscribeRepos,
    type SubscribeReposMessage,
    subscribeRepos,
} from 'atproto-firehose';
import { extractSentences } from "./trends/sentences.ts";
import { preProcessText } from "./utils/preProcess.ts";
import { filterSentences, filterWords } from "./utils/filter.ts";
import { updateSketches } from "./trends/ngrams.ts";
import { extractWords } from "./trends/words.ts"; // Importando o identificador de entidades
import { extractHashtags } from "./trends/hashtags.ts";

/**
 * Function to create a WebSocket client to listen to posts
 * from the Bsky network and update the sketches with the
 * extracted ngrams (words, phrases and hashtags).
 */
async function createWebSocketClient(): Promise<void> {
    async function connectToWebSocket() {
        console.log("Listening to posts from Bsky network...");
        try {
            const client = subscribeRepos(`wss://bsky.network`, { decodeRepoOps: true });
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
                        if (diffInHours > 12) return; // Ignore posts older than 12 hours

                        const lang = payload.langs[0];
                        if(lang !== 'pt' && lang !== 'en') return;

                        const txt = payload.text.trim();
                    
                        const processedText = preProcessText(txt);
                        const date = new Date(payload.createdAt);

                        if (processedText.split(" ").every(word => stopwords_pt.has(word))) return; // Ignore posts with only stopwords

                        // Extract phrases, words and hashtags
                        const phrases = filterSentences(extractSentences(processedText));
                        const words = filterWords(extractWords(processedText), lang);
                        const hashtags = filterWords(extractHashtags(processedText), lang);
                        updateSketches({ words, phrases, hashtags }, date, lang as 'pt' | 'en');
                
                    });
                }
            });

            client.on('error', (e) => {
                console.error('Erro na conexão WebSocket:', e);
                setTimeout(() => connectToWebSocket(), 5000);
            });

            client.on('close', () => {
                console.error('Conexão WebSocket fechada');
                setTimeout(() => connectToWebSocket(), 1000);
            });
        } catch (error) {
            console.error('Erro na conexão WebSocket:', error);
            setTimeout(() => connectToWebSocket(), 5000);
        }
    }

    await connectToWebSocket();
}

export { createWebSocketClient };
