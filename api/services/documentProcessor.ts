import ExcelJS from 'exceljs';

export const documentProcessor = {
  async extractPlaceholdersFromDocx(buffer: Buffer): Promise<string[]> {
    const zip = require('pizzip');
    const doc = new zip(buffer);
    const content = doc.files['word/document.xml'].asText();
    const matches = content.match(/\{([^}]+)\}/g) || [];
    return matches.map(match => match.slice(1, -1));
  },

  async extractPlaceholdersFromExcel(buffer: Buffer): Promise<string[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const placeholders = new Set<string>();

    workbook.worksheets.forEach(worksheet => {
      worksheet.eachRow(row => {
        row.eachCell(cell => {
          if (typeof cell.value === 'string') {
            const matches = cell.value.match(/\{([^}]+)\}/g) || [];
            matches.forEach(match => placeholders.add(match.slice(1, -1)));
          }
        });
      });
    });

    return Array.from(placeholders);
  },

  async processDocxTemplate(buffer: Buffer, data: Record<string, string>) {
    const zip = require('pizzip');
    const doc = new zip(buffer);
    let content = doc.files['word/document.xml'].asText();

    // Replace all placeholders with their values
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, value);
    }

    doc.file('word/document.xml', content);
    const processedBuffer = doc.generate({ type: 'nodebuffer' });

    return {
      processedBuffer,
      filename: 'processed.docx'
    };
  },

  async processExcelTemplate(buffer: Buffer, data: Record<string, string>) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    workbook.worksheets.forEach(worksheet => {
      worksheet.eachRow(row => {
        row.eachCell(cell => {
          if (typeof cell.value === 'string') {
            let value = cell.value;
            for (const [key, replacement] of Object.entries(data)) {
              const regex = new RegExp(`{${key}}`, 'g');
              value = value.replace(regex, replacement);
            }
            cell.value = value;
          }
        });
      });
    });

    const processedBuffer = await workbook.xlsx.writeBuffer() as Buffer;

    return {
      processedBuffer,
      filename: 'processed.xlsx'
    };
  },

  async convertToPdf(buffer: Buffer, fileType: 'docx' | 'excel') {
    // Note: In a serverless environment, PDF conversion might need a different approach
    // You might want to use a PDF conversion service or library that works in serverless
    return {
      processedBuffer: buffer,
      filename: `output.${fileType}`
    };
  }
};
