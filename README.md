# Document Template Processor

A professional document processing application that transforms DOCX and Excel templates with dynamic data replacement. Upload templates with placeholder variables, fill in data through a user-friendly interface, and generate documents in both original format and PDF.

## Features

### Document Processing
- **DOCX Templates**: Microsoft Word documents with `{{placeholder}}` syntax
- **Excel Templates**: Excel spreadsheets with placeholder variables  
- **PDF Conversion**: High-quality PDF generation using LibreOffice
- **Dual Output**: Get both original format and PDF versions
- **Placeholder Detection**: Automatic extraction of variables from templates

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Progressive Upload**: Step-by-step template processing workflow
- **Real-time Validation**: Form validation with smart input types
- **Animated Feedback**: Professional loading animations and progress indicators
- **File Management**: Upload, process, and download document management

### API Architecture
- **RESTful API**: Complete backend API for external integrations
- **Supabase Integration**: Secure cloud storage and database
- **CLI Interface**: Command-line access for batch operations
- **Windows Compatible**: Native Windows batch and PowerShell scripts

## Quick Start

### Windows Users (Recommended)
```bash
# Command Prompt
setup.bat


### Manual Setup
```bash
npm install
# Configure .env with Supabase credentials
npm run dev
# Open http://localhost:5000
```

See `INSTALLATION-GUIDE.md` for complete setup instructions.

## Project Structure

```
├── server/
│   ├── api/
│   │   ├── templates.ts          # Template management endpoints
│   │   └── documents.ts          # Document generation endpoints
│   ├── services/
│   │   ├── documentProcessor.ts  # Core document processing logic
│   │   └── supabaseStorage.ts    # File storage service
│   ├── cli.ts                    # Command-line interface
│   ├── server-only.ts            # Server-only script for API mode
│   ├── storage.ts                # Database operations
│   └── routes.ts                 # Main route registration
├── client/                       # React frontend application
├── shared/
│   └── schema.ts                 # Database schema and types
├── setup.bat                     # Windows setup script
└── .env                         # Environment configuration
```

## API Documentation

### Templates Endpoints

#### Upload Template
```http
POST /api/templates
Content-Type: multipart/form-data

file: [DOCX or XLSX file]
```

**Response:**
```json
{
  "success": true,
  "template": {
    "id": 1,
    "name": "Contract Template.docx",
    "fileType": "docx",
    "storageUrl": "https://storage.url/file",
    "placeholders": ["client_name", "date", "amount"]
  },
  "placeholders": ["client_name", "date", "amount"],
  "message": "Template uploaded and placeholders extracted successfully"
}
```

#### List Templates
```http
GET /api/templates
```

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": 1,
      "name": "Contract Template.docx",
      "fileType": "docx",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "placeholders": ["client_name", "date", "amount"]
    }
  ]
}
```

#### Get Template
```http
GET /api/templates/:id
```

#### Download Template
```http
GET /api/templates/:id/download
```

### Documents Endpoints

#### Generate Document
```http
POST /api/documents/generate
Content-Type: application/json

{
  "templateId": 1,
  "placeholderData": {
    "client_name": "John Doe",
    "date": "2024-01-01", 
    "amount": "$5,000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "name": "Contract Template_processed.docx",
      "fileType": "docx",
      "storageUrl": "https://storage.url/processed-file",
      "downloadUrl": "/api/documents/1/download"
    },
    {
      "id": 2,
      "name": "Contract Template_processed.pdf", 
      "fileType": "pdf",
      "storageUrl": "https://storage.url/pdf-file",
      "downloadUrl": "/api/documents/2/download"
    }
  ],
  "message": "Documents generated successfully"
}
```

#### List Documents
```http
GET /api/documents
```

#### Get Document
```http
GET /api/documents/:id
```

#### Download Document
```http
GET /api/documents/:id/download
```

#### Get Documents by Template
```http
GET /api/documents/template/:templateId
```

### System Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected",
  "storage": "connected"
}
```

#### Test Database Connection
```http
GET /api/test-db
```

## Usage Examples

### Using the Web Interface

1. **Upload Template**: Choose a DOCX or XLSX file with `{{placeholder}}` syntax
2. **Fill Data**: Complete the form with values for detected placeholders
3. **Generate**: Click generate to create both original format and PDF versions
4. **Download**: Download either or both generated documents

### Using the API

#### Upload and Process a Template
```bash
# Upload template
curl -X POST \
  -F "file=@contract-template.docx" \
  http://localhost:5000/api/templates

# Generate document
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "placeholderData": {
      "client_name": "John Doe",
      "date": "2024-01-01",
      "amount": "$5,000"
    }
  }' \
  http://localhost:5000/api/documents/generate
```

### Using the CLI Interface

```bash
# Start CLI
npx tsx server/cli.ts

