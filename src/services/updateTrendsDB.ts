import { getTrendingTopics } from "../utils/getTrends.ts";

// Cron job to update trends every 20 minutes
export async function updateTrends() {  
    const NUM_TOPICS = 10;
    try {
        await getTrendingTopics(NUM_TOPICS, 'pt').then((trends) => {
            // console.log('PT trends:', trends);
        });
    } catch (error) {
        console.error('Error updating PT trends:', error);
    }

    try {
        await getTrendingTopics(NUM_TOPICS, 'en').then((trends) => {
            // console.log('EN trends:', trends);
        });
    } catch (error) {
        console.error('Error updating EN trends:', error);
    }
};