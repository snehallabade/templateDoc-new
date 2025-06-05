#!/usr/bin/env node
import 'dotenv/config';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './storage.js';
import { documentProcessor } from './services/documentProcessor.js';
import { supabaseStorage } from './services/supabaseStorage.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class DocumentProcessorCLI {
  async start() {
    console.log('\n=== Document Processor CLI ===');
    console.log('Commands:');
    console.log('1. list-templates - Show all templates');
    console.log('2. upload-template <file-path> - Upload a new template');
    console.log('3. generate-document <template-id> [pdf] - Generate document from template');
    console.log('4. process-file <file-path> [pdf] - Complete workflow: upload + generate in one step');
    console.log('5. list-documents - Show all generated documents');
    console.log('6. help - Show this help');
    console.log('7. exit - Exit the CLI\n');

    this.promptCommand();
  }

  private promptCommand() {
    rl.question('Enter command: ', async (command) => {
      const parts = command.trim().split(' ');
      const cmd = parts[0];

      try {
        switch (cmd) {
          case 'list-templates':
            await this.listTemplates();
            break;
          case 'upload-template':
            await this.uploadTemplate(parts[1]);
            break;
          case 'generate-document':
            await this.generateDocument(parseInt(parts[1]), parts[2] === 'pdf');
            break;
          case 'process-file':
            await this.processFile(parts[1], parts[2] === 'pdf');
            break;
          case 'list-documents':
            await this.listDocuments();
            break;
          case 'help':
            await this.start();
            return;
          case 'exit':
            console.log('Goodbye!');
            rl.close();
            return;
          default:
            console.log('Unknown command. Type "help" for available commands.');
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
      }

      this.promptCommand();
    });
  }

  private async listTemplates() {
    console.log('\n--- Templates ---');
    const templates = await storage.getAllTemplates();
    
    if (templates.length === 0) {
      console.log('No templates found.');
      return;
    }

    templates.forEach(template => {
      console.log(`ID: ${template.id}`);
      console.log(`Name: ${template.name}`);
      console.log(`Type: ${template.fileType}`);
      console.log(`Placeholders: ${template.placeholders.join(', ')}`);
      console.log(`Created: ${template.createdAt}`);
      console.log('---');
    });
  }

  private async uploadTemplate(filePath: string) {
    if (!filePath) {
      console.log('Please provide a file path: upload-template <file-path>');
      return;
    }

    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const fileType = fileName.endsWith('.docx') ? 'docx' : 'excel';

      console.log(`Uploading ${fileName}...`);

      // Extract placeholders
      let placeholders: string[] = [];
      if (fileType === 'docx') {
        placeholders = await documentProcessor.extractPlaceholdersFromDocx(fileBuffer);
      } else {
        placeholders = await documentProcessor.extractPlaceholdersFromExcel(fileBuffer);
      }

      console.log(`Found placeholders: ${placeholders.join(', ')}`);

      // Upload to storage
      const storageFileName = `${Date.now()}-${fileName}`;
      const storageFile = await supabaseStorage.uploadFile(fileBuffer, 'templates', storageFileName);

      // Save to database
      const templateData = {
        name: fileName,
        originalFileName: fileName,
        fileType,
        storageUrl: storageFile.url,
        storageId: storageFile.id,
        placeholders
      };

      const template = await storage.createTemplate(templateData);
      
      console.log(`Template uploaded successfully!`);
      console.log(`Template ID: ${template.id}`);
      console.log(`Storage URL: ${storageFile.url}`);
    } catch (error) {
      console.error('Failed to upload template:', error instanceof Error ? error.message : String(error));
    }
  }

  private async generateDocument(templateId: number, convertToPdf: boolean = false) {
    if (!templateId) {
      console.log('Please provide a template ID: generate-document <template-id> [pdf]');
      return;
    }

    try {
      console.log(`\n=== Document Generation Process ===`);
      
      // Step 1: Get template
      console.log('1. Loading template from database...');
      const template = await storage.getTemplate(templateId);
      if (!template) {
        console.log('❌ Template not found.');
        return;
      }
      console.log(`✓ Template loaded: ${template.name} (${template.fileType})`);

      // Step 2: Handle placeholders
      const placeholderData: Record<string, string> = {};
      if (template.placeholders.length > 0) {
        console.log(`\n2. Found ${template.placeholders.length} placeholders: ${template.placeholders.join(', ')}`);
        console.log('--- Collecting Values ---');
        
        for (const placeholder of template.placeholders) {
          const value = await this.askQuestion(`Enter value for "${placeholder}": `);
          placeholderData[placeholder] = value;
        }
        console.log('✓ All placeholder values collected');
      } else {
        console.log('\n2. ⚠ No placeholders found in template');
      }

      // Step 3: Get template file from storage URL
      console.log('\n3. Accessing template file from Supabase...');
      const templateBuffer = await this.downloadFromUrl(template.storageUrl);
      console.log('✓ Template file accessed');

      // Step 4: Process document
      console.log('\n4. Processing document with placeholder data...');
      let processedResult;
      if (template.fileType === 'docx') {
        processedResult = await documentProcessor.processDocxTemplate(templateBuffer, placeholderData);
      } else {
        processedResult = await documentProcessor.processExcelTemplate(templateBuffer, placeholderData);
      }
      console.log('✓ Document processed successfully');

      let finalBuffer = processedResult.processedBuffer;
      let finalFileType = template.fileType;
      let finalFileName = `generated_${Date.now()}.${template.fileType}`;

      // Step 5: PDF conversion if requested
      if (convertToPdf) {
        try {
          console.log('\n5. Converting to PDF...');
          const pdfResult = await documentProcessor.convertToPdf(finalBuffer, template.fileType as 'docx' | 'excel');
          finalBuffer = pdfResult.processedBuffer;
          finalFileType = 'pdf';
          finalFileName = pdfResult.filename;
          console.log('✓ PDF conversion successful');
        } catch (pdfError) {
          console.log('⚠ PDF conversion failed, keeping original format');
          console.log('PDF Error:', pdfError instanceof Error ? pdfError.message : String(pdfError));
        }
      }

      // Step 6: Upload to Supabase
      console.log('\n6. Uploading processed document to Supabase...');
      const storageFile = await supabaseStorage.uploadFile(finalBuffer, 'generated-docs', finalFileName);
      console.log(`✓ Document uploaded successfully to Supabase`);

      // Step 7: Save to database
      console.log('\n7. Saving document record to database...');
      const documentData = {
        templateId: template.id,
        name: finalFileName,
        fileType: finalFileType,
        storageUrl: storageFile.url,
        storageId: storageFile.name, // Use the actual filename as storage ID
        placeholderData
      };

      const document = await storage.createDocument(documentData);
      console.log('✓ Document record saved to database');

      // Final summary
      console.log('\n=== Generation Complete ===');
      console.log(`✓ Document ID: ${document.id}`);
      console.log(`✓ Template: ${template.name}`);
      console.log(`✓ Output Type: ${finalFileType.toUpperCase()}`);
      console.log(`✓ Placeholders Filled: ${Object.keys(placeholderData).length}`);
      console.log(`✓ File stored in Supabase bucket: generated-docs`);
      console.log(`✓ Access via web interface for download`);

      if (Object.keys(placeholderData).length > 0) {
        console.log('\n--- Placeholder Values Used ---');
        Object.entries(placeholderData).forEach(([key, value]) => {
          console.log(`${key} → "${value}"`);
        });
      }

    } catch (error) {
      console.error('\n❌ Document generation failed:');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      
      if (error instanceof Error && error.stack) {
        console.error('\nDetailed error:');
        console.error(error.stack);
      }
    }
  }

  private async processFile(filePath: string, convertToPdf: boolean = false) {
    if (!filePath) {
      console.log('Please provide a file path: process-file <file-path> [pdf]');
      return;
    }

    try {
      console.log('\n=== Starting Complete File Processing ===');
      
      // Step 1: Read and validate file
      console.log('\n1. Reading template file...');
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const fileType = fileName.endsWith('.docx') ? 'docx' : 'excel';
      console.log(`✓ File loaded: ${fileName} (${fileType})`);

      // Step 2: Extract placeholders
      console.log('\n2. Extracting placeholders...');
      let placeholders: string[] = [];
      if (fileType === 'docx') {
        placeholders = await documentProcessor.extractPlaceholdersFromDocx(fileBuffer);
      } else {
        placeholders = await documentProcessor.extractPlaceholdersFromExcel(fileBuffer);
      }

      if (placeholders.length === 0) {
        console.log('⚠ No placeholders found in the template.');
        console.log('Creating processed document without placeholder replacement...');
        
        // Process without placeholder replacement
        let processedBuffer: Buffer;
        if (fileType === 'docx') {
          const result = await documentProcessor.processDocxTemplate(fileBuffer, {});
          processedBuffer = result.processedBuffer;
        } else {
          const result = await documentProcessor.processExcelTemplate(fileBuffer, {});
          processedBuffer = result.processedBuffer;
        }

        await this.saveProcessedFile(processedBuffer, fileType, convertToPdf, {});
        return;
      }

      console.log(`✓ Found ${placeholders.length} placeholders: ${placeholders.join(', ')}`);

      // Step 3: Collect user input for placeholders
      console.log('\n3. Collecting placeholder values...');
      const placeholderData: Record<string, string> = {};
      
      for (const placeholder of placeholders) {
        const value = await this.askQuestion(`Enter value for "${placeholder}": `);
        placeholderData[placeholder] = value;
      }

      console.log('\n4. Processing document with user data...');
      
      // Step 4: Process document
      let processedBuffer: Buffer;
      if (fileType === 'docx') {
        const result = await documentProcessor.processDocxTemplate(fileBuffer, placeholderData);
        processedBuffer = result.processedBuffer;
      } else {
        const result = await documentProcessor.processExcelTemplate(fileBuffer, placeholderData);
        processedBuffer = result.processedBuffer;
      }

      await this.saveProcessedFile(processedBuffer, fileType, convertToPdf, placeholderData);

    } catch (error) {
      console.error('Failed to process file:', error instanceof Error ? error.message : String(error));
    }
  }

  private async saveProcessedFile(
    processedBuffer: Buffer, 
    fileType: string, 
    convertToPdf: boolean, 
    placeholderData: Record<string, string>
  ) {
    // Step 5: Handle PDF conversion if requested
    let finalBuffer = processedBuffer;
    let finalFileType = fileType;
    let finalFileName = `processed_${Date.now()}.${fileType}`;

    if (convertToPdf) {
      try {
        console.log('\n5. Converting to PDF...');
        const pdfResult = await documentProcessor.convertToPdf(processedBuffer, fileType as 'docx' | 'excel');
        finalBuffer = pdfResult.processedBuffer;
        finalFileType = 'pdf';
        finalFileName = pdfResult.filename;
        console.log('✓ PDF conversion successful');
      } catch (pdfError) {
        console.log('⚠ PDF conversion failed, keeping original format');
        console.log('Error:', pdfError instanceof Error ? pdfError.message : String(pdfError));
      }
    }

    // Step 6: Save to local file system
    console.log('\n6. Saving processed document...');
    const outputPath = path.join(process.cwd(), finalFileName);
    await fs.writeFile(outputPath, finalBuffer);

    console.log('\n=== Processing Complete ===');
    console.log(`✓ Document generated successfully!`);
    console.log(`✓ File type: ${finalFileType}`);
    console.log(`✓ Placeholders filled: ${Object.keys(placeholderData).length}`);
    console.log(`✓ File saved to: ${outputPath}`);

    // Show summary of replacements
    if (Object.keys(placeholderData).length > 0) {
      console.log('\n--- Placeholder Replacements ---');
      Object.entries(placeholderData).forEach(([key, value]) => {
        console.log(`${key} → ${value}`);
      });
    }
  }

  private async listDocuments() {
    console.log('\n--- Generated Documents ---');
    const documents = await storage.getAllDocuments();
    
    if (documents.length === 0) {
      console.log('No documents found.');
      return;
    }

    documents.forEach(document => {
      console.log(`ID: ${document.id}`);
      console.log(`Name: ${document.name}`);
      console.log(`Type: ${document.fileType}`);
      console.log(`Template ID: ${document.templateId}`);
      console.log(`Storage ID: ${document.storageId}`);
      console.log(`Created: ${document.createdAt}`);
      console.log(`Data: ${JSON.stringify(document.placeholderData)}`);
      console.log(`URL: ${document.storageUrl}`);
      console.log('---');
    });
  }



  private async downloadFromUrl(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run CLI if called directly
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  const cli = new DocumentProcessorCLI();
  cli.start().catch(console.error);
}

export { DocumentProcessorCLI };