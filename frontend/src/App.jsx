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
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import RegisterVoter from "./pages/RegisterVoter";
import GenerateToken from "./pages/GenerateToken";
import ListVoters from "./pages/ListVoters";
import AddCandidate from "./pages/AddCandidate";
import ListCandidates from "./pages/ListCandidates";
// import Settings from "./pages/Settings";
import VoterTokenInput from "./pages/VoterTokenInput";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";
import AuditLogs from "./pages/AuditLogs";
import ManageAdmins from "./pages/ManageAdmins";
import ElectionConfig from "./pages/ElectionConfig";

// Loading Spinner Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
      <p className="mt-4 text-gray-600">Restoring session...</p>
    </div>
  </div>
);

// Protected Route
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole === "superadmin" && user?.role !== "superadmin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Smart Default Redirect
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return user?.role === "superadmin" ? (
    <Navigate to="/admin/super" replace />
  ) : (
    <Navigate to="/admin/dashboard" replace />
  );
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

          {/* Default Dashboard (handles /admin and refresh) */}
          <Route path="/admin" element={<DashboardRedirect />} />

          {/* Regular Admin Dashboard */}
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

          {/* Shared Routes */}
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
            path="/admin/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super/election-config"
            element={
              <ProtectedRoute>
                <ElectionConfig />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super/manage-admins"
            element={
              <ProtectedRoute>
                <ManageAdmins />
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
