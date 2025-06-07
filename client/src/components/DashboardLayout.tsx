import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Settings, LogOut, Upload, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">DocExcel Composer</h2>
        </div>
        <nav className="flex-1 mt-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2"
            onClick={() => navigate('/dashboard/templates')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2"
            onClick={() => navigate('/dashboard/generated-pdfs')}
          >
            <Download className="mr-2 h-4 w-4" />
            Generated PDFs
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2"
            onClick={() => navigate('/dashboard/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
        {/* User Info and Sign Out */}
        <div className="p-4 border-t flex flex-col gap-2">
          {user && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.email || 'User'} />
                <AvatarFallback>{user.email ? user.email[0].toUpperCase() : '?'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 