import { Routes, Route, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import NewDashboard from './NewDashboard';
import TemplateWizard from '@/components/TemplateWizard';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Edit, Trash2, Eye, Download as DownloadIcon, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { storageService } from '@/services/storageService';

function EditTemplatePage() {
  return <div className="p-8 w-full"><h1 className="text-2xl font-bold">Edit Template</h1></div>;
}

function TemplateManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<{id: number|null, name: string}>({id: null, name: ''});
  const [toastMsg, setToastMsg] = useState<string|null>(null);
  const pageSize = 6;

  // Fetch templates from Supabase (uploaded only)
  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTemplates(data || []);
    } catch (error) {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchTemplates();
    // Real-time updates
    const templatesChannel = supabase
      .channel('public:templates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        () => fetchTemplates()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(templatesChannel);
    };
  }, [user]);

  // Search and pagination
  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.original_file_name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalTemplates = filteredTemplates.length;
  const totalPages = Math.ceil(totalTemplates / pageSize);
  const paginatedTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);

  // Delete template with confirmation and toast
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
        setToastMsg('Failed to delete template: ' + (error.message || 'Unknown error'));
      } else {
        setToastMsg('Template deleted successfully.');
      }
    } catch (err) {
      console.error('Delete exception:', err);
      setToastMsg('Failed to delete template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    setDeletingId(null);
    setShowConfirm({id: null, name: ''});
    fetchTemplates();
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="p-8 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 shadow-lg rounded px-4 py-2 text-sm text-gray-800 animate-fade-in">
          {toastMsg}
        </div>
      )}
      {/* Confirm Dialog */}
      {showConfirm.id !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-xs text-center">
            <div className="mb-4 text-lg font-semibold">Delete Template</div>
            <div className="mb-6 text-gray-700">Are you sure you want to delete <span className="font-bold">{showConfirm.name}</span>?</div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowConfirm({id: null, name: ''})} disabled={deletingId !== null}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(showConfirm.id!)} disabled={deletingId !== null}>
                {deletingId === showConfirm.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold">Template Management</h1>
          <p className="text-gray-600">Upload and manage Word templates with predefined placeholders</p>
        </div>
        <Button className="h-10 px-6 text-base font-semibold" variant="default">
          + Upload Template
        </Button>
      </div>

      {/* Grid Section */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-lg font-semibold">Your Templates</h2>
        <Input
          className="w-full md:w-64"
          placeholder="Search templates"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading...</div>
        ) : paginatedTemplates.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No templates found.</div>
        ) : (
          paginatedTemplates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow p-4 flex flex-col h-64">
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-20 w-full bg-gray-100 rounded flex items-center justify-center mb-2">
                  {/* Placeholder for preview image */}
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <div className="font-semibold text-base truncate">{template.name}</div>
                <div className="text-xs text-gray-500 truncate">{template.original_file_name}</div>
                <div className="text-xs text-gray-500">
                  {/* Show placeholder info if available, else dummy */}
                  {Array.isArray(template.placeholders)
                    ? `${template.placeholders.length} placeholders | 1 section`
                    : '0 placeholders | 1 section'}
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-4">
                <Button size="sm" variant="outline" className="flex-1 flex gap-1 items-center" onClick={() => navigate(`/dashboard/upload?templateId=${template.id}`)}>
                  <Eye className="h-4 w-4" /> Use Template
                </Button>
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => navigate(`/dashboard/templates/edit/${template.id}`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setShowConfirm({id: template.id, name: template.name})} disabled={deletingId === template.id}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Pagination Footer */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * pageSize + 1} – {Math.min(page * pageSize, totalTemplates)} of {totalTemplates} templates
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function GeneratedPDFsPage() {
  const { user } = useAuth();
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<{id: number|null, name: string}>({id: null, name: ''});
  const [toastMsg, setToastMsg] = useState<string|null>(null);

  // Fetch generated PDFs from Supabase
  const fetchPDFs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPdfs(data || []);
    } catch (error) {
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchPDFs();
    // Real-time updates
    const pdfsChannel = supabase
      .channel('public:generated_documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'generated_documents' },
        () => fetchPDFs()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(pdfsChannel);
    };
  }, [user]);

  // Helper to format time info
  function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'less than a minute ago';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  }

  // View/Save PDF
  const handleView = (pdf: any) => {
    const url = storageService.getPublicUrl('generated-docs', pdf.storage_path);
    window.open(url, '_blank');
  };

  // Download PDF (fetch as blob for best compatibility)
  const handleDownload = async (pdf: any) => {
    try {
      const { data, error } = await supabase.storage.from('generated-docs').download(pdf.storage_path);
      if (error || !data) {
        setToastMsg('Failed to download PDF.');
        setTimeout(() => setToastMsg(null), 3500);
        return;
      }
      const blobUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdf.name || pdf.storage_path;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setToastMsg('Failed to download PDF.');
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Delete PDF (with confirmation and toast)
  const handleDelete = async (pdf: any) => {
    setDeletingId(pdf.id);
    try {
      // Delete from Supabase Storage
      await supabase.storage.from('generated-docs').remove([pdf.storage_path]);
      // Delete from generated_documents table
      const { error } = await supabase.from('generated_documents').delete().eq('id', pdf.id);
      if (error) {
        setToastMsg('Failed to delete PDF: ' + (error.message || 'Unknown error'));
      } else {
        setToastMsg('PDF deleted successfully.');
      }
    } catch (err) {
      setToastMsg('Failed to delete PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    setDeletingId(null);
    setShowConfirm({id: null, name: ''});
    fetchPDFs();
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="p-8 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 shadow-lg rounded px-4 py-2 text-sm text-gray-800 animate-fade-in">
          {toastMsg}
        </div>
      )}
      {/* Confirm Dialog */}
      {showConfirm.id !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-xs text-center">
            <div className="mb-4 text-lg font-semibold">Delete PDF</div>
            <div className="mb-6 text-gray-700">Are you sure you want to delete <span className="font-bold">{showConfirm.name}</span>?</div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowConfirm({id: null, name: ''})} disabled={deletingId !== null}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(pdfs.find(p => p.id === showConfirm.id))} disabled={deletingId !== null}>
                {deletingId === showConfirm.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Generated PDFs</h1>
        <p className="text-gray-600">View and manage your previously generated PDF documents</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Generated PDFs</h3>
            <p className="text-xs text-gray-500">Manage your previously generated PDFs</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-gray-400 py-12">Loading...</div>
          ) : pdfs.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12">No generated PDFs found.</div>
          ) : (
            pdfs.map(pdf => (
              <div key={pdf.id} className="bg-gray-50 rounded-lg border p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1 mb-2">
                  <div className="font-semibold text-base truncate">{pdf.name || pdf.storage_path}</div>
                  <div className="text-xs text-gray-500">{timeAgo(pdf.created_at)}</div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-white border rounded h-24 mb-2">
                  <span className="text-gray-400 font-semibold">{pdf.name ? pdf.name.split('.')[0] : 'Preview'}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Button size="sm" variant="outline" className="flex gap-1 items-center" onClick={() => handleView(pdf)}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="flex gap-1 items-center" onClick={() => handleDownload(pdf)}>
                    <DownloadIcon className="h-4 w-4" /> Download
                  </Button>
                  <Button size="sm" variant="outline" className="flex gap-1 items-center" onClick={() => setShowConfirm({id: pdf.id, name: pdf.name || pdf.storage_path})} disabled={deletingId === pdf.id}>
                    <Trash2 className="h-4 w-4 text-red-500" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<NewDashboard />} />
        <Route path="upload" element={<TemplateWizard />} />
        <Route path="templates" element={<TemplateManagementPage />} />
        <Route path="templates/edit/:id" element={<EditTemplatePage />} />
        <Route path="generated-pdfs" element={<GeneratedPDFsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
