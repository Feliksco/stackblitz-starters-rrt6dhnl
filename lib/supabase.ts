import { createClient } from '@supabase/supabase-js';

// Replace the text inside the quotes with your actual values from the Supabase Dashboard
// (Found in Settings -> API)
const supabaseUrl = 'https://wlcjbdhtqxgbjxdmcbhj.supabase.co';
const supabaseKey = 'sb_publishable_PH4AQloUavgC-1LPRzZJvQ_tvcidbZ5';

export const supabase = createClient(supabaseUrl, supabaseKey);