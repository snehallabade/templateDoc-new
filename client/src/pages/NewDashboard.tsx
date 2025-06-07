import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, FileSpreadsheet, File, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface FileStats {
  totalExcelGenerated: number;
  totalPdfsGenerated: number;
  totalDocsGenerated: number;
  totalFilesGenerated: number;
  totalExcelUploaded: number;
  totalDocsUploaded: number;
  totalFilesUploaded: number;
}

interface RecentFile {
  name: string;
  created_at: string;
  type: string;
}

export default function NewDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FileStats>({
    totalExcelGenerated: 0,
    totalPdfsGenerated: 0,
    totalDocsGenerated: 0,
    totalFilesGenerated: 0,
    totalExcelUploaded: 0,
    totalDocsUploaded: 0,
    totalFilesUploaded: 0,
  });
  const [recentUploadedFiles, setRecentUploadedFiles] = useState<RecentFile[]>([]);
  const [recentGeneratedFiles, setRecentGeneratedFiles] = useState<RecentFile[]>([]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch uploaded files (templates)
      const { data: templatesData } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch generated files (generated_documents)
      const { data: generatedData } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Helper functions
      const isExcel = (name: string) => /\.xlsx?$/.test(name);
      const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');
      const isDoc = (name: string) => /\.docx?$/.test(name);

      // Uploaded stats
      const totalExcelUploaded = templatesData?.filter(t => isExcel(t.name)).length || 0;
      const totalDocsUploaded = templatesData?.filter(t => isDoc(t.name)).length || 0;
      const totalFilesUploaded = templatesData?.length || 0;

      // Generated stats
      const totalExcelGenerated = generatedData?.filter(g => isExcel(g.name)).length || 0;
      const totalPdfsGenerated = generatedData?.filter(g => isPdf(g.name)).length || 0;
      const totalDocsGenerated = generatedData?.filter(g => isDoc(g.name)).length || 0;
      const totalFilesGenerated = generatedData?.length || 0;

      // Recent files
      const recentUploads = templatesData?.slice(0, 3).map(t => ({
        name: t.name,
        created_at: new Date(t.created_at).toLocaleDateString(),
        type: t.file_type
      })) || [];
      const recentGenerated = generatedData?.slice(0, 3).map(g => ({
        name: g.name,
        created_at: new Date(g.created_at).toLocaleDateString(),
        type: g.file_type
      })) || [];

      setStats({
        totalExcelGenerated,
        totalPdfsGenerated,
        totalDocsGenerated,
        totalFilesGenerated,
        totalExcelUploaded,
        totalDocsUploaded,
        totalFilesUploaded,
      });
      setRecentUploadedFiles(recentUploads);
      setRecentGeneratedFiles(recentGenerated);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Subscribe to realtime changes
    const templatesChannel = supabase
      .channel('public:templates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        () => fetchData()
      )
      .subscribe();

    const generatedChannel = supabase
      .channel('public:generated_documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'generated_documents' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(templatesChannel);
      supabase.removeChannel(generatedChannel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-8 w-full">
      {/* Top Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate('/dashboard/upload')}>
          <Upload className="mr-2 h-4 w-4" /> upload templates
        </Button>
      </div>

      {/* Stats Cards - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total Excel Files Generated</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalExcelGenerated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <FileText className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total PDFs Generated</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalPdfsGenerated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <File className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total Docs Generated</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalDocsGenerated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <File className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total Files Generated</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalFilesGenerated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section - Upload Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total Excel Files Uploaded</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalExcelUploaded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <File className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total Docs Files Uploaded</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalDocsUploaded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <File className="mr-2 h-5 w-5" />
              <span className="font-semibold">Total Files Uploaded</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalFilesUploaded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recently Uploaded Files */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Recently Uploaded Files</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : recentUploadedFiles.length === 0 ? (
                <div className="text-sm text-gray-500">No files uploaded yet</div>
              ) : (
                recentUploadedFiles.map((file, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{file.name}</span>
                    <span className="text-gray-500">{file.created_at}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Generated Files */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Recently Generated Files</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : recentGeneratedFiles.length === 0 ? (
                <div className="text-sm text-gray-500">No files generated yet</div>
              ) : (
                recentGeneratedFiles.map((file, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{file.name}</span>
                    <span className="text-gray-500">{file.created_at}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 