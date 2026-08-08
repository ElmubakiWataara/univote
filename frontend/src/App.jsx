import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import AdminLogin from "./pages/AdminLogin";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import RegisterOrganization from "./pages/RegisterOrganization";
import ManageOrganization from "./pages/ManageOrganization";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import RegisterVoter from "./pages/RegisterVoter";
import GenerateToken from "./pages/GenerateToken";
import ListVoters from "./pages/ListVoters";
import AddCandidate from "./pages/AddCandidate";
import ListCandidates from "./pages/ListCandidates";
import ResultsPage from "./pages/ResultsPage";
import AuditLogs from "./pages/AuditLogs";
import ManageAdmins from "./pages/ManageAdmins";
import ElectionConfig from "./pages/ElectionConfig";
import VoterTokenInput from "./pages/VoterTokenInput";
import VotingPage from "./pages/VotingPage";

// Loading Screen
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

  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
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

          {/* Login Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/owner/login" element={<OwnerLogin />} />

          {/* Role-based Default Redirects */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/owner"
            element={<Navigate to="/owner/dashboard" replace />}
          />

          {/* Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/super"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/register-organization"
            element={
              <ProtectedRoute requiredRole="owner">
                <RegisterOrganization />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/organizations"
            element={
              <ProtectedRoute requiredRole="owner">
                <ManageOrganization />
              </ProtectedRoute>
            }
          />

          {/* Other Protected Routes */}
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
            path="/admin/election-config"
            element={
              <ProtectedRoute>
                <ElectionConfig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super/get-admins"
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
