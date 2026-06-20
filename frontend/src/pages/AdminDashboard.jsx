import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    votesCast: 0,
    candidates: 0,
    electionStatus: "Closed",
  });
  const [loading, setLoading] = useState(true);

  const { user, token: authToken } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "superadmin";

  const fetchDashboardStats = async () => {
    try {
      const res = await Promise.allSettled([
        axios.get("http://localhost:3000/api/admin/voters", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get("http://localhost:3000/api/admin/results", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get("http://localhost:3000/api/admin/candidates", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      setStats({
        totalVoters:
          res[0].status === "fulfilled"
            ? res[0].value.data.voters?.length || 0
            : 0,
        votesCast:
          res[1].status === "fulfilled"
            ? res[1].value.data.total_votes || 0
            : 0,
        candidates:
          res[2].status === "fulfilled"
            ? res[2].value.data.candidates?.length || 0
            : 0,
        electionStatus: "Unknown",
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-10">
        {/* Welcome Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {user?.username}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {isSuperAdmin ? "Super Administrator" : "Administrator"} •
            University Voting System
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Total Voters</div>
            <div className="text-5xl font-bold text-gray-900 mt-4">
              {loading ? "—" : stats.totalVoters}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Votes Cast</div>
            <div className="text-5xl font-bold text-gray-900 mt-4">
              {loading ? "—" : stats.votesCast}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Candidates</div>
            <div className="text-5xl font-bold text-gray-900 mt-4">
              {loading ? "—" : stats.candidates}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Election Status</div>
            <div className="mt-4">
              <span
                className={`inline-flex px-6 py-3 text-sm font-semibold rounded-3xl ${
                  stats.electionStatus === "Active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                ● {stats.electionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/admin/generate-token")}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition">
              🔑
            </div>
            <h3 className="font-semibold text-xl">Generate Token</h3>
            <p className="text-gray-600 mt-2">Create one-time voting tokens</p>
          </div>

          <div
            onClick={() => navigate("/admin/register-voter")}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition">
              👤
            </div>
            <h3 className="font-semibold text-xl">Register Voters</h3>
            <p className="text-gray-600 mt-2">Single or bulk registration</p>
          </div>

          <div
            onClick={() => navigate("/admin/list-candidates")}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition">
              🏆
            </div>
            <h3 className="font-semibold text-xl">Manage Candidates</h3>
            <p className="text-gray-600 mt-2">Add, edit and view candidates</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
