import { getTrendingTopics } from "../utils/getTrends.ts";

// Cron job to update trends every 20 minutes
export default function cron() {
    Deno.cron("Trends update", { minute: { every: 5 } }, async() => {
        console.log('Updating time:', new Date());
        
        try {
            await getTrendingTopics(15, 'pt').then((trends) => {
                console.log('PT trends:', trends);
            });
        } catch (error) {
            console.error('Error updating PT trends:', error);
        }

        try {
            await getTrendingTopics(15, 'en').then((trends) => {
                console.log('EN trends:', trends);
            });
        } catch (error) {
            console.error('Error updating EN trends:', error);
        }

        try {
            await getTrendingTopics(15, 'es').then((trends) => {
                console.log('ES trends:', trends);
            });
        } catch (error) {
            console.error('Error updating ES trends:', error);
        }
    });
};