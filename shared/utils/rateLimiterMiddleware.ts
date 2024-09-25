import { Context } from "https://deno.land/x/oak@v13.1.0/mod.ts";

const kv = await Deno.openKv();

const MAX_REQUESTS = 1;      
const BLOCK_DURATION = 60;    
const WINDOW_DURATION = 60;   

export default async function rateLimiter(ctx: Context, next: () => Promise<unknown>) {
    const ip = ctx.request.ip || ctx.request.headers.get('x-forwarded-for') || 'unknown';
    const currentTime = Math.floor(Date.now() / 1000); // seconds

    const key = `rate_limit:${ip}`; 
    const blockedKey = `blocked:${ip}`; 

    const isBlocked = await kv.get([blockedKey]);

    if (isBlocked?.value && parseInt(String(isBlocked.value), 10) > currentTime) {
        ctx.response.status = 429;
        ctx.response.body = {
            error: `Too many requests. Please try again later.`,
        };
        return;
    }

    const requestCount = await kv.get([key]);
    const newRequestCount = requestCount?.value ? parseInt(String(requestCount.value), 10) + 1 : 1;

    if (newRequestCount === 1) {
        await kv.set([key], newRequestCount.toString(), { expireIn: WINDOW_DURATION });
    } else if (newRequestCount > MAX_REQUESTS) {
        await kv.set([blockedKey], (currentTime + BLOCK_DURATION).toString(), { expireIn: BLOCK_DURATION });
        await kv.delete([key]); 
        ctx.response.status = 429;
        ctx.response.body = {
            error: `Too many requests.`,
        };
        return;
    } else {
        await kv.set([key], newRequestCount.toString(), { expireIn: WINDOW_DURATION });
    }

    await next();
}
