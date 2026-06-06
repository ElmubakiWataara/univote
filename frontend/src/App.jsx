// frontend/src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard"; // ← New
import RegisterVoter from "./pages/RegisterVoter";
import GenerateToken from "./pages/GenerateToken";
import ListVoters from "./pages/ListVoters";
import AddCandidate from "./pages/AddCandidate";
import ListCandidates from "./pages/ListCandidates";
import Settings from "./pages/Settings";
import VoterTokenInput from "./pages/VoterTokenInput";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";

// Protected Route with Role Handling
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Super Admin can access everything
  if (user?.role === "superadmin") {
    return children;
  }

  // Regular Admin trying to access Super Admin only route
  if (requiredRole === "superadmin" && user?.role !== "superadmin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Voter Routes */}
          <Route path="/" element={<VoterTokenInput />} />
          <Route path="/vote" element={<VotingPage />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Regular Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Dashboard */}
          <Route
            path="/admin/super"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Shared Admin Routes (accessible by both Admin & Super Admin) */}
          <Route
            path="/admin/register-voter"
            element={
              <ProtectedRoute>
                <RegisterVoter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/generate-token"
            element={
              <ProtectedRoute>
                <GenerateToken />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/list-voters"
            element={
              <ProtectedRoute>
                <ListVoters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-candidate"
            element={
              <ProtectedRoute>
                <AddCandidate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/list-candidates"
            element={
              <ProtectedRoute>
                <ListCandidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
