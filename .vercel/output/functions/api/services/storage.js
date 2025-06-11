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

// api/services/storage.ts
var storage = {
  async createTemplate(data) {
    const { data: template, error } = await supabase.from("templates").insert([data]).select().single();
    if (error) throw error;
    return template;
  },
  async getAllTemplates() {
    const { data: templates, error } = await supabase.from("templates").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return templates;
  },
  async getTemplate(id) {
    const { data: template, error } = await supabase.from("templates").select("*").eq("id", id).single();
    if (error) throw error;
    return template;
  },
  async createDocument(data) {
    const { data: document, error } = await supabase.from("documents").insert([data]).select().single();
    if (error) throw error;
    return document;
  },
  async getAllDocuments() {
    const { data: documents, error } = await supabase.from("documents").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return documents;
  }
};
export {
  storage
};
