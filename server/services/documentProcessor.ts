import ExcelJS from 'exceljs';
import { TemplateHandler } from 'easy-template-x';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

// Default LibreOffice path for Windows
const LIBREOFFICE_PATH = '""D:\\LibreOffice\\program\\soffice.com""';

export interface ProcessingResult {
  processedBuffer: Buffer;
  filename: string;
}

export class DocumentProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = tmpdir();
  }

  async extractPlaceholdersFromDocx(fileBuffer: Buffer): Promise<string[]> {
    try {
      const handler = new TemplateHandler();
      
      // First try to get the raw text content
      let text = '';
      try {
        text = await handler.getText(fileBuffer as any);
      } catch (textError) {
        console.log('getText failed, trying alternative method:', textError);
        // Fallback: use regex on the raw buffer content (for simple cases)
        text = fileBuffer.toString('utf8');
      }
      
      console.log('DOCX content sample:', text.substring(0, 500));
      
      // Extract placeholders using multiple patterns
      const placeholders = new Set<string>();
      
      // Pattern 1: {{placeholder}}
      const pattern1 = /\{\{([^}]+)\}\}/g;
      let match;
      while ((match = pattern1.exec(text)) !== null) {
        placeholders.add(match[1].trim());
      }
      
      // Pattern 2: {placeholder} (single braces)
      const pattern2 = /\{([^}]+)\}/g;
      while ((match = pattern2.exec(text)) !== null) {
        const content = match[1].trim();
        // Only add if it looks like a placeholder (letters, numbers, underscore)
        if (/^[a-zA-Z0-9_\s]+$/.test(content)) {
          placeholders.add(content);
        }
      }

      console.log('Extracted DOCX placeholders:', Array.from(placeholders));
      return Array.from(placeholders);
    } catch (error) {
      console.error('Error extracting placeholders from DOCX:', error);
      return [];
    }
  }

  async extractPlaceholdersFromExcel(fileBuffer: Buffer): Promise<string[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);
      
      const placeholders = new Set<string>();
      
      // Multiple placeholder patterns
      const patterns = [
        /\{\{([^}]+)\}\}/g,  // {{placeholder}}
        /\{([^}]+)\}/g,      // {placeholder}
      ];

      workbook.eachSheet((worksheet: any) => {
        console.log(`Processing Excel sheet: ${worksheet.name}`);
        worksheet.eachRow((row: any, rowNumber: number) => {
          row.eachCell((cell: any, colNumber: number) => {
            const cellValue = cell.value?.toString() || '';
            if (cellValue.includes('{')) {
              console.log(`Found potential placeholder in cell ${colNumber},${rowNumber}: "${cellValue}"`);
            }
            
            patterns.forEach(regex => {
              let match;
              // Reset regex lastIndex
              regex.lastIndex = 0;
              while ((match = regex.exec(cellValue)) !== null) {
                const content = match[1].trim();
                // Only add if it looks like a placeholder
                if (/^[a-zA-Z0-9_\s]+$/.test(content)) {
                  placeholders.add(content);
                  console.log(`Added Excel placeholder: "${content}"`);
                }
              }
            });
          });
        });
      });

      console.log('Extracted Excel placeholders:', Array.from(placeholders));
      return Array.from(placeholders);
    } catch (error) {
      console.error('Error extracting placeholders from Excel:', error);
      return [];
    }
  }

  async processDocxTemplate(templateBuffer: Buffer, placeholderData: Record<string, string>): Promise<ProcessingResult> {
    try {
      const handler = new TemplateHandler();
      
      // Process the template with placeholder data
      const templateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(placeholderData)) {
        templateData[key] = value;
      }
      
      const processedBuffer = await handler.process(templateBuffer as any, templateData);
      
      return {
        processedBuffer: Buffer.from(processedBuffer),
        filename: `processed_${Date.now()}.docx`
      };
    } catch (error) {
      console.error('Error processing DOCX template:', error);
      throw new Error('Failed to process DOCX template');
    }
  }

  async processExcelTemplate(templateBuffer: Buffer, placeholderData: Record<string, string>): Promise<ProcessingResult> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer as any);

      workbook.eachSheet((worksheet: any) => {
        worksheet.eachRow((row: any) => {
          row.eachCell((cell: any) => {
            const cellValue = cell.value?.toString() || '';
            let newValue = cellValue;
            
            for (const [key, value] of Object.entries(placeholderData)) {
              const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
              newValue = newValue.replace(regex, value);
            }
            
            if (newValue !== cellValue) {
              cell.value = newValue;
            }
          });
        });
      });

      const processedBuffer = Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
      
      return {
        processedBuffer,
        filename: `processed_${Date.now()}.xlsx`
      };
    } catch (error) {
      console.error('Error processing Excel template:', error);
      throw new Error('Failed to process Excel template');
    }
  }

  async convertToPdf(fileBuffer: Buffer, fileType: 'docx' | 'excel'): Promise<ProcessingResult> {
    try {
      const extension = fileType === 'docx' ? '.docx' : '.xlsx';
      const tempInputPath = path.join(this.tempDir, `input_${Date.now()}${extension}`);
      const workDir = path.join(this.tempDir, `pdf_${Date.now()}`);
      await fs.mkdir(workDir, { recursive: true });
      
      await fs.writeFile(tempInputPath, fileBuffer);

      // Use LibreOffice with full path to convert to PDF
      execSync(`${LIBREOFFICE_PATH} --headless --convert-to pdf --outdir ${workDir} ${tempInputPath}`);
      
      const pdfFileName = path.basename(tempInputPath, extension) + '.pdf';
      const pdfPath = path.join(workDir, pdfFileName);
      const processedBuffer = await fs.readFile(pdfPath);
      
      // Cleanup
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.rm(workDir, { recursive: true }).catch(() => {});

      return {
        processedBuffer,
        filename: `converted_${Date.now()}.pdf`
      };
    } catch (error) {
      console.error('Error converting to PDF:', error);
      throw new Error('Failed to convert to PDF');
    }
  }
}

export const documentProcessor = new DocumentProcessor();