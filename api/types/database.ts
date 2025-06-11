export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: number
          name: string
          fileType: string
          storageUrl: string
          storageId: string
          placeholderData: Json
          templateId: number
          user_id: string
          createdAt: string
        }
        Insert: {
          id?: number
          name: string
          fileType: string
          storageUrl: string
          storageId: string
          placeholderData: Json
          templateId: number
          user_id: string
          createdAt?: string
        }
        Update: {
          id?: number
          name?: string
          fileType?: string
          storageUrl?: string
          storageId?: string
          placeholderData?: Json
          templateId?: number
          user_id?: string
          createdAt?: string
        }
      }
      templates: {
        Row: {
          id: number
          name: string
          originalFileName: string
          fileType: string
          storageUrl: string
          storageId: string
          placeholders: string[]
          user_id: string
          createdAt: string
        }
        Insert: {
          id?: number
          name: string
          originalFileName: string
          fileType: string
          storageUrl: string
          storageId: string
          placeholders: string[]
          user_id: string
          createdAt?: string
        }
        Update: {
          id?: number
          name?: string
          originalFileName?: string
          fileType?: string
          storageUrl?: string
          storageId?: string
          placeholders?: string[]
          user_id?: string
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
