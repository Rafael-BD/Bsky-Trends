import { getTrendingTopics } from "../utils/getTrends.ts";

// Cron job to update trends every 20 minutes
export default function cron() {
    Deno.cron("Trends update", { minute: { every: 20 } }, () => {
        console.log('Updating time:', new Date());
        getTrendingTopics(15, 'pt');
        getTrendingTopics(15, 'en');
        getTrendingTopics(15, 'es');
    });
};