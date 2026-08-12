import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TopicPage from './pages/TopicPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/topics/:topicId" element={<TopicPage />} />
      </Routes>
    </BrowserRouter>
  );
}
