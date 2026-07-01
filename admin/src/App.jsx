import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Groups from './pages/Groups';
import Subjects from './pages/Subjects';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="min-h-screen bg-background text-white">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/users" element={<Users />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
