import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://iffnjocrhqpcihmuoozs.supabase.co'; // ✅ include https://
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZm5qb2NyaHFwY2lobXVvb3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTg3ODEsImV4cCI6MjA2NTczNDc4MX0.3ZTOL9kOlB8xZOXPOGfRIqKIcOu8BFgFGfd4b0NMI8A'; // your full anon public key

export const supabase = createClient(supabaseUrl, supabaseKey);
