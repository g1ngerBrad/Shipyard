import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

// Code-split the detail route so its heavy dependency (@dnd-kit) is not part of
// the initial bundle. It loads on demand when a project is opened.
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <main className="flex-1 px-4 pt-8 pb-8">
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}