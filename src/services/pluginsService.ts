import { supabase } from "../../shared/utils/supabaseClient.ts";

export async function fetchTrends(country: string) {
    const { data, error } = await supabase
        .from("trends")
        .select("name, url")
        .eq("country", country)
        .limit(10);

    if (error) {
        console.error("Error fetching trends", error);
        return [];
    }

    return data;
}