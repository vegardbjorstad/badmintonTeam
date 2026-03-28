// src/logic/supabase.js

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Supabase klient
 * ----------------
 * Denne filen kan du trygt importere fra hvor som helst i prosjektet.
 * 
 * Når du setter prosjektet i produksjon, bytter du bare ut URL og ANON KEY her.
 */

const SUPABASE_URL = "https://jfpuaamfidhueetquxig.supabase.co";   // Sett inn din URL
const SUPABASE_ANON_KEY = "sb_publishable_2jKFqxcbtGxD7wkIzBAg0g_mnketQUA";                 // Sett inn din ANON KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;