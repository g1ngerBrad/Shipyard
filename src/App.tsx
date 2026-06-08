import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-ink">
        <main className="flex-1 px-4 pt-4 pb-28">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}