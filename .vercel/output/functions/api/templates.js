import { createRequire } from 'module';const require = createRequire(import.meta.url);

// api/services/supabaseStorage.ts
import { createClient } from "@supabase/supabase-js";
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}
var supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
var supabase = supabaseClient;

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

// api/services/storage.ts
var storage = {
  async createTemplate(data) {
    const { data: template, error } = await supabase.from("templates").insert([data]).select().single();
    if (error) throw error;
    return template;
  },
  async getAllTemplates() {
    const { data: templates, error } = await supabase.from("templates").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return templates;
  },
  async getTemplate(id) {
    const { data: template, error } = await supabase.from("templates").select("*").eq("id", id).single();
    if (error) throw error;
    return template;
  },
  async createDocument(data) {
    const { data: document, error } = await supabase.from("documents").insert([data]).select().single();
    if (error) throw error;
    return document;
  },
  async getAllDocuments() {
    const { data: documents, error } = await supabase.from("documents").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return documents;
  }
};

// api/templates.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    return res.status(200).json({ ok: true });
  }
  try {
    switch (req.method) {
      case "GET":
        const templates = await storage.getAllTemplates();
        return res.status(200).json(templates);
      case "POST":
        const file = req.body;
        const fileType = file.originalname?.endsWith(".docx") ? "docx" : "excel";
        let placeholders = [];
        if (fileType === "docx") {
          placeholders = await documentProcessor.extractPlaceholdersFromDocx(file.buffer);
        } else {
          placeholders = await documentProcessor.extractPlaceholdersFromExcel(file.buffer);
        }
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data: storageFile, error: uploadError } = await supabase.storage.from("templates").upload(fileName, file.buffer);
        if (uploadError) {
          throw uploadError;
        }
        const { data: { publicUrl } } = supabase.storage.from("templates").getPublicUrl(fileName);
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user?.id) {
          return res.status(401).json({ error: "Unauthorized" });
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
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
export {
  handler as default
};
