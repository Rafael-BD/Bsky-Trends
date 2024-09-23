import { Context } from "https://deno.land/x/oak@v13.1.0/mod.ts";
import { fetchCategories, fetchPlugins, searchPluginsByName } from "../services/pluginsService.ts";
import { sanitizeQueryParams } from "../../../shared/utils/sanitizeInput.ts";

export async function getPlugins(ctx: Context) {
    try {
        const sanitizedQueryParams = sanitizeQueryParams(ctx);
        const { start = "0", end = "10" } = sanitizedQueryParams;
        const startIndex = parseInt(start, 10);
        const endIndex = parseInt(end, 10);

        if (isNaN(startIndex) || isNaN(endIndex)) {
            ctx.response.status = 400;
            ctx.response.body = { error: "Invalid pagination parameters" };
            return;
        }
        const plugins = await fetchPlugins(startIndex, endIndex);
        ctx.response.body = plugins;
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = { error: "Error fetching plugins: " + error.message };
    }
}

export async function searchPlugins(ctx: Context) {
    try {
        const sanitizedQueryParams = sanitizeQueryParams(ctx);
        const query = sanitizedQueryParams.query;
        const plugins = await searchPluginsByName(query);
        ctx.response.body = plugins;
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = { error: "Error searching plugins: " + error.message };
    }
}

export async function getCategories(ctx: Context) {
    try {
        const categories = await fetchCategories();
        ctx.response.body = categories;
    } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = { error: "Error fetching categories: " + error.message };
    }
}
