import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.js';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Musicians from './pages/Musicians';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MusicianProfile from './pages/MusicianProfile';

// Protects pages that require login
function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Sends logged-in users away from login/register
function PublicOnlyRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (user) {
    return (
      <Navigate
        to={user.role === 'musician' ? '/musician/dashboard' : '/dashboard'}
        replace
      />
    );
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />

          {/* Auth pages: only for logged-OUT users */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Public browse page */}
          <Route path="/musicians" element={<Musicians />} />

          {/* Protected Client Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Musician Routes */}
          <Route
            path="/musician/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/musician/profile"
            element={
              <ProtectedRoute>
                <MusicianProfile />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}