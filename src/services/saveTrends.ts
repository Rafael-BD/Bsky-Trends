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
    const { data, error } = await supabaseSvc
        .from('trends')
        .upsert({trend, lang}, {onConflict: 'trend'});

    if (error) {
        console.error('Error saving trend:', error);
    } else {
        console.log('Trend saved or updated:', data);
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