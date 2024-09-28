import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const svcKey = process.env.SVC_KEY!;

function initializeSupabase() {
    if(!supabaseUrl || !svcKey) {
        console.warn('Missing SUPABASE_URL or SVC_KEY');
        return null;
    }

    return createClient(supabaseUrl, svcKey);
}

export const supabaseSvc = initializeSupabase();
