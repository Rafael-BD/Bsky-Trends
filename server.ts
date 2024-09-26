import { Application, Router } from "https://deno.land/x/oak@v13.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import {createWebSocketClient} from "./src/postsListening.ts";
import { getTrendingTopics } from "./src/utils/getTrends.ts";

const isDev = Deno.env.get('DEV') === 'true';
const app = new Application();

const router = new Router();

router.get("/trending", async (ctx) => {
    const limit = ctx.request.url.searchParams.get('limit');
    const lang = ctx.request.url.searchParams.get('lang');
    const minCount = ctx.request.url.searchParams.get('minCount');
    const trends = await getTrendingTopics(parseInt(limit ?? '15'), lang ?? 'pt', parseInt(minCount ?? '5'));
    ctx.response.body = trends;
});


app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

async function startHttpServer() {
    if(isDev) {
        await app.listen({ port: 8003 });
    }
}

async function startServices() {
    await Promise.all([ createWebSocketClient(), startHttpServer() ]);
}

startServices();

