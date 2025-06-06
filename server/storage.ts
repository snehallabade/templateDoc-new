import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, templates, documents, type User, type InsertUser, type Template, type InsertTemplate, type Document, type InsertDocument } from "@shared/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Template methods
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByTemplate(templateId: number): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Template methods
  async createTemplate(template: InsertTemplate): Promise<Template> {
    console.log('Inserting template with user_id:', template.user_id);
    const result = await db.insert(templates).values({
      ...template,
      placeholders: template.placeholders as any,
      user_id: template.user_id
    }).returning();
    return result[0];
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const result = await db.select().from(templates).where(eq(templates.id, id));
    return result[0];
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  // Document methods
  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async getDocumentsByTemplate(templateId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.templateId, templateId));
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }
}

export const storage = new DatabaseStorage();
