import { createRequire } from 'module';const require = createRequire(import.meta.url);

// api/services/supabaseStorage.ts
import { createClient } from "@supabase/supabase-js";
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}
var supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
var supabase = supabaseClient;
var supabaseStorage = {
  async uploadFile(buffer, bucket, fileName) {
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      upsert: true,
      contentType: fileName.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return {
      id: fileName,
      url: publicUrl,
      name: fileName
    };
  },
  async downloadFile(bucket, fileName) {
    const { data, error } = await supabase.storage.from(bucket).download(fileName);
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }
};
export {
  supabase,
  supabaseStorage
};
