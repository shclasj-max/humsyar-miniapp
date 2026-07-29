import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  useEffect,
} from 'react';

import {
  initTelegram,
} from './lib/telegram';

import {
  useAuthStore,
} from './stores/authStore';

import BottomNav from './components/layout/BottomNav';
import Toast from './components/shared/Toast';

import {
  LoadingScreen,
} from './components/shared/Loading';

import AuthError from './components/shared/AuthError';


/* صفحات اصلی */

import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Schedule from './pages/Schedule';
import Grades from './pages/Grades';


/* هوشیار */

import AiChat from './pages/Ai/AiChat';


/* جست‌وجوی سراسری */

import GlobalSearch from './pages/Search/GlobalSearch';


/* صفحات یادگیری */

import Questions from './pages/Learn/Questions';
import ExamCenter from './pages/Learn/ExamCenter';

import QuestionHistory from './pages/Learn/QuestionHistory';
import MyQuestions from './pages/Learn/MyQuestions';

import Resources from './pages/Learn/Resources';
import References from './pages/Learn/References';


/* صفحات حساب کاربری */

import Me from './pages/Me';
import Profile from './pages/Me/Profile';

import {
  Notifications,
} from './pages/Me/Notifications';

import Subscription from './pages/Me/Subscription';
import Tickets from './pages/Me/Tickets';

import {
  Faq,
  Reports,
} from './pages/Me/FaqReports';


/* خانه‌های مدیریت */

import AdminHome from './pages/Admin/AdminHome';
import ContentHome from './pages/Admin/ContentHome';


/* مدیریت کاربران */

import {
  AdminUsers,
  AdminUserDetail,
  AdminIntakes,
  AdminContentAdmins,
  AdminBlacklist,
} from './pages/Admin/UserManagement';


/* عملیات مدیریتی */

import {
  AdminTickets,
  BroadcastAdmin,
  PollAdmin,
  NotificationsAdmin,
} from './pages/Admin/AdminOperations';


/* مدیریت سؤال و FAQ */

import {
  ContentQuestions,
  ContentFaq,
} from './pages/Admin/ContentAdmin';


/* مدیریت کتابخانه */

import {
  BasicScienceAdmin,
  ReferencesAdmin,
  QbankAdmin,
  ContentReportsAdmin,
} from './pages/Admin/ContentLibrary';


/* مدیریت برنامه و نمرات */

import AcademicScheduleAdmin from './pages/Admin/AcademicScheduleAdmin';

import AcademicGradesAdmin from './pages/Admin/AcademicGradesAdmin';


