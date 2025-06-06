import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHome from './DashboardHome';
import TemplateWizard from '@/components/TemplateWizard';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="upload" element={<TemplateWizard />} />
      </Routes>
    </DashboardLayout>
  );
}
