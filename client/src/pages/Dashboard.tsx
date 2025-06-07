import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import NewDashboard from './NewDashboard';
import TemplateWizard from '@/components/TemplateWizard';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<NewDashboard />} />
        <Route path="upload" element={<TemplateWizard />} />
      </Routes>
    </DashboardLayout>
  );
}
