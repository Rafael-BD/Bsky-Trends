import { getTrendingTopics } from "../utils/getTrends.ts";

/**
 * Function to update trends
 */
export async function updateTrends() {
    console.log('Updating time:', new Date());

    try {
        await getTrendingTopics(15, 'pt');
    } catch (error) {
        console.error('Error updating PT trends:', error);
    }

    try {
        await getTrendingTopics(15, 'en');
    } catch (error) {
        console.error('Error updating EN trends:', error);
    }

    try {
        await getTrendingTopics(15, 'es');
    } catch (error) {
        console.error('Error updating ES trends:', error);
    }
}

setInterval(updateTrends, 60000); // 1 minute

