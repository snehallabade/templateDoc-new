import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function testSupabaseConnection() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    process.exit(1);
  }

  console.log('Testing Supabase connection with:');
  console.log('URL:', supabaseUrl);
  console.log('Key present:', supabaseKey ? 'Yes' : 'No');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.from('templates').select('count').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      process.exit(1);
    }

    console.log('Successfully connected to Supabase!');
    console.log('Test query result:', data);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSupabaseConnection();
