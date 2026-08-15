import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TopicPage from './pages/TopicPage';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import Playbooks from './pages/Playbooks';
import AIAssistant from './pages/AIAssistant';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/topics/:topicId"
            element={
              <ProtectedRoute>
                <TopicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playbooks"
            element={
              <ProtectedRoute>
                <Playbooks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
