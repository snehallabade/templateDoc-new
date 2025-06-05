
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file for:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- SUPABASE_SERVICE_ROLE_KEY\n' +
    '- VITE_SUPABASE_ANON_KEY'
  );
}

// Use service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Alternative client with anon key for public operations
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

export interface StorageFile {
  id: string;
  name: string;
  url: string;
  bucket: string;
}

export class SupabaseStorageService {
  async uploadFile(fileBuffer: Buffer, bucket: 'templates' | 'generated-docs', fileName: string): Promise<StorageFile> {
    try {
      console.log(`Uploading file: ${fileName} to bucket: ${bucket}`);
      
      // Ensure bucket exists and is properly configured
      await this.ensureBucketExists(bucket);

      // Generate unique filename to avoid conflicts
      const uniqueFileName = `${Date.now()}_${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uniqueFileName, fileBuffer, {
          contentType: this.getContentType(fileName),
          upsert: true,
          duplex: 'half'
        });

      if (error) {
        console.error('Upload error details:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL with signed URL as fallback
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      // Also create a signed URL for better access
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(uniqueFileName, 3600); // 1 hour expiry

      const finalUrl = signedUrlData?.signedUrl || urlData.publicUrl;

      console.log(`File uploaded successfully. Public URL: ${urlData.publicUrl}`);
      console.log(`Signed URL: ${signedUrlData?.signedUrl}`);

      return {
        id: data.id || uniqueFileName,
        name: uniqueFileName,
        url: finalUrl,
        bucket
      };
    } catch (error) {
      console.error('Error uploading file to Supabase:', error);
      throw error;
    }
  }

  async downloadFile(bucket: 'templates' | 'generated-docs', fileName: string): Promise<Buffer> {
    try {
      console.log(`Attempting to download: ${fileName} from bucket: ${bucket}`);
      
      // Try with service role client first
      let { data, error } = await supabase.storage
        .from(bucket)
        .download(fileName);

      // If service role fails, try with public client for generated docs
      if (error && bucket === 'generated-docs') {
        console.log('Service role download failed, trying with public client...');
        const result = await supabasePublic.storage
          .from(bucket)
          .download(fileName);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Supabase download error:', error);
        throw new Error(`Download failed: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error('No data received from download');
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      console.log(`Successfully downloaded file, size: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('Error downloading file from Supabase:', error);
      throw error;
    }
  }

  getPublicUrl(bucket: 'templates' | 'generated-docs', fileName: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      console.log(`Checking if bucket "${bucket}" exists...`);
      
      // Try to get bucket info first
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket);
      
      if (bucketError && bucketError.message.includes('not found')) {
        console.log(`Bucket "${bucket}" not found, creating...`);
        // Bucket doesn't exist, try to create it
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/pdf',
            'application/msword',
            'application/vnd.ms-excel'
          ],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (createError) {
          console.warn(`Could not create bucket ${bucket}:`, createError.message);
          // Continue without throwing error - bucket might exist but we don't have list permissions
        } else {
          console.log(`Bucket "${bucket}" created successfully`);
        }
      } else if (!bucketError) {
        console.log(`Bucket "${bucket}" already exists`);
        
        // Ensure bucket is public
        const { error: updateError } = await supabase.storage.updateBucket(bucket, {
          public: true
        });
        
        if (updateError) {
          console.warn(`Could not update bucket ${bucket} to public:`, updateError.message);
        }
      }
    } catch (error) {
      console.warn('Error checking/creating bucket:', error);
      // Continue without throwing error
    }
  }

  private getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx':
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'xls':
        return 'application/vnd.ms-excel';
      default:
        // Fallback to Excel for unknown extensions if filename suggests Excel
        if (fileName.includes('excel') || fileName.includes('spreadsheet')) {
          return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        if (fileName.includes('word') || fileName.includes('document')) {
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }
}

export const supabaseStorage = new SupabaseStorageService();