import { lazy, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ToastViewport } from './components/ui/ToastViewport';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/appStore';
import { registerCustomExercises } from './data/exercises';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage').then((module) => ({ default: module.WorkoutsPage })));
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage').then((module) => ({ default: module.ProgramDetailPage })));
const ProgramEditorPage = lazy(() => import('./pages/ProgramEditorPage').then((module) => ({ default: module.ProgramEditorPage })));
const ExerciseLibraryPage = lazy(() => import('./pages/ExerciseLibraryPage').then((module) => ({ default: module.ExerciseLibraryPage })));
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage').then((module) => ({ default: module.ExerciseDetailPage })));
const ActiveSessionPage = lazy(() => import('./pages/ActiveSessionPage').then((module) => ({ default: module.ActiveSessionPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage })));
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage').then((module) => ({ default: module.SessionDetailPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })));
const FoodPage = lazy(() => import('./pages/FoodPage').then((module) => ({ default: module.FoodPage })));
const DiaryPage = lazy(() => import('./pages/DiaryPage').then((module) => ({ default: module.DiaryPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((module) => ({ default: module.GoalsPage })));
const LearnPage = lazy(() => import('./pages/LearnPage').then((module) => ({ default: module.LearnPage })));
const ArticlePage = lazy(() => import('./pages/ArticlePage').then((module) => ({ default: module.ArticlePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const MorePage = lazy(() => import('./pages/MorePage').then((module) => ({ default: module.MorePage })));
const CirclePage = lazy(() => import('./pages/CirclePage').then((module) => ({ default: module.CirclePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

export default function App() {
  useTheme();
  const customExercises = useAppStore((state) => state.customExercises);

  useEffect(() => {
    registerCustomExercises(customExercises);
  }, [customExercises]);

  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="programs/:programId" element={<ProgramDetailPage />} />
          <Route path="programs/:programId/edit" element={<ProgramEditorPage />} />
          <Route path="library" element={<ExerciseLibraryPage />} />
          <Route path="library/:exerciseId" element={<ExerciseDetailPage />} />
          <Route path="session/:sessionId" element={<ActiveSessionPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:sessionId" element={<SessionDetailPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="food" element={<FoodPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/:slug" element={<ArticlePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="circle" element={<CirclePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <ToastViewport />
    </>
  );
}
