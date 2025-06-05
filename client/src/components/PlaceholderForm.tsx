
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlaceholderFormProps {
  placeholders: string[];
  templateFile: File;
  onGenerate: (formData: Record<string, string>) => void;
  onBack: () => void;
}

const PlaceholderForm: React.FC<PlaceholderFormProps> = ({ 
  placeholders, 
  templateFile, 
  onGenerate, 
  onBack 
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (placeholder: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      await onGenerate(formData);
    } finally {
      setIsGenerating(false);
    }
  };

  const getInputType = (placeholder: string): string => {
    const lowerPlaceholder = placeholder.toLowerCase();
    if (lowerPlaceholder.includes('email')) return 'email';
    if (lowerPlaceholder.includes('phone')) return 'tel';
    if (lowerPlaceholder.includes('date')) return 'date';
    if (lowerPlaceholder.includes('number') || lowerPlaceholder.includes('amount')) return 'number';
    return 'text';
  };

  const isTextArea = (placeholder: string): boolean => {
    const lowerPlaceholder = placeholder.toLowerCase();
    return lowerPlaceholder.includes('address') || 
           lowerPlaceholder.includes('description') || 
           lowerPlaceholder.includes('notes') ||
           lowerPlaceholder.includes('comment');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">Fill Template: {templateFile.name}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Template Fields</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">
              Fill in the values for the placeholders found in your template
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {placeholders.map((placeholder) => (
                <div key={placeholder} className="space-y-2">
                  <Label htmlFor={placeholder} className="text-sm font-medium">
                    {placeholder.charAt(0).toUpperCase() + placeholder.slice(1).replace(/[_-]/g, ' ')}
                  </Label>
                  {isTextArea(placeholder) ? (
                    <Textarea
                      id={placeholder}
                      placeholder={`Enter ${placeholder}`}
                      value={formData[placeholder] || ''}
                      onChange={(e) => handleInputChange(placeholder, e.target.value)}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <Input
                      id={placeholder}
                      type={getInputType(placeholder)}
                      placeholder={`Enter ${placeholder}`}
                      value={formData[placeholder] || ''}
                      onChange={(e) => handleInputChange(placeholder, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isGenerating}
          >
            Back to Upload
          </Button>
          
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      </form>

      {placeholders.length === 0 && (
        <Alert>
          <AlertDescription>
            No placeholders found in the template. Please make sure your template contains placeholders in the format {`{{placeholder_name}}`}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PlaceholderForm;
