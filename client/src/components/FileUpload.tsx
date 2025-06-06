import React, { useCallback, useState } from 'react';
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  onFileUpload: (file: File, placeholders: string[], templateId: number, templateName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<any>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    const fileType = file.name.toLowerCase();
    if (!fileType.endsWith('.docx') && !fileType.endsWith('.xlsx')) {
      setError('Please upload a DOCX or XLSX file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get the current session and access token
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload template');
      }

      const result = await response.json();
      
      setUploadedTemplate(result.template);
      
      // Call the parent callback with extracted data
      onFileUpload(
        file, 
        result.placeholders, 
        result.template.id, 
        result.template.name
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  if (uploadedTemplate) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">Template Uploaded Successfully</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{uploadedTemplate.name}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-medium">Template Details:</div>
            <div className="text-xs sm:text-sm text-gray-600">
              • Type: {uploadedTemplate.fileType.toUpperCase()}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              • Placeholders found: {uploadedTemplate.placeholders?.length || 0}
            </div>
            {uploadedTemplate.placeholders && uploadedTemplate.placeholders.length > 0 && (
              <div className="text-xs sm:text-sm text-gray-600 break-words">
                • Variables: {uploadedTemplate.placeholders.join(', ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div
            className={`text-center ${isDragging ? 'bg-blue-50' : ''} rounded-lg p-3 sm:p-4 lg:p-6`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-100 rounded-full">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-base sm:text-lg font-semibold">Upload Template</h3>
                <p className="text-sm sm:text-base text-gray-600 px-2">
                  Drag and drop your DOCX or XLSX template file here, or click to browse
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>DOCX</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>XLSX</span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".docx,.xlsx"
                  onChange={handleFileInput}
                  disabled={isProcessing}
                />
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isProcessing}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </div>
                  ) : (
                    'Choose File'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="mt-4 sm:mt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-6 sm:py-8">
                {/* Enhanced loading animation */}
                <div className="relative">
                  <div className="animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                  <div className="absolute inset-2 sm:inset-3 bg-blue-100 rounded-full animate-pulse"></div>
                </div>
                <div className="text-center space-y-2">
                  <span className="text-base sm:text-lg text-gray-700 font-medium">
                    Processing template
                    <span className="inline-flex ml-1">
                      <span className="animate-bounce delay-0">.</span>
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                    </span>
                  </span>
                  <p className="text-xs sm:text-sm text-gray-500">Extracting placeholders from your file</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-500">
        <div className="space-y-1">
          <p>Supported formats: Microsoft Word (.docx) and Excel (.xlsx)</p>
          <p>Use <code className="bg-gray-100 px-1 rounded">{'{{variable_name}}'}</code> syntax in your templates for placeholder replacement</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;