function AdminRoute({
  children,
}) {
  const user = useAuthStore(
    (state) => state.user
  );

  if (
    !user ||
    user.role !== 'admin'
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


function ContentAdminRoute({
  children,
}) {
  const user = useAuthStore(
    (state) => state.user
  );

  const allowedRoles = [
    'admin',
    'content_admin',
  ];

  if (
    !user ||
    !allowedRoles.includes(
      user.role
    )
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


export default function App() {
  const loading = useAuthStore(
    (state) => state.loading
  );

  const error = useAuthStore(
    (state) => state.error
  );

  const init = useAuthStore(
    (state) => state.init
  );


  useEffect(() => {
    initTelegram();
    init();
  }, [init]);


  if (loading) {
    return (
      <LoadingScreen />
    );
  }


  if (error) {
    return (
      <AuthError
        error={error}
      />
    );
  }


  return (
    <div
      className="app-root"
      dir="rtl"
    >
      <Toast />

      <Routes>
        {/* صفحات اصلی */}

        <Route
          path="/"
          element={
            <Dashboard />
          }
        />

        <Route
          path="/learn"
          element={
            <Learn />
          }
        />

        <Route
          path="/schedule"
          element={
            <Schedule />
          }
        />

        <Route
          path="/grades"
          element={
            <Grades />
          }
        />


        {/* هوشیار */}

        <Route
          path="/ai"
          element={
            <AiChat />
          }
        />


        {/* جست‌وجوی سراسری */}

        <Route
          path="/search"
          element={
            <GlobalSearch />
          }
        />


        {/* صفحات یادگیری */}

        <Route
          path="/learn/questions"
          element={
            <Questions />
          }
        />

        <Route
          path="/learn/exams"
          element={
            <ExamCenter />
          }
        />

        <Route
          path="/learn/question-history"
          element={
            <QuestionHistory />
          }
        />

        <Route
          path="/learn/my-questions"
          element={
            <MyQuestions />
          }
        />

        <Route
          path="/learn/resources"
          element={
            <Resources />
          }
        />

        <Route
          path="/learn/references"
          element={
            <References />
          }
        />


        {/* حساب کاربری */}

        <Route
          path="/me"
          element={
            <Me />
          }
        />

        <Route
          path="/me/profile"
          element={
            <Profile />
          }
        />

        <Route
          path="/me/notifications"
          element={
            <Notifications />
          }
        />

        <Route
          path="/me/subscription"
          element={
            <Subscription />
          }
        />

        <Route
          path="/me/tickets"
          element={
            <Tickets />
          }
        />

        <Route
          path="/me/faq"
          element={
            <Faq />
          }
        />

        <Route
          path="/me/reports"
          element={
            <Reports />
          }
        />


        {/* خانه پنل مدیریت */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          }
        />


        {/* مدیریت کاربران */}

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users/:uid"
          element={
            <AdminRoute>
              <AdminUserDetail />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/intakes"
          element={
            <AdminRoute>
              <AdminIntakes />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/content-admins"
          element={
            <AdminRoute>
              <AdminContentAdmins />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/blacklist"
          element={
            <AdminRoute>
              <AdminBlacklist />
            </AdminRoute>
          }
        />


        {/* عملیات مدیریتی */}

        <Route
          path="/admin/tickets"
          element={
            <AdminRoute>
              <AdminTickets />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/broadcast"
          element={
            <AdminRoute>
              <BroadcastAdmin />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/poll"
          element={
            <AdminRoute>
              <PollAdmin />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <NotificationsAdmin />
            </AdminRoute>
          }
        />


        {/* خانه مدیریت محتوا */}

        <Route
          path="/admin/content"
          element={
            <ContentAdminRoute>
              <ContentHome />
            </ContentAdminRoute>
          }
        />


        {/* سؤال و FAQ */}

        <Route
          path="/admin/content/questions"
          element={
            <ContentAdminRoute>
              <ContentQuestions />
            </ContentAdminRoute>
          }
        />

        <Route
          path="/admin/content/faq"
          element={
            <ContentAdminRoute>
              <ContentFaq />
            </ContentAdminRoute>
          }
        />


        {/* برنامه و نمرات */}

        <Route
          path="/admin/content/schedule"
          element={
            <ContentAdminRoute>
              <AcademicScheduleAdmin />
            </ContentAdminRoute>
          }
        />

        <Route
          path="/admin/content/grades"
          element={
            <ContentAdminRoute>
              <AcademicGradesAdmin />
            </ContentAdminRoute>
          }
        />


        {/* کتابخانه محتوا */}

        <Route
          path="/admin/content/basic-science"
          element={
            <ContentAdminRoute>
              <BasicScienceAdmin />
            </ContentAdminRoute>
          }
        />

        <Route
          path="/admin/content/references"
          element={
            <ContentAdminRoute>
              <ReferencesAdmin />
            </ContentAdminRoute>
          }
        />

        <Route
          path="/admin/content/qbank"
          element={
            <ContentAdminRoute>
              <QbankAdmin />
            </ContentAdminRoute>
          }
        />

        <Route
          path="/admin/content/reports"
          element={
            <ContentAdminRoute>
              <ContentReportsAdmin />
            </ContentAdminRoute>
          }
        />


        {/* مسیرهای قدیمی سازگار */}

        <Route
          path="/questions"
          element={
            <Navigate
              to="/learn/questions"
              replace
            />
          }
        />

        <Route
          path="/resources"
          element={
            <Navigate
              to="/learn/resources"
              replace
            />
          }
        />

        <Route
          path="/references"
          element={
            <Navigate
              to="/learn/references"
              replace
            />
          }
        />

        <Route
          path="/hoshyar"
          element={
            <Navigate
              to="/ai"
              replace
            />
          }
        />

        <Route
          path="/find"
          element={
            <Navigate
              to="/search"
              replace
            />
          }
        />


        {/* مسیر نامعتبر */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>

      <BottomNav />
    </div>
  );
}
