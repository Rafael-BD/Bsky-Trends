// deno-lint-ignore-file no-unused-vars
import { Application, Router } from "https://deno.land/x/oak@v13.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import {createWebSocketClient} from "./src/postsListening.ts";
import { getTrendingTopics } from "./src/utils/getTrends.ts";
import cron from "./src/config/cron.ts";

// const app = new Application();

// const router = new Router();

// router.get("/trending", async (ctx) => {
//     const trends = await getTrendingTopics(20, 'pt'); // change to 'en' or 'es' to get trends in other languages
//     ctx.response.body = trends;
// });


// // Middleware e rotas
// app.use(oakCors({ origin: "*" }));
// app.use(router.routes());
// app.use(router.allowedMethods());

// console.log("App Operations Backend running on http://localhost:8003");

// // Função para rodar o servidor HTTP
// async function startHttpServer() {
//     await app.listen({ port: 8003 });
// }


// async function startServices() {
//     await Promise.all([ createWebSocketClient()]);
// }

// startServices();
cron();
createWebSocketClient()
