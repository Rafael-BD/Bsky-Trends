import { supabaseSvc } from "../config/supabase.ts";

const isDev = Deno.env.get('DEV') === 'true';

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
const saveTrendProd = async (trend: Trend, lang: string) => {
    // Se o trend não tiver itens nas listas, não salva
    if (trend.words.length === 0 && trend.phrases.length === 0 && trend.hashtags.length === 0 && trend.globalWords.length === 0) {
        console.warn('Empty trend, not saving:', lang);
        return;
    }
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

export const saveTrendDev = async (trend: Trend, lang: string) => {
    const updated_at = new Date().toISOString();
    const { error } = await supabaseSvc
        .from('trends_dev')
        .update({trend: trend, lang: lang, updated_at: updated_at})
        .eq('lang', lang);

    if (error) {
        console.error('Error saving trend:', error);
    } else {
        console.log('Trend saved or updated in dev table:', lang);
    }
};

export const saveTrend = isDev ? saveTrendDev : saveTrendProd;