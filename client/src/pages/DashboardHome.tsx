import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Download, FileText, Upload, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [recentDate, setRecentDate] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ name: string; count: number }[]>([]);

  // Fetch data function
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch templates
    const { data: templatesData } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTemplates(templatesData || []);
    console.log('Fetched templates:', templatesData);

    // Fetch generated PDFs
    const { data: pdfsData } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('user_id', user.id);
    setPdfs(pdfsData || []);
    console.log('Fetched PDFs:', pdfsData);

    // Recent activity
    if (templatesData && templatesData.length > 0) {
      setRecentDate(new Date(templatesData[0].created_at).toLocaleDateString());
    } else {
      setRecentDate(null);
    }

    // Template usage
    if (templatesData && pdfsData) {
      const usageMap: Record<string, number> = {};
      pdfsData.forEach((pdf: any) => {
        usageMap[pdf.template_id] = (usageMap[pdf.template_id] || 0) + 1;
      });
      const usageArr = templatesData.map((tpl: any) => ({
        name: tpl.name,
        count: usageMap[tpl.id] || 0,
      }));
      setUsage(usageArr);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Subscribe to realtime changes for templates and generated_documents
    const templatesChannel = supabase
      .channel('public:templates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        (payload) => {
          console.log('Realtime event on templates:', payload);
          fetchData();
        }
      )
      .subscribe();

    const pdfsChannel = supabase
      .channel('public:generated_documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'generated_documents' },
        (payload) => {
          console.log('Realtime event on generated_documents:', payload);
          fetchData();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(templatesChannel);
      supabase.removeChannel(pdfsChannel);
    };
  }, [user]);

  if (!user) return null;

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
            <div className="text-2xl font-bold mb-1">{loading ? '...' : templates.length}</div>
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
            <div className="text-2xl font-bold mb-1">{loading ? '...' : pdfs.length}</div>
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
            <div className="text-xs text-gray-500">
              {loading ? '...' : recentDate ? `Last template uploaded
${recentDate}` : 'No uploads yet'}
            </div>
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
            {loading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : usage.length === 0 ? (
              <div className="text-xs text-gray-500">No templates yet</div>
            ) : (
              usage.map((tpl) => (
                <div key={tpl.name} className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" /> {tpl.name} <span className="ml-auto">{tpl.count} PDFs</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 