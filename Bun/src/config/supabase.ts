import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const svcKey = process.env.SVC_KEY!;

export const supabaseSvc = createClient(supabaseUrl, svcKey);
