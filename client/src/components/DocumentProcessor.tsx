import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface ProcessedDocument {
  id: number;
  name: string;
  fileType: string;
  storageUrl: string;
  downloadUrl: string;
}

interface DocumentProcessorProps {
  templateId: number;
  templateName: string;
  formData: Record<string, string>;
  onReset: () => void;
}

const DocumentProcessor: React.FC<DocumentProcessorProps> = ({
  templateId,
  templateName,
  formData,
  onReset,
}) => {
  const [processedDocuments, setProcessedDocuments] = useState<
    ProcessedDocument[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateDocuments();
  }, []);

  const generateDocuments = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get the current session and access token
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      // Generate original format document
      const originalResponse = await fetch("/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          templateId,
          placeholderData: formData,
          outputFormat: "original",
        }),
      });

      if (!originalResponse.ok) {
        throw new Error("Failed to generate original document");
      }

      const originalResult = await originalResponse.json();

      // Generate PDF version
      const pdfResponse = await fetch("/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          templateId,
          placeholderData: formData,
          outputFormat: "pdf",
        }),
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF document");
      }

      const pdfResult = await pdfResponse.json();

      setProcessedDocuments([
        {
          id: originalResult.document.id,
          name: originalResult.document.name,
          fileType: originalResult.document.fileType,
          storageUrl: originalResult.document.storageUrl,
          downloadUrl: `/api/documents/${originalResult.document.id}/download`,
        },
        {
          id: pdfResult.document.id,
          name: pdfResult.document.name,
          fileType: pdfResult.document.fileType,
          storageUrl: pdfResult.document.storageUrl,
          downloadUrl: `/api/documents/${pdfResult.document.id}/download`,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate documents",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadDocument = async (doc: ProcessedDocument) => {
    try {
      // Get the current session and access token
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      
      const response = await fetch(doc.downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + (err instanceof Error ? err.message : err));
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "pdf") {
      return <FileText className="h-5 w-5" />;
    } else if (fileType === "excel" || fileType === "xlsx") {
      return <FileSpreadsheet className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return "PDF";
      case "docx":
        return "Word Document";
      case "excel":
      case "xlsx":
        return "Excel Spreadsheet";
      default:
        return fileType.toUpperCase();
    }
  };

  if (isProcessing) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8">
            {/* Animated processing visual */}
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="animate-spin h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 sm:inset-5 lg:inset-6 bg-blue-100 rounded-full animate-pulse flex items-center justify-center">
                <div className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>

            {/* Processing text with animated dots */}
            <div className="text-center space-y-2 sm:space-y-3">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
                Generating Documents
                <span className="inline-flex ml-1">
                  <span className="animate-bounce delay-0">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              </h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-md">
                Processing template:{" "}
                <span className="font-medium">{templateName}</span>
              </p>

              {/* Progress indicators */}
              <div className="mt-4 sm:mt-6 space-y-2">
                <div className="flex justify-center">
                  <div className="w-48 sm:w-64 lg:w-80 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  Converting to multiple formats...
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Processing Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={generateDocuments} variant="outline">
              Try Again
            </Button>
            <Button onClick={onReset} variant="outline">
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          Documents Generated Successfully
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="text-sm sm:text-base text-gray-600 bg-gray-50 p-3 sm:p-4 rounded-lg">
            Template: <span className="font-medium">{templateName}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {processedDocuments.map((doc, index) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 sm:p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-4">
                  {getFileIcon(doc.fileType)}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base break-words">
                      {doc.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">
                      {getFileTypeLabel(doc.fileType)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => downloadDocument(doc)}
                    size="sm"
                    className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 min-w-[100px]"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => window.open(doc.storageUrl, "_blank")}
                    size="sm"
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 min-w-[100px]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600 mb-3">
              Placeholder values used:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onReset} variant="outline" className="flex-1">
              Process Another Document
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentProcessor;
