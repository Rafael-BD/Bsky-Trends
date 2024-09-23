import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_KEY")!;
const svcKey = Deno.env.get("SVC_KEY")!;

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseSvc = createClient(supabaseUrl, svcKey);
