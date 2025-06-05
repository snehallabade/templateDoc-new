# Document Template Processor - Complete Installation Guide

## Quick Start

**Windows Users:**
```bash
# Command Prompt
setup.bat


## What the Setup Script Does

### 1. Complete Setup (First Time Installation)
- ✅ Checks Node.js installation
- ✅ Checks npm installation  
- ✅ Installs all dependencies
- ✅ Creates environment configuration
- ✅ Validates Supabase credentials
- ✅ Sets up database schema
- ✅ Prepares application for use

### 2. Start Options
- **All-in-One**: Combined server and client (port 5000)
- **Server Only**: API backend only (port 5000)
- **Client Only**: Frontend only (port 5173)
- **Both Separately**: Development mode (ports 5000 + 5173)

### 3. Testing & Validation
- **API Testing**: Tests all endpoints and connectivity
- **Environment Validation**: Checks configuration
- **CLI Access**: Direct command-line interface

## Prerequisites

1. **Node.js 18+** - Download from https://nodejs.org/
2. **Supabase Project** - Get credentials from https://supabase.com/

## Step-by-Step Installation

### Step 1: Download Project
```bash
# Clone or download the project files
cd your-project-directory
```

### Step 2: Run Setup Script
```bash
# Windows Command Prompt
setup.bat


### Step 3: Choose Option 1 (Complete Setup)
The script will guide you through:
1. System requirements check
2. Dependency installation
3. Environment configuration
4. Database setup

### Step 4: Configure Supabase Credentials
When prompted, edit the `.env` file with your actual Supabase project credentials:

```env
# Get these from your Supabase project dashboard
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (your actual key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs... (your actual key)
```

### Step 5: Start Application
After setup, choose your preferred running mode:
- Option 2: All-in-one (recommended for most users)
- Option 3: Server only (for API development)
- Option 4: Client only (requires separate server)
- Option 5: Both separately (for development)

## Getting Supabase Credentials

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or select existing
3. Wait for project initialization

### 2. Get Project Details
From your project dashboard:

**Settings → API:**
- Copy Project URL (VITE_SUPABASE_URL)
- Copy anon public key (VITE_SUPABASE_ANON_KEY)  
- Copy service_role key (SUPABASE_SERVICE_ROLE_KEY)

**Settings → Database:**
- Copy Connection string URI (DATABASE_URL)
- Replace [YOUR-PASSWORD] with your actual password

## Running the Application

### Option 1: All-in-One (Recommended)
```bash
setup.bat → Option 2
```
- Access: http://localhost:5000
- Complete application in one interface

### Option 2: Development Mode
```bash
setup.bat → Option 5
```
- Server: http://localhost:5000 (API)
- Client: http://localhost:5173 (Frontend)
- Separate processes for development

### Option 3: Server Only
```bash
setup.bat → Option 3
```
- API only: http://localhost:5000
- Use for backend development or API testing

## API Testing

Use the built-in API testing:
```bash
setup.bat → Option 6
```

Or test manually:
```bash
# Health check
curl http://localhost:5000/

# API status
curl http://localhost:5000/api/health

# Database test
curl http://localhost:5000/api/test-db
```

## Troubleshooting

### Common Issues

**"Node.js not found"**
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

**"Environment variables not configured"**
- Run setup script Option 7 to validate
- Edit .env file with actual Supabase credentials
- Restart application after changes

**"Database connection failed"**
- Verify DATABASE_URL in .env file
- Check Supabase project status
- Ensure password is correct

**"Port already in use"**
- Stop other applications using ports 5000/5173
- Or modify PORT in .env file

### Getting Help

1. **Validate Environment**: Run setup script → Option 7
2. **Test API**: Run setup script → Option 6  
3. **Check Logs**: Look for error messages in terminal
4. **Reset Setup**: Delete .env file and run Option 1 again

## File Structure

After installation:
```
project/
├── setup.bat              # Windows setup script 
├── .env                    # Your environment variables
├── .env.example           # Template for environment
├── server/                # Backend API
├── client/                # Frontend React app
├── shared/                # Shared schemas
└── node_modules/          # Dependencies
```

## Next Steps

1. **Upload Templates**: Use DOCX or XLSX files with {{placeholder}} syntax
2. **Generate Documents**: Fill placeholders and download results
3. **API Integration**: Use the API endpoints for custom integrations
4. **CLI Usage**: Access command-line interface for batch operations

The setup script handles all configuration and provides a menu for ongoing use. No need to remember complex commands - just run the script and choose your option.