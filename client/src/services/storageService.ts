import { supabase } from '@/integrations/supabase/client';

export interface StorageFile {
  id: string;
  name: string;
  url: string;
  bucket: string;
}

class StorageService {
  async uploadFile(file: File, bucket: 'templates' | 'generated-docs', fileName?: string): Promise<StorageFile> {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uploadFileName = fileName || `${timestamp}-${file.name}`;
    
    console.log(`Uploading file to bucket: ${bucket}, fileName: ${uploadFileName}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uploadFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    console.log('File uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadFileName);

    return {
      id: data.id || uploadFileName,
      name: uploadFileName,
      url: urlData.publicUrl,
      bucket
    };
  }

  async uploadBlob(blob: Blob, bucket: 'templates' | 'generated-docs', fileName: string): Promise<StorageFile> {
    const timestamp = Date.now();
    const uploadFileName = `${timestamp}-${fileName}`;
    
    console.log(`Uploading blob to bucket: ${bucket}, fileName: ${uploadFileName}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uploadFileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading blob:', error);
      throw new Error(`Failed to upload blob: ${error.message}`);
    }

    console.log('Blob uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadFileName);

    return {
      id: data.id || uploadFileName,
      name: uploadFileName,
      url: urlData.publicUrl,
      bucket
    };
  }

  async downloadFile(bucket: 'templates' | 'generated-docs', fileName: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(fileName);

    if (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }

  getPublicUrl(bucket: 'templates' | 'generated-docs', fileName: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }

  async listFiles(bucket: 'templates' | 'generated-docs', path: string = '') {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 100, offset: 0 });
    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
    return data;
  }
}

export const storageService = new StorageService();
