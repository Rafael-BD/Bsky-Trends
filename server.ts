import express from 'express';
import cors from 'cors';
import { createWebSocketClient } from './src/postsListening';
import { getTrendingTopics } from './src/utils/getTrends';
import 'dotenv/config';

const isDev = process.env.DEV === 'true';
const app = express();

app.use(cors());

app.get('/trending', async (req, res) => {
    const limit = req.query.limit as string;
    const lang = req.query.lang as string;
    const minCount = req.query.minCount as string;
    const trends = await getTrendingTopics(parseInt(limit ?? '10'), lang ?? 'pt', parseInt(minCount ?? '5'));
    res.json(trends);
});

async function startHttpServer() {
    if(isDev) {
        app.listen(8003, () => {
            console.log('Server is running on port 8003');
        });
    }
}

async function startServices() {
    await Promise.all([createWebSocketClient(), startHttpServer()]);
}

startServices();
