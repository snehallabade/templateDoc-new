import React, { useEffect, useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PlaceholderForm from '@/components/PlaceholderForm';
import DocumentProcessor from '@/components/DocumentProcessor';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Zap, Download, Shield } from 'lucide-react';
import { StorageFile } from '@/services/storageService';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Types from old Index.tsx
type Step = 'upload' | 'form' | 'process';

interface AppState {
  step: Step;
  templateFile: File | null;
  templateId: number | null;
  templateName: string | null;
  placeholders: string[];
  formData: Record<string, string>;
}

export default function TemplateWizard() {
  const location = useLocation();
  const [state, setState] = useState<AppState>({
    step: 'upload',
    templateFile: null,
    templateId: null,
    templateName: null,
    placeholders: [],
    formData: {}
  });
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Check for templateId in URL and preload template for Fill Data step
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get('templateId');
    if (templateId && !state.templateId) {
      setLoadingTemplate(true);
      (async () => {
        const { data } = await supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .single();
        if (data) {
          setState(prev => ({
            ...prev,
            step: 'form',
            templateId: data.id,
            templateName: data.name,
            placeholders: Array.isArray(data.placeholders) ? data.placeholders : [],
            templateFile: new File([], data.original_file_name || data.name || 'template.docx'), // Placeholder File object
          }));
        }
        setLoadingTemplate(false);
      })();
    }
    // eslint-disable-next-line
  }, [location.search]);

  const handleFileUpload = (file: File, placeholders: string[], templateId: number, templateName: string) => {
    setState({
      ...state,
      step: 'form',
      templateFile: file,
      templateId,
      templateName,
      placeholders
    });
  };

  const handleGenerate = async (formData: Record<string, string>) => {
    setState({
      ...state,
      step: 'process',
      formData
    });
  };

  const handleReset = () => {
    setState({
      step: 'upload',
      templateFile: null,
      templateId: null,
      templateName: null,
      placeholders: [],
      formData: {}
    });
  };

  const handleBack = () => {
    setState({
      ...state,
      step: 'upload'
    });
  };

  const renderStep = () => {
    if (loadingTemplate) {
      return <div className="text-center py-12 text-gray-500">Loading template...</div>;
    }
    switch (state.step) {
      case 'upload':
        return <FileUpload onFileUpload={handleFileUpload} />;
      case 'form':
        return (
          <PlaceholderForm
            placeholders={state.placeholders}
            templateFile={state.templateFile!}
            onGenerate={handleGenerate}
            onBack={handleBack}
          />
        );
      case 'process':
        return (
          <DocumentProcessor
            templateId={state.templateId!}
            templateName={state.templateName!}
            formData={state.formData}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Progress Indicator */}
      <div className="flex justify-center items-center space-x-2 sm:space-x-4 lg:space-x-8 mb-6 sm:mb-8">
        <div className={`flex items-center ${state.step === 'upload' ? 'text-blue-600' : state.step === 'form' || state.step === 'process' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${state.step === 'upload' ? 'bg-blue-600 text-white' : state.step === 'form' || state.step === 'process' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="ml-1 sm:ml-2 font-medium text-xs sm:text-sm lg:text-base hidden sm:inline">Upload Template</span>
          <span className="ml-1 font-medium text-xs sm:hidden">Upload</span>
        </div>
        <div className={`h-px w-4 sm:w-8 lg:w-16 ${state.step === 'form' || state.step === 'process' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center ${state.step === 'form' ? 'text-blue-600' : state.step === 'process' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${state.step === 'form' ? 'bg-blue-600 text-white' : state.step === 'process' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="ml-1 sm:ml-2 font-medium text-xs sm:text-sm lg:text-base hidden sm:inline">Fill Data</span>
          <span className="ml-1 font-medium text-xs sm:hidden">Fill</span>
        </div>
        <div className={`h-px w-4 sm:w-8 lg:w-16 ${state.step === 'process' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center ${state.step === 'process' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${state.step === 'process' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="ml-1 sm:ml-2 font-medium text-xs sm:text-sm lg:text-base hidden sm:inline">Download</span>
          <span className="ml-1 font-medium text-xs sm:hidden">Download</span>
        </div>
      </div>
      {/* Main Content */}
      <div className="mb-12">
        {renderStep()}
      </div>
      {/* Features Section - only show on upload step */}
      {state.step === 'upload' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="bg-blue-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Multiple Formats</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Support for DOCX and Excel templates with automatic placeholder detection
              </p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="bg-green-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Fast Processing</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Lightning-fast template processing with real-time preview
              </p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="bg-purple-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Multiple Outputs</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Generate documents in original format plus PDF version
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Footer */}
      <div className="bg-gray-50 border-t mt-8 sm:mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Professional document processing</span>
          </div>
          <p className="text-xs sm:text-sm px-4">
            Enterprise-grade template processing with LibreOffice PDF conversion and secure storage.
          </p>
        </div>
      </div>
    </div>
  );
} 