import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import EnglishLearningSystem from '@/components/english-learning/EnglishLearningSystem';
import LearningProgress from '@/components/english-learning/progress/LearningProgress';
import { AuthProvider } from '@/components/auth/AuthProvider';
import AuthGuard from '@/components/auth/AuthGuard';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SettingsPage from '@/components/settings/SettingsPage';
import MemberCenter from '@/components/subscription/MemberCenter';
import HomePage from '@/components/home/HomePage';
import LibraryPage from '@/components/english-learning/LibraryPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthGuard>
          <Layout>
            <div className="min-h-screen bg-background">
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/progress" element={<LearningProgress />} />
                  <Route path="/courses" element={<EnglishLearningSystem />} />
                  <Route path="/courses/library" element={<LibraryPage />} />
                  <Route path="/ai-assistant" element={<div>AI助手</div>} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/member-center" element={<MemberCenter />} />
                  <Route 
                    path="/admin" 
                    element={
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    } 
                  />
                </Routes>
              </main>
            </div>
          </Layout>
        </AuthGuard>
      </AuthProvider>
    </Router>
  );
}