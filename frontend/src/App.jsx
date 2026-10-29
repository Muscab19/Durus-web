import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminLangProvider } from './context/AdminLangContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';
import AdminRoute from './context/AdminRoute.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminLectures from './pages/admin/Lectures.jsx';
import AdminLectureForm from './pages/admin/LectureForm.jsx';
import TrackStudents from './pages/admin/TrackStudents.jsx';
import CertificatesPage from './pages/admin/CertificatesPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import ProfilePage from './pages/admin/ProfilePage.jsx';

// Student Pages (NEW) 
import Browse from './pages/Browse.jsx';
import LecturePlayer from './pages/LecturePlayer.jsx';
import MyProgress from './pages/MyProgress.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AdminLangProvider>
        <Routes>
          {/* Public site — inside the public layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* NEW: Student Routes */}
            <Route path="/browse" element={<Browse />} />
            <Route path="/lectures/:id" element={<LecturePlayer />} />

            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <MyProgress /> {/* Replaced placeholder with real page */}
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin — standalone pages, each with its own chrome */}
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/lectures"
            element={
              <AdminRoute>
                <AdminLectures />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/lectures/new"
            element={
              <AdminRoute>
                <AdminLectureForm />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/lectures/:id/edit"
            element={
              <AdminRoute>
                <AdminLectureForm />
              </AdminRoute>
            }
          />
          <Route 
            path='/dashboard/students'
            element={
              <AdminRoute>
                <TrackStudents />
              </AdminRoute>
            }
          />
          <Route 
            path='/dashboard/certificates'
            element={
              <AdminRoute>
                <CertificatesPage />
              </AdminRoute>
            }
          />
          <Route 
            path='/dashboard/settings'
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
          <Route 
            path='/dashboard/users'
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route 
            path='/dashboard/profile'
            element={
              <AdminRoute>
                <ProfilePage />
              </AdminRoute>
            }
          />
        </Routes>
      </AdminLangProvider>
    </AuthProvider>
  );
}