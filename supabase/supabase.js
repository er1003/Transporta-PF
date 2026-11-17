import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gzdjbvkfzctdylvqczyn.supabase.co";
// Chave pública (publishable) — segura no front-end; a proteção real vem das políticas RLS do Supabase.
const SUPABASE_KEY = "sb_publishable_NI3vYIdfPs6B43dRLYNuuQ_-ZHhRha-";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
