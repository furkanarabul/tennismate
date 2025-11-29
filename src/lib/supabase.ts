import { createClient } from '@supabase/supabase-js'

// TODO: Add your Supabase URL and anon key here
// You can get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
