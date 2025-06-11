import { supabase } from './services/supabaseStorage';
import type { Template, Document } from './interfaces';

export const storage = {
  async createTemplate(data: Omit<Template, 'id' | 'createdAt'>) {
    const { data: template, error } = await supabase
      .from('templates')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return template;
  },

  async getAllTemplates() {
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return templates;
  },

  async getTemplate(id: number) {
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return template;
  },

  async createDocument(data: Omit<Document, 'id' | 'createdAt'>) {
    const { data: document, error } = await supabase
      .from('documents')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return document;
  },

  async getAllDocuments() {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return documents;
  }
};
