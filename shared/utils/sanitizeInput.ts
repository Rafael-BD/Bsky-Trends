import { Context } from "https://deno.land/x/oak@v13.1.0/mod.ts";
import * as ammonia from "https://deno.land/x/ammonia@0.3.1/mod.ts";
await ammonia.init();

function sanitize(value: string): string {
    return ammonia.clean(value);
}

export function sanitizeQueryParams(ctx: Context): Record<string, string> {
    const queryParams = ctx.request.url.searchParams;
    const sanitizedParams: Record<string, string> = {};

    queryParams.forEach((value, key) => {
        sanitizedParams[key] = sanitize(value);
    });

    return sanitizedParams;
}

export async function sanitizeBody(ctx: Context): Promise<Record<string, unknown>> {
    if (!ctx.request.hasBody) {
        return {};
    }
    const body = await ctx.request.body.json();
    const sanitizedBody: Record<string, unknown> = {};

    const sanitizeValue = (value: unknown): unknown => {
        if (typeof value === 'string') {
            return sanitize(value);
        } else if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        } else if (typeof value === 'object' && value !== null) {
            const sanitizedObject: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(value)) {
                sanitizedObject[key] = sanitizeValue(val);
            }
            return sanitizedObject;
        }
        return value;
    };

    for (const [key, value] of Object.entries(body)) {
        sanitizedBody[key] = sanitizeValue(value);
    }
    return sanitizedBody;
}

export function sanitizeInput(value: string): string {
    return sanitize(value);
}
