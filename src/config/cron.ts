import { getTrendingTopics } from "../utils/getTrends.ts";

// Cron job to update trends every 20 minutes
export default function cron() {
    Deno.cron("Trends update", { minute: { every: 20 } }, () => {
        console.log('Updating time:', new Date());
        
        try {
            getTrendingTopics(15, 'pt');
        } catch (error) {
            console.error('Error updating PT trends:', error);
        }

        try {
            getTrendingTopics(15, 'en');
        } catch (error) {
            console.error('Error updating EN trends:', error);
        }

        try {
            getTrendingTopics(15, 'es');
        } catch (error) {
            console.error('Error updating ES trends:', error);
        }
    });
};