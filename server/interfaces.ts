export interface Template {
  id?: number;
  name: string;
  originalFileName: string;
  fileType: string;
  storageUrl: string;
  storageId: string;
  placeholders: string[];
  user_id: string;
  createdAt?: Date;
}

export interface Document {
  id?: number;
  templateId: number;
  name: string;
  fileType: string;
  storageUrl: string;
  storageId: string;
  placeholderData: Record<string, string>;
  user_id: string;
  createdAt?: Date;
}
