import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storage } from '../storage';
import { documentProcessor } from '../services/documentProcessor';
import { supabaseStorage } from '../services/supabaseStorage';
import { insertTemplateSchema } from '../../shared/schema';
import jwt from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string };
  }
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Add this middleware before your routes
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Log the Authorization header for debugging
  console.log('Authorization header:', req.headers['authorization']);
  // Expect JWT in Authorization header as 'Bearer <token>'
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const jwtSecret = String(process.env.SUPABASE_JWT_SECRET ?? 'YOUR_SUPABASE_JWT_SECRET');
    const decoded = jwt.verify(token, jwtSecret) as { sub: string };
    if (typeof (decoded as any).sub !== 'string') {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    req.user = { id: (decoded as any).sub as string };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
router.use(authenticate);

// GET /api/templates - Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await storage.getAllTemplates();
    
    const formattedTemplates = templates.map((template, index) => {
      return {
        [`Template ${template.id}`]: {
          ID: template.id,
          Name: template.name,
          "File Type": template.fileType,
          "Placeholder Count": template.placeholders.length,
          "Placeholders": template.placeholders.join(", ") || "None",
          "Upload Date": new Date(template.createdAt).toDateString(),
          "Upload Time": new Date(template.createdAt).toTimeString().split(' ')[0],
          "Download URL": template.storageUrl
        }
      };
    });

    const response = {
      "API Status": "Success",
      "Total Templates": templates.length,
      "Templates": Object.assign({}, ...formattedTemplates)
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch templates' 
    });
  }
});

// GET /api/templates/:id - Get specific template
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = await storage.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false,
        error: 'Template not found' 
      });
    }
    
    res.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        originalFileName: template.originalFileName,
        fileType: template.fileType,
        placeholderCount: template.placeholders.length,
        placeholders: template.placeholders,
        uploadDate: template.createdAt,
        downloadUrl: template.storageUrl
      }
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch template' 
    });
  }
});

// POST /api/templates - Upload new template
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileType = file.originalname.endsWith('.docx') ? 'docx' : 'excel';
    
    // Extract placeholders from the template
    let placeholders: string[] = [];
    if (fileType === 'docx') {
      placeholders = await documentProcessor.extractPlaceholdersFromDocx(file.buffer);
    } else {
      placeholders = await documentProcessor.extractPlaceholdersFromExcel(file.buffer);
    }

    // Upload to Supabase storage
    const fileName = `${Date.now()}-${file.originalname}`;
    const storageFile = await supabaseStorage.uploadFile(file.buffer, 'templates', fileName);

    // Save template metadata to database
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const templateData = {
      name: file.originalname,
      originalFileName: file.originalname,
      fileType,
      storageUrl: storageFile.url,
      storageId: fileName, // Store the actual filename for downloads
      placeholders,
      user_id: String(userId) // Ensure user_id is always a string
    };

    console.log('templateData before insert:', templateData);

    const template = await storage.createTemplate(templateData);
    
    res.json({
      template,
      placeholders,
      storageFile
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ error: 'Failed to upload template' });
  }
});

// GET /api/templates/:id/download - Download template file
router.get('/:id/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = await storage.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const fileName = template.storageId;
    const fileBuffer = await supabaseStorage.downloadFile('templates', fileName);
    
    res.setHeader('Content-Type', template.fileType === 'docx' 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${template.originalFileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({ error: 'Failed to download template' });
  }
});

export default router;