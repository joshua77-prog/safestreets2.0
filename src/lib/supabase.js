import { createClient } from "@supabase/supabase-js";

const env = (typeof import.meta !== "undefined" && import.meta.env) || (typeof process !== "undefined" && process.env) || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "https://wksgmggqroddmagpbmzw.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "sb_publishable_5eVncrzjTokMMMuBXCOu_g_qCfJ-X8Z";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);