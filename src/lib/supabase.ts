import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Upload {
  id: string;
  filename: string;
  file_size: number;
  file_type: string | null;
  storage_path: string;
  public_url: string;
  provider: string;
  expires_at: string | null;
  created_at: string;
  user_id: string | null;
}
