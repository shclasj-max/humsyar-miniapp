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

import Register from './components/shared/Register';

import Onboarding from './components/shared/Onboarding';


/* صفحات اصلی */

import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Schedule from './pages/Schedule';
import Grades from './pages/Grades';


/* هوشیار و جست‌وجو */

import AiChat from './pages/Ai/AiChat';

import GlobalSearch from './pages/Search/GlobalSearch';


/* صفحات یادگیری */

import Questions from './pages/Learn/Questions';
import ExamCenter from './pages/Learn/ExamCenter';

import QuestionHistory from './pages/Learn/QuestionHistory';
import MyQuestions from './pages/Learn/MyQuestions';

import Resources from './pages/Learn/Resources';
import References from './pages/Learn/References';


/* حساب کاربری */

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

import SubscriptionAdmin from './pages/Admin/SubscriptionAdmin';
import AiAdmin from './pages/Admin/AiAdmin';

import Analytics from './pages/Admin/Analytics';
import AuditLog from './pages/Admin/AuditLog';


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


  /* رویدادهای احراز هویت api.js — وقتی وسط نشست
     دسترسی کاربر باطل شود (تعلیق، حذف، و…) به‌جای
     صفحات نیمه‌شکسته، مستقیم به صفحه وضعیت می‌رویم */
  const forceError = useAuthStore(
    (state) => state.forceError
  );


  useEffect(() => {
    const EVENT_TO_STATE = {
      'auth:not_registered':
        'not_registered',
      'auth:pending':
        'pending_approval',
      'auth:suspended':
        'suspended',
      'auth:invalid':
        'invalid_init_data',
    };

    const listeners = Object.entries(
      EVENT_TO_STATE
    ).map(([event, code]) => {
      const handler = () =>
        forceError(code);

      window.addEventListener(
        event,
        handler
      );

      return [event, handler];
    });


    return () => {
      listeners.forEach(
        ([event, handler]) =>
          window.removeEventListener(
            event,
            handler
          )
      );
    };
  }, [forceError]);


  if (loading) {
    return (
      <LoadingScreen />
    );
  }


  /* ثبت‌نام انجام نشده یا در انتظار
     تأیید → ویزارد ثبت‌نام داخل
     مینی‌اپ (سینک کامل با بات) */

  if (
    error === 'not_registered' ||
    error === 'pending_approval'
  ) {
    return (
      <Register />
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

      {/* معرفی اولین ورود — بعد از
          تأیید حساب نمایش داده می‌شود */}
      <Onboarding />

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


        {/* هوشیار و جست‌وجو */}

        <Route
          path="/ai"
          element={
            <AiChat />
          }
        />

        <Route
          path="/search"
          element={
            <GlobalSearch />
          }
        />


        {/* یادگیری */}

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


        {/* خانه مدیریت */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminHome />
            </AdminRoute>
          }
        />


        {/* مدیریت اشتراک */}

        <Route
          path="/admin/subscription"
          element={
            <AdminRoute>
              <SubscriptionAdmin />
            </AdminRoute>
          }
        />


        {/* مدیریت هوشیار */}

        <Route
          path="/admin/ai"
          element={
            <AdminRoute>
              <AiAdmin />
            </AdminRoute>
          }
        />


        {/* آمار و لاگ فعالیت */}

        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <AdminRoute>
              <AuditLog />
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


        {/* خانه محتوا */}

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


        {/* مسیرهای سازگاری */}

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
