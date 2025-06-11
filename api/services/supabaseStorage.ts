import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';
import { env } from './env.js';

console.log('Initializing Supabase client with:', {
  url: env.supabase.url,
  keyPresent: env.supabase.anonKey ? true : false
});

const supabaseClient = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey
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
