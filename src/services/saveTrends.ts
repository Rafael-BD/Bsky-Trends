import { supabaseSvc } from "../config/supabase.ts";

interface TrendItem {
    topic: string;
    category: string;
    count: number;
}

interface Trend {
    words: TrendItem[];
    phrases: TrendItem[];
    hashtags: TrendItem[];
    globalWords: TrendItem[];
}

/**
 * Save the trend to the database
 * @param trend Trend to be saved
 * @param lang Language of the trend
 */
export const saveTrend = async (trend: Trend, lang: string) => {
    const updated_at = new Date().toISOString();
    const { error } = await supabaseSvc
        .from('trends')
        .update({trend: trend, lang: lang, updated_at: updated_at})
        .eq('lang', lang);

    if (error) {
        console.error('Error saving trend:', error);
    } else {
        console.log('Trend saved or updated:', lang);
    }
}

// export const saveTrendDev = async (trend: Trend, lang: string) => {
//     const { data, error } = await supabaseSvc
//         .from('trends_dev')
//         .upsert({trend, lang}, {onConflict: 'lang'});

//     if (error) {
//         console.error('Error saving trend:', error);
//     } else {
//         console.log('Trend saved or updated:', data);
//     }
// };