# Available commands:
list-templates              # Show all templates
upload-template <file>      # Upload new template
generate-document <id>      # Generate document from template  
list-documents              # Show all generated documents
help                        # Show all commands
exit                        # Close CLI
```

## Running Options

The application supports multiple deployment modes:

### 1. All-in-One Mode (Default)
```bash
npm run dev
# Access: http://localhost:5000
```
Combined server and client for complete application experience.

### 2. Server Only Mode
```bash
npx tsx server/server-only.ts
# API: http://localhost:5000
```
Backend API only for external integrations or custom frontends.

### 3. Client Only Mode  
```bash
npx vite --config vite.config.separate.ts
# Frontend: http://localhost:5173
```
Frontend only (requires separate server running on port 5000).

### 4. Development Mode
```bash
npx concurrently "npx tsx server/server-only.ts" "npx vite --config vite.config.separate.ts"
# Server: http://localhost:5000
# Client: http://localhost:5173
```
Separate processes for development with hot reload.

## Environment Configuration

Required environment variables in `.env` file:

```env
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Supabase Project Configuration  
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
NODE_ENV=development
PORT=5000
```

### Getting Supabase Credentials

1. **Create Project**: Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. **Get URL and Keys**: Settings → API
   - Project URL (VITE_SUPABASE_URL)
   - anon public key (VITE_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)
3. **Get Database URL**: Settings → Database → Connection string

## Database Schema

### Tables

**users**
```sql
- id: number (primary key)
- username: string (unique)
- passwordHash: string
- createdAt: timestamp
```

**templates**
```sql
- id: number (primary key)
- userId: number (foreign key)
- name: string
- fileType: string ('docx' | 'xlsx')
- storageUrl: string
- placeholders: string[] (JSON)
- createdAt: timestamp
```

**documents**
```sql
- id: number (primary key) 
- templateId: number (foreign key)
- name: string
- fileType: string ('docx' | 'xlsx' | 'pdf')
- storageUrl: string
- placeholderData: object (JSON)
- createdAt: timestamp
```

### Database Operations
```bash
# Push schema changes
npm run db:push

# Check types
npm run check
```

## Document Processing Details

### Supported Template Formats
- **DOCX**: Microsoft Word documents
- **XLSX**: Microsoft Excel spreadsheets

### Placeholder Syntax
Use `{{variable_name}}` in your templates:
```
Dear {{client_name}},

Your contract dated {{date}} for {{amount}} is ready.

Thank you,
{{company_name}}
```

### Processing Pipeline
1. **Upload**: File validation and storage
2. **Extraction**: Automatic placeholder detection
3. **Generation**: Data replacement in template
4. **Conversion**: PDF generation using LibreOffice
5. **Storage**: Secure file storage with download URLs

### PDF Conversion
- **Engine**: LibreOffice for high-quality conversion
- **Preservation**: Maintains formatting, colors, fonts, layouts
- **Compatibility**: Works with complex documents and spreadsheets

## Security Features

- **File Validation**: Type and size checking (50MB limit)
- **Environment Protection**: All credentials in environment variables
- **Input Sanitization**: XSS and injection protection
- **Secure Storage**: Supabase with proper access controls
- **Error Handling**: No sensitive data in error responses

## Error Handling

### API Error Responses
```json
{
  "error": "Template not found",
  "details": "No template found with ID 123", 
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Common Error Codes
- **400**: Bad Request - Invalid input data
- **404**: Not Found - Resource doesn't exist
- **422**: Unprocessable Entity - Validation failed
- **500**: Internal Server Error - Server processing error

## Performance

### File Processing
- **Concurrent**: Multiple file processing support
- **Streaming**: Large file handling with streams
- **Caching**: Template metadata caching
- **Compression**: Automatic file compression

### Scalability
- **Stateless**: API designed for horizontal scaling
- **Database**: PostgreSQL with connection pooling
- **Storage**: Supabase cloud storage with CDN
- **Memory**: Efficient memory usage with streaming

## Development

### Project Dependencies
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Storage**: Supabase
- **Processing**: easy-template-x, ExcelJS, LibreOffice

### Development Workflow
1. **Setup**: Run `setup.bat` for complete environment setup
2. **Development**: Use development mode for hot reload
3. **Testing**: Built-in API testing and validation
4. **Building**: Production build with `npm run build`

### Testing
```bash
# API testing via setup script
setup.bat → Option 6

# Manual API testing
curl http://localhost:5000/api/health

# Environment validation
setup.bat → Option 7
```

## Deployment

### Local Deployment
Use the setup script for complete local installation and configuration.

### Production Deployment
1. **Build**: `npm run build`
2. **Environment**: Configure production environment variables
3. **Database**: Set up production PostgreSQL
4. **Storage**: Configure production Supabase project
5. **Server**: Deploy built application

## Support

### Troubleshooting
1. **Environment Issues**: Run environment validation
2. **API Problems**: Use built-in API testing
3. **Database Errors**: Check DATABASE_URL configuration
4. **Storage Issues**: Verify Supabase credentials

### Common Solutions
- **Port Conflicts**: Change PORT in .env file
- **Database Connection**: Verify Supabase project status
- **File Upload Errors**: Check file size and type
- **PDF Conversion**: Ensure LibreOffice is installed

The application provides comprehensive logging and error messages to help diagnose and resolve issues quickly.