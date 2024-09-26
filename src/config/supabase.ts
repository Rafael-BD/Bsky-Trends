import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { load } from "https://deno.land/std@0.214.0/dotenv/mod.ts";

const env = await load();

const supabaseUrl = env["SUPABASE_URL"] || Deno.env.get("SUPABASE_URL")!;
const svcKey = env["SVC_KEY"] || Deno.env.get("SVC_KEY")!;

export const supabaseSvc = createClient(supabaseUrl, svcKey);
