#!/usr/bin/env node
import { mkdir, writeFile, cp } from 'fs/promises';
import { join } from 'path';

async function setupVercelOutput() {
  const vercelDir = '.vercel';
  const outputDir = join(vercelDir, 'output');
  const staticDir = join(outputDir, 'static');
  const functionDir = join(outputDir, 'functions');
  const publicDir = 'dist/public';

  // Create directories
  await mkdir(join(staticDir), { recursive: true });
  await mkdir(join(functionDir), { recursive: true });
  
  // Copy static files from Vite build
  try {
    await cp(publicDir, staticDir, { recursive: true });
  } catch (error) {
    console.warn('No static files to copy yet');
  }

  // Static files config
  const staticConfig = {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      }
    ]
  };

  await writeFile(
    join(staticDir, '.vercel_build_output'),
    'This directory contains static files'
  );

  await writeFile(
    join(staticDir, 'config.json'),
    JSON.stringify(staticConfig, null, 2)
  );

  // Environment variables config
  const envConfig = {
    "version": 3,
    "routes": [
      {
        "src": "/api/.*",
        "headers": {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    ],
    "env": {
      "SUPABASE_URL": process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      "SUPABASE_ANON_KEY": process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    }
  };

  await writeFile(
    join(staticDir, 'config.json'),
    JSON.stringify(envConfig, null, 2)
  );
}

setupVercelOutput().catch(console.error);
