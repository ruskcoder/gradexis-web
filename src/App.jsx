import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from '@/components/theme-provider';
import MainLayout from '@/components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Settings from './pages/Settings';
import Attendance from './pages/academics/Attendance';
import Schedules from './pages/academics/Schedules';
import Transcripts from './pages/academics/Transcripts';
import ReportCard from './pages/academics/ReportCard';
import ProgressReport from './pages/academics/ProgressReport';
import Teachers from './pages/academics/Teachers';
import ScheduleEditor from './pages/academics/ScheduleEditor';
import FinalExamCalculator from './pages/calculators/FinalExam';
import GPARankCalculator from './pages/calculators/GPA-Rank';
import { useStore } from '@/lib/store';
import { fetchReferralData } from './pages/Settings';
import { useCurrentUser } from '@/lib/store';
import { login } from '@/lib/grades-api';

function ProtectedRoute({ children }) {
  const currentUserIndex = useStore((state) => state.currentUserIndex);
  const users = useStore((state) => state.users);
  const notLogged = currentUserIndex === -1 || users.length === 0;

  if (notLogged) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  const currentUserIndex = useStore((state) => state.currentUserIndex);
  const users = useStore((state) => state.users);
  const currentUser = useCurrentUser();
  const notLogged = currentUserIndex === -1 || users.length === 0;

  useEffect(() => {
    if (!currentUser) return;

    const loginDetails = {
      username: currentUser.username,
      password: currentUser.password,
      link: currentUser.link,
      clsession: currentUser.clsession,
    };

    login(currentUser.platform, currentUser.loginType || 'credentials', loginDetails).catch((err) => {});

    try {
      fetchReferralData(currentUser, useStore.getState().changeUserData).catch(() => {});
    } catch (e) {
      // 
    }
  }, [currentUser]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="gradexis-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={notLogged ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/academics/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/academics/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
          <Route path="/academics/transcripts" element={<ProtectedRoute><Transcripts /></ProtectedRoute>} />
          <Route path="/academics/report-card" element={<ProtectedRoute><ReportCard /></ProtectedRoute>} />
          <Route path="/academics/progress-report" element={<ProtectedRoute><ProgressReport /></ProtectedRoute>} />
          <Route path="/academics/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
          <Route path="/academics/schedule-editor" element={<ProtectedRoute><ScheduleEditor /></ProtectedRoute>} />
          <Route path="/calculators/final-exam" element={<ProtectedRoute><FinalExamCalculator /></ProtectedRoute>} />
          <Route path="/calculators/gpa-rank" element={<ProtectedRoute><GPARankCalculator /></ProtectedRoute>} />
          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
