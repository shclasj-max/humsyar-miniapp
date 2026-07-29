import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { initTelegram } from './lib/telegram';
import { useAuthStore } from './stores/authStore';
import BottomNav       from './components/layout/BottomNav';
import Toast           from './components/shared/Toast';
import { LoadingScreen } from './components/shared/Loading';
import AuthError       from './components/shared/AuthError';

// Pages
import Dashboard   from './pages/Dashboard';
import Learn       from './pages/Learn';
import Questions   from './pages/Learn/Questions';
import Resources   from './pages/Learn/Resources';
import References  from './pages/Learn/References';
import Schedule    from './pages/Schedule';
import Grades      from './pages/Grades';
import Me          from './pages/Me';
import Profile     from './pages/Me/Profile';
import { Notifications } from './pages/Me/Notifications';
import Subscription from './pages/Me/Subscription';
import Tickets     from './pages/Me/Tickets';
import { Faq, Reports } from './pages/Me/FaqReports';

// Admin
import { AdminPanel, AdminUsers, AdminUserDetail, AdminIntakes, AdminContentAdmins, AdminBlacklist, AdminTickets } from './pages/Admin/AdminPanel';
import { ContentAdminPanel, ContentQuestions, ContentSchedule, ContentFaq } from './pages/Admin/ContentAdmin';
import { BasicScienceAdmin, ReferencesAdmin, QbankAdmin, ContentReportsAdmin, GradesAdmin } from './pages/Admin/ContentLibrary';

// Guards
function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function ContentAdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!user || !['admin','content_admin'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { loading, error, init } = useAuthStore();

  useEffect(() => {
    initTelegram();
    init();
  }, []);

  if (loading) return <LoadingScreen />;
  if (error)   return <AuthError error={error} />;

  return (
    <div className="app-root" dir="rtl">
      <Toast />
      <Routes>
        {/* تب‌های اصلی */}
        <Route path="/"             element={<Dashboard />} />
        <Route path="/learn"        element={<Learn />} />
        <Route path="/learn/questions" element={<Questions />} />
        <Route path="/learn/resources" element={<Resources />} />
        <Route path="/learn/references" element={<References />} />
        <Route path="/schedule"     element={<Schedule />} />
        <Route path="/grades"       element={<Grades />} />

        {/* من */}
        <Route path="/me"               element={<Me />} />
        <Route path="/me/profile"       element={<Profile />} />
        <Route path="/me/notifications" element={<Notifications />} />
        <Route path="/me/subscription"  element={<Subscription />} />
        <Route path="/me/tickets"       element={<Tickets />} />
        <Route path="/me/faq"           element={<Faq />} />
        <Route path="/me/reports"       element={<Reports />} />

        {/* پنل ادمین */}
        <Route path="/admin"                element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/admin/users"          element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/:uid"     element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
        <Route path="/admin/intakes"        element={<AdminRoute><AdminIntakes /></AdminRoute>} />
        <Route path="/admin/content-admins" element={<AdminRoute><AdminContentAdmins /></AdminRoute>} />
        <Route path="/admin/blacklist"      element={<AdminRoute><AdminBlacklist /></AdminRoute>} />
        <Route path="/admin/tickets"        element={<AdminRoute><AdminTickets /></AdminRoute>} />

        {/* پنل محتوا */}
        <Route path="/admin/content"            element={<ContentAdminRoute><ContentAdminPanel /></ContentAdminRoute>} />
        <Route path="/admin/content/questions"  element={<ContentAdminRoute><ContentQuestions /></ContentAdminRoute>} />
        <Route path="/admin/content/schedule"   element={<ContentAdminRoute><ContentSchedule /></ContentAdminRoute>} />
        <Route path="/admin/content/faq"        element={<ContentAdminRoute><ContentFaq /></ContentAdminRoute>} />
        <Route path="/admin/content/basic-science" element={<ContentAdminRoute><BasicScienceAdmin /></ContentAdminRoute>} />
        <Route path="/admin/content/references"    element={<ContentAdminRoute><ReferencesAdmin /></ContentAdminRoute>} />
        <Route path="/admin/content/qbank"          element={<ContentAdminRoute><QbankAdmin /></ContentAdminRoute>} />
        <Route path="/admin/content/reports"        element={<ContentAdminRoute><ContentReportsAdmin /></ContentAdminRoute>} />
        <Route path="/admin/content/grades"          element={<ContentAdminRoute><GradesAdmin /></ContentAdminRoute>} />

        {/* ریدایرکت‌های سازگاری */}
        <Route path="/questions"   element={<Navigate to="/learn/questions" replace />} />
        <Route path="/resources"   element={<Navigate to="/learn/resources" replace />} />
        <Route path="/references"  element={<Navigate to="/learn/references" replace />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
