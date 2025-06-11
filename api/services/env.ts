import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

// Load environment variables from .env file
config({ path: path.resolve(rootDir, '.env') });

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabase: {
    url: getRequiredEnvVar('SUPABASE_URL') || getRequiredEnvVar('VITE_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('SUPABASE_ANON_KEY') || getRequiredEnvVar('VITE_SUPABASE_ANON_KEY'),
  }
};
