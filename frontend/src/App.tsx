import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/hooks/useTheme'
import { PageSkeleton } from '@/components/ui/Skeleton'
import LoginPage from '@/pages/auth/LoginPage'

const Dashboard = lazy(() => import('@/pages/student/DashboardPage'))
const Modules = lazy(() => import('@/pages/student/ModulesPage'))
const ModuleDetail = lazy(() => import('@/pages/student/ModuleDetailPage'))
const Lesson = lazy(() => import('@/pages/student/LessonPage'))
const Exercises = lazy(() => import('@/pages/student/ExercisesPage'))
const Exercise = lazy(() => import('@/pages/student/ExercisePage'))
const Progress = lazy(() => import('@/pages/student/ProgressPage'))
const Badges = lazy(() => import('@/pages/student/BadgesPage'))
const Profile = lazy(() => import('@/pages/student/ProfilePage'))
const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboardPage'))
const Content = lazy(() => import('@/pages/teacher/ContentPage'))
const TeacherExercises = lazy(() => import('@/pages/teacher/TeacherExercisesPage'))
const ExerciseEditor = lazy(() => import('@/pages/teacher/ExerciseEditorPage'))
const Reports = lazy(() => import('@/pages/teacher/ReportsPage'))

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<div style={{ padding: 'var(--s-7)' }}><PageSkeleton rows={3} /></div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<AppLayout role="student" />}>
                <Route index element={<Dashboard />} />
                <Route path="modulos" element={<Modules />} />
                <Route path="modulos/:id" element={<ModuleDetail />} />
                <Route path="lecciones/:id" element={<Lesson />} />
                <Route path="ejercicios" element={<Exercises />} />
                <Route path="ejercicios/:id" element={<Exercise />} />
                <Route path="progreso" element={<Progress />} />
                <Route path="insignias" element={<Badges />} />
                <Route path="perfil" element={<Profile />} />
              </Route>

              <Route path="docente" element={<AppLayout role="teacher" />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="contenido" element={<Content />} />
                <Route path="ejercicios" element={<TeacherExercises />} />
                <Route path="ejercicios/nuevo" element={<ExerciseEditor />} />
                <Route path="ejercicios/:id" element={<ExerciseEditor />} />
                <Route path="reportes" element={<Reports />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
