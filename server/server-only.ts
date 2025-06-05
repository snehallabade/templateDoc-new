#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Document Processor API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      testDb: '/api/test-db',
      templates: '/api/templates',
      documents: '/api/documents'
    },
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    const server = await registerRoutes(app);
    
    server.listen(PORT, () => {
      console.log('\n=== Document Processor API Server ===');
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Test database: http://localhost:${PORT}/api/test-db`);
      console.log('\nAPI Endpoints:');
      console.log(`  GET    /api/templates           - List all templates`);
      console.log(`  POST   /api/templates           - Upload new template`);
      console.log(`  GET    /api/templates/:id       - Get template by ID`);
      console.log(`  GET    /api/templates/:id/download - Download template`);
      console.log(`  POST   /api/documents/generate  - Generate document`);
      console.log(`  GET    /api/documents           - List all documents`);
      console.log(`  GET    /api/documents/:id       - Get document by ID`);
      console.log(`  GET    /api/documents/:id/download - Download document`);
      console.log('\nTo test with CLI: npm run cli');
      console.log('To test with curl: see examples below\n');
      
      // Example curl commands
      console.log('Example API calls:');
      console.log(`curl http://localhost:${PORT}/api/health`);
      console.log(`curl http://localhost:${PORT}/api/test-db`);
      console.log(`curl http://localhost:${PORT}/api/templates`);
      console.log('\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();