# Document Template Processor - API & Application Processing Mindmap

## 🏗️ Application Architecture

### Frontend (Client)
```
├── React + TypeScript
├── Port: 5173 (separate) / 5000 (combined)
├── Routing: Wouter
├── State Management: React Query
└── UI Components: Shadcn/UI + Tailwind CSS
```

### Backend (Server)
```
├── Node.js + Express + TypeScript
├── Port: 5000
├── Database: PostgreSQL (Supabase)
├── Storage: Supabase Storage
└── PDF Conversion: LibreOffice + JavaScript fallback
```

---

## 🔄 API Processing Flow

### 1. Template Upload Process
```
Frontend Request
    │
    ├── POST /api/templates
    │   ├── Multipart form data (file upload)
    │   └── Supported formats: .docx, .xlsx
    │
    ↓
Backend Processing
    │
    ├── File Validation
    │   ├── Check file type
    │   ├── Validate file size
    │   └── Security checks
    │
    ├── Placeholder Extraction
    │   ├── DOCX: Use easy-template-x library
    │   │   ├── Extract text content
    │   │   ├── Find {{placeholder}} patterns
    │   │   └── Find {placeholder} patterns
    │   │
    │   └── XLSX: Use ExcelJS library
    │       ├── Iterate through worksheets
    │       ├── Check each cell for placeholders
    │       └── Extract {{placeholder}} patterns
    │
    ├── Storage Operations
    │   ├── Generate unique filename
    │   ├── Upload to Supabase Storage (templates bucket)
    │   └── Get public URL
    │
    ├── Database Operations
    │   ├── Create template record
    │   ├── Store metadata (name, type, placeholders)
    │   └── Link to storage URL
    │
    └── Response
        ├── Template ID
        ├── Extracted placeholders
        └── Success status
```

### 2. Document Generation Process
```
Frontend Request
    │
    ├── POST /api/documents/generate
    │   ├── Template ID
    │   ├── Placeholder data (key-value pairs)
    │   └── Optional: convertToPdf flag
    │
    ↓
Backend Processing
    │
    ├── Template Retrieval
    │   ├── Fetch template from database
    │   ├── Download file from Supabase Storage
    │   └── Validate template exists
    │
    ├── Document Processing
    │   ├── DOCX Processing
    │   │   ├── Use easy-template-x TemplateHandler
    │   │   ├── Replace {{placeholder}} with data
    │   │   └── Generate processed buffer
    │   │
    │   └── XLSX Processing
    │       ├── Load workbook with ExcelJS
    │       ├── Iterate through sheets and cells
    │       ├── Replace placeholders with data
    │       └── Generate processed buffer
    │
    ├── PDF Conversion (Optional)
    │   ├── Primary: LibreOffice Conversion
    │   │   ├── Platform detection (Windows/Linux)
    │   │   ├── Try multiple LibreOffice paths
    │   │   ├── Execute headless conversion
    │   │   └── Return PDF buffer
    │   │
    │   └── Fallback: JavaScript Conversion
    │       ├── For DOCX: Limited support
    │       └── For XLSX: Convert to PDF programmatically
    │
    ├── Storage Operations
    │   ├── Upload processed document
    │   ├── Store in generated-docs bucket
    │   └── Generate download URL
    │
    ├── Database Operations
    │   ├── Create document record
    │   ├── Link to template
    │   └── Store metadata
    │
    └── Response
        ├── Document ID
        ├── Download URLs (original + PDF)
        └── Processing status
```

---

## 🗄️ Database Schema

### Templates Table
```sql
├── id (Primary Key)
├── name (Template filename)
├── file_type (docx/xlsx)
├── storage_url (Supabase storage path)
├── placeholders (JSON array)
├── created_at
└── updated_at
```

### Documents Table
```sql
├── id (Primary Key)
├── template_id (Foreign Key)
├── name (Generated document name)
├── file_type (docx/xlsx/pdf)
├── storage_url (Supabase storage path)
├── download_url (Public access URL)
├── placeholder_data (JSON object)
├── created_at
└── updated_at
```

---

## 🔧 Storage Architecture

### Supabase Storage Buckets
```
├── templates/
│   ├── Original template files
│   ├── Organized by upload timestamp
│   └── Format: timestamp-filename.ext
│
└── generated-docs/
    ├── Processed documents
    ├── Both original format and PDF
    └── Format: timestamp-processed-filename.ext
```

---

## 🚀 Deployment Modes

### Development Mode
```
Combined Server (Port 5000)
├── API endpoints (/api/*)
├── Vite dev server integration
├── Hot module replacement
└── Development error handling
```

### Server-Only Mode
```
API Server (Port 5000)
├── Only API endpoints
├── CORS enabled for frontend
├── No static file serving
└── Designed for separate frontend
```

### Production Mode
```
Static + API Server (Port 5000)
├── Built frontend assets
├── API endpoints
├── Optimized performance
└── Production error handling
```

---

## 🔀 Error Handling Flow

### Template Upload Errors
```
├── File validation failures
│   ├── Unsupported file type
│   ├── File too large
│   └── Corrupted file
│
├── Processing errors
│   ├── Placeholder extraction failure
│   ├── Storage upload failure
│   └── Database insertion failure
│
└── Response: Error message + status code
```

### Document Generation Errors
```
├── Template not found
├── Processing failures
│   ├── Invalid placeholder data
│   ├── Template corruption
│   └── Processing library errors
│
├── PDF conversion failures
│   ├── LibreOffice not available
│   ├── Conversion timeout
│   └── JavaScript fallback errors
│
└── Storage/Database errors
```

---

## 🔄 Data Flow Visualization

```
User Upload → Validation → Processing → Storage → Database → Response
     ↓
User Request → Template Fetch → Document Generation → PDF Conversion → Storage → Response
     ↓
User Download → URL Generation → File Serving → Download Complete
```

---

## 🛠️ Technology Stack Details

### Backend Dependencies
```
├── Core Framework
│   ├── Express.js (Web server)
│   ├── TypeScript (Type safety)
│   └── Node.js (Runtime)
│
├── Document Processing
│   ├── easy-template-x (DOCX templates)
│   ├── ExcelJS (XLSX processing)
│   └── LibreOffice (PDF conversion)
│
├── Database & Storage
│   ├── Drizzle ORM (Database operations)
│   ├── PostgreSQL (Primary database)
│   └── Supabase (Storage + Database hosting)
│
└── Utilities
    ├── Multer (File uploads)
    ├── CORS (Cross-origin requests)
    └── Zod (Validation schemas)
```

### Frontend Dependencies
```
├── React Framework
│   ├── React 18 (UI library)
│   ├── TypeScript (Type safety)
│   └── Vite (Build tool)
│
├── Routing & State
│   ├── Wouter (Client-side routing)
│   ├── React Query (Server state)
│   └── React Hook Form (Form handling)
│
├── UI Components
│   ├── Shadcn/UI (Component library)
│   ├── Tailwind CSS (Styling)
│   ├── Lucide React (Icons)
│   └── Framer Motion (Animations)
│
└── Utilities
    ├── Zod (Validation)
    ├── Date-fns (Date handling)
    └── Class Variance Authority (Component variants)
```

This mindmap structure provides a comprehensive overview of how the document template processor handles API requests, processes files, manages data flow, and integrates all components together.