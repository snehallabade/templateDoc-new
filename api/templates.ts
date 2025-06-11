import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, supabaseStorage } from './services/supabaseStorage';
import { documentProcessor } from './services/documentProcessor';
import { storage } from './services/storage';

interface FileRequest extends VercelRequest {
  body: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }
}

export default async function handler(req: FileRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(200).json({ ok: true });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Handle GET request (list templates)
        const templates = await storage.getAllTemplates();
        return res.status(200).json(templates);
        
      case 'POST':
        // Handle POST request (upload template)
        const file = req.body;
        const fileType = file.originalname?.endsWith('.docx') ? 'docx' : 'excel';
        
        let placeholders: string[] = [];
        if (fileType === 'docx') {
          placeholders = await documentProcessor.extractPlaceholdersFromDocx(file.buffer);
        } else {
          placeholders = await documentProcessor.extractPlaceholdersFromExcel(file.buffer);
        }        const fileName = `${Date.now()}-${file.originalname}`;
        const { data: storageFile, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, file.buffer);

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName);

        // Extract user ID from authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1]; // Bearer token
        const { data: { user } } = await supabase.auth.getUser(token);        if (!user?.id) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const template = await storage.createTemplate({
          name: file.originalname,
          originalFileName: file.originalname,
          fileType,
          storageUrl: publicUrl,
          storageId: fileName,
          placeholders,
          user_id: user.id
        });

        return res.status(200).json({ template, placeholders, storageFile });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
