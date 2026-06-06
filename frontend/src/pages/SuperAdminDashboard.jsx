// frontend/src/pages/SuperAdminDashboard.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    votesCast: 0,
    candidates: 0,
    totalAdmins: 0,
    electionStatus: "Closed",
  });
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);

  const { user, token: authToken } = useAuth();
  const navigate = useNavigate();

  const fetchSuperAdminData = async () => {
    try {
      const [votersRes, resultsRes, candidatesRes, logsRes] = await Promise.all(
        [
          axios.get("http://localhost:3000/api/admin/voters", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://localhost:3000/api/admin/results", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://localhost:3000/api/admin/candidates", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://localhost:3000/api/super/audit-logs?limit=5", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ],
      );

      setStats({
        totalVoters: votersRes.data.voters?.length || 0,
        votesCast: resultsRes.data.total_votes || 0,
        candidates: candidatesRes.data.candidates?.length || 0,
        totalAdmins: 3, // You can create a real endpoint later
        electionStatus: resultsRes.data.is_active ? "Active" : "Closed",
      });

      setRecentLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error("Super Admin Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-10">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Full System Control</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-5 py-2.5 rounded-3xl text-sm font-semibold ${
                stats.electionStatus === "Active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              ● Election {stats.electionStatus}
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-sm text-gray-500">Total Voters</div>
            <div className="text-5xl font-bold mt-4">
              {loading ? "—" : stats.totalVoters}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-sm text-gray-500">Votes Cast</div>
            <div className="text-5xl font-bold mt-4">
              {loading ? "—" : stats.votesCast}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-sm text-gray-500">Candidates</div>
            <div className="text-5xl font-bold mt-4">
              {loading ? "—" : stats.candidates}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-sm text-gray-500">Admins</div>
            <div className="text-5xl font-bold mt-4">{stats.totalAdmins}</div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-sm text-gray-500">Turnout</div>
            <div className="text-5xl font-bold mt-4">
              {stats.totalVoters > 0
                ? Math.round((stats.votesCast / stats.totalVoters) * 100)
                : 0}
              %
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow p-8">
            <h3 className="font-semibold text-xl mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => navigate("/admin/register-voter")}
                className="p-8 border border-gray-200 hover:border-indigo-300 rounded-3xl text-left transition hover:shadow"
              >
                <div className="text-4xl mb-4">👤</div>
                <h4 className="font-semibold">Register Voters</h4>
                <p className="text-sm text-gray-600 mt-1">Single or Bulk</p>
              </button>

              <button
                onClick={() => navigate("/admin/generate-token")}
                className="p-8 border border-gray-200 hover:border-indigo-300 rounded-3xl text-left transition hover:shadow"
              >
                <div className="text-4xl mb-4">🔑</div>
                <h4 className="font-semibold">Generate Tokens</h4>
                <p className="text-sm text-gray-600 mt-1">For students</p>
              </button>

              <button
                onClick={() => navigate("/admin/list-candidates")}
                className="p-8 border border-gray-200 hover:border-indigo-300 rounded-3xl text-left transition hover:shadow"
              >
                <div className="text-4xl mb-4">🏆</div>
                <h4 className="font-semibold">Manage Candidates</h4>
              </button>

              <button
                onClick={() => navigate("/admin/settings")}
                className="p-8 border border-gray-200 hover:border-indigo-300 rounded-3xl text-left transition hover:shadow"
              >
                <div className="text-4xl mb-4">⚙️</div>
                <h4 className="font-semibold">Settings & Control</h4>
              </button>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="lg:col-span-5 bg-white rounded-3xl shadow p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-xl">Recent Activity</h3>
              <button
                onClick={() => navigate("/admin/settings")}
                className="text-indigo-600 text-sm hover:underline"
              >
                View All Logs →
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <span className="font-medium">{log.action}</span>
                      <p className="text-gray-500 text-xs mt-1">
                        {log.details}
                      </p>
                    </div>
                    <div className="text-right text-gray-500 text-xs">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 py-8 text-center">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
