import { Context } from "https://deno.land/x/oak@v13.1.0/mod.ts";
import { validate, required, isString } from "https://deno.land/x/validasaur@v0.15.0/mod.ts";
import { isEscape } from "https://deno.land/x/escape@1.4.2/mod.ts";


export default async function validateMiddleware(ctx: Context, next: () => Promise<unknown>) {
    const url = ctx.request.url;
    const pathname = url.pathname;
    const query = url.searchParams.get("query");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (pathname === "/plugins/search" && query !== null) {
        const [passes] = await validate({ query }, {
            query: [required, isString],
        });


        if (!passes || isEscape(query)) {
            ctx.response.status = 200;
            ctx.response.body = [];
            return;
        }
    }

    if (pathname === "/plugins" && start !== null && end !== null) {
        const [passes] = await validate({ start, end }, {
            start: [required, isString],
            end: [required, isString],
        });

        if (!passes || isEscape(start) || isEscape(end)) {
            ctx.response.status = 200;
            ctx.response.body = [];
            return;
        }
    }

    await next();
}