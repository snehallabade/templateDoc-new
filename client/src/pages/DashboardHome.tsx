import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Download, FileText, Upload, BarChart3 } from 'lucide-react';

export default function DashboardHome() {
  const navigate = useNavigate();

  return (
    <div className="p-8 w-full">
      <h1 className="text-2xl font-bold mb-1">PDF Wizard Dashboard</h1>
      <p className="mb-6 text-gray-600">Your central hub for template management and PDF creation</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Templates Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <FileText className="mr-2 h-5 w-5" />
              <span className="font-semibold">Templates</span>
            </div>
            <div className="text-2xl font-bold mb-1">1</div>
            <div className="text-xs text-gray-500 mb-2">Total templates available</div>
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/dashboard/upload')}>Manage Templates</Button>
          </CardContent>
        </Card>
        {/* Generated PDFs Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Download className="mr-2 h-5 w-5" />
              <span className="font-semibold">Generated PDFs</span>
            </div>
            <div className="text-2xl font-bold mb-1">0</div>
            <div className="text-xs text-gray-500 mb-2">PDFs generated</div>
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate('/dashboard/upload')}>Generate New PDF</Button>
          </CardContent>
        </Card>
        {/* Recent Activity Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Clock className="mr-2 h-5 w-5" />
              <span className="font-semibold">Recent Activity</span>
            </div>
            <div className="text-xs text-gray-500">Last template uploaded<br />20/05/2025</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Button variant="outline" onClick={() => navigate('/dashboard/upload')}>
                <Upload className="mr-2 h-4 w-4" /> Upload Templates
              </Button>
              <Button variant="outline" onClick={() => window.open('https://www.youtube.com/', '_blank')}>
                View Tutorial
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/upload')}>
              <Download className="mr-2 h-4 w-4" /> Generate PDF
            </Button>
          </CardContent>
        </Card>
        {/* Template Usage */}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">Template Usage</div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" /> demo <span className="ml-auto">0 PDFs</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 