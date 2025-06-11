import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

// Try both VITE_ prefixed and non-prefixed env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseKey
);

export const supabase = supabaseClient;

export const supabaseStorage = {
  async uploadFile(buffer: Buffer, bucket: string, fileName: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        upsert: true,
        contentType: fileName.endsWith('.docx') 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      id: fileName,
      url: publicUrl,
      name: fileName
    };
  },

  async downloadFile(bucket: string, fileName: string): Promise<Buffer> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(fileName);

    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }
};
