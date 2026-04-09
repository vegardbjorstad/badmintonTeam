// src/logic/supabase.js

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://jfpuaamfidhueetquxig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2jKFqxcbtGxD7wkIzBAg0g_mnketQUA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
