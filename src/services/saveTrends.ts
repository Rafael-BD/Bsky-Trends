import { supabaseSvc } from "../config/supabase.ts";
import 'dotenv/config';

const isDev = process.env.DEV === 'true';

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
    if (!supabaseSvc) {
        console.warn('Supabase not initialized');
        return;
    }

    if (trend.words.length === 0 && trend.phrases.length === 0 && trend.hashtags.length === 0 && trend.globalWords.length === 0) {
        console.warn('Empty trend, not saving:', lang);
        return;
    }
    const updated_at = new Date().toISOString();

    const { data, error: selectError } = await supabaseSvc
        .from('trends')
        .select('lang')
        .eq('lang', lang)
        .single();

    if (selectError) {
        console.error('Error checking trend existence:', selectError);
        return;
    }

    if (data) {
        const { error: updateError } = await supabaseSvc
            .from('trends')
            .update({ trend: trend, lang: lang, updated_at: updated_at })
            .eq('lang', lang);

        if (updateError) {
            console.error('Error updating trend:', updateError);
        } else {
            console.log('Trend updated:', lang);
        }
    } else {
        const { error: insertError } = await supabaseSvc
            .from('trends')
            .insert({ trend: trend, lang: lang, updated_at: updated_at });

        if (insertError) {
            console.error('Error inserting trend:', insertError);
        } else {
            console.log('Trend inserted:', lang);
        }
    }
}

const saveTrendDev = async (trend: Trend, lang: string) => {
    if (!supabaseSvc) {
        console.warn('Supabase not initialized');
        return;
    }
    const updated_at = new Date().toISOString();

    const { data, error: selectError } = await supabaseSvc
        .from('trends_dev')
        .select('lang')
        .eq('lang', lang)
        .single();

    if (selectError) {
        console.error('Error checking trend existence:', selectError);
        return;
    }

    if (data) {
        const { error: updateError } = await supabaseSvc
            .from('trends_dev')
            .update({ trend: trend, lang: lang, updated_at: updated_at })
            .eq('lang', lang);

        if (updateError) {
            console.error('Error updating trend:', updateError);
        } else {
            console.log('Trend updated in dev table:', lang);
        }
    } else {
        const { error: insertError } = await supabaseSvc
            .from('trends_dev')
            .insert({ trend: trend, lang: lang, updated_at: updated_at });

        if (insertError) {
            console.error('Error inserting trend:', insertError);
        } else {
            console.log('Trend inserted in dev table:', lang);
        }
    }
}

// export const saveTrend = isDev ? saveTrendDev : saveTrendProd; /* create a table in supabase called trends_dev if you want to separate the dev and prod data */
export const saveTrend = saveTrendProd;