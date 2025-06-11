import { createRequire } from 'module';const require = createRequire(import.meta.url);

// api/services/documentProcessor.ts
import * as ExcelJS from "exceljs";
import PizZip from "pizzip";
var processor = {
  async extractPlaceholdersFromDocx(buffer) {
    const doc = new PizZip(buffer);
    const content = doc.files["word/document.xml"].asText();
    const matches = content.match(/\{([^}]+)\}/g) || [];
    return matches.map((match) => match.slice(1, -1));
  },
  async extractPlaceholdersFromExcel(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const placeholders = /* @__PURE__ */ new Set();
    workbook.worksheets.forEach((worksheet) => {
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === "string") {
            const matches = cell.value.match(/\{([^}]+)\}/g) || [];
            matches.forEach((match) => placeholders.add(match.slice(1, -1)));
          }
        });
      });
    });
    return Array.from(placeholders);
  },
  async processDocxTemplate(buffer, data) {
    const doc = new PizZip(buffer);
    let content = doc.files["word/document.xml"].asText();
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{${key}}`, "g");
      content = content.replace(regex, value);
    }
    doc.file("word/document.xml", content);
    const processedBuffer = doc.generate({ type: "nodebuffer" });
    return {
      processedBuffer,
      filename: "processed.docx"
    };
  },
  async processExcelTemplate(buffer, data) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    workbook.worksheets.forEach((worksheet) => {
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === "string") {
            let value = cell.value;
            for (const [key, replacement] of Object.entries(data)) {
              const regex = new RegExp(`{${key}}`, "g");
              value = value.replace(regex, replacement);
            }
            cell.value = value;
          }
        });
      });
    });
    const processedBuffer = await workbook.xlsx.writeBuffer();
    return {
      processedBuffer,
      filename: "processed.xlsx"
    };
  },
  async convertToPdf(buffer, fileType) {
    return {
      processedBuffer: buffer,
      filename: `output.${fileType}`
    };
  }
};
var documentProcessor = processor;
export {
  documentProcessor
};
