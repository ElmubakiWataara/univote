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
    electionTitle: "",
    academicYear: "",
    logoUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentLogs, setRecentLogs] = useState([]);

  const { user, token: authToken } = useAuth();
  const navigate = useNavigate();

  // Fetch all stats (used on initial load)
  const fetchSuperAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [votersRes, resultsRes, candidatesRes, electionRes] =
        await Promise.allSettled([
          axios.get("http://localhost:3000/api/admin/voters", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://localhost:3000/api/admin/results", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://localhost:3000/api/admin/candidates", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://localhost:3000/api/super/election-settings", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

      setStats({
        totalVoters:
          votersRes.status === "fulfilled"
            ? votersRes.value.data.voters?.length || 0
            : 0,

        votesCast:
          resultsRes.status === "fulfilled"
            ? resultsRes.value.data.total_votes || 0
            : 0,

        candidates:
          candidatesRes.status === "fulfilled"
            ? candidatesRes.value.data.candidates?.length || 0
            : 0,

        totalAdmins: 3,

        electionStatus:
          electionRes.status === "fulfilled" &&
          electionRes.value.data.settings?.is_active
            ? "Active"
            : "Closed",

        electionTitle:
          electionRes.status === "fulfilled"
            ? electionRes.value.data.settings?.title || "University Election"
            : "University Election",

        academicYear:
          electionRes.status === "fulfilled"
            ? electionRes.value.data.settings?.academic_year || ""
            : "",

        logoUrl:
          electionRes.status === "fulfilled"
            ? electionRes.value.data.settings?.logo_url || ""
            : "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ONLY logs (for refresh button + polling)
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const logsRes = await axios.get(
        "http://localhost:3000/api/super/audit-logs?limit=8",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setRecentLogs(logsRes.data.logs || []);
    } catch (err) {
      console.warn("Could not load logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSuperAdminData();
    fetchLogs();
  }, []);

  // Auto-refresh logs every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-3xl shadow-sm p-4">
          <div className="flex items-center gap-6">
            {stats.logoUrl ? (
              <img
                src={`http://localhost:3000${stats.logoUrl}`}
                alt="Election Logo"
                className="w-20 h-20 rounded-2xl object-contain border"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl">
                🗳️
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold">
                {stats.electionTitle || "University Election"}
              </h1>

              <p className="text-gray-500 mt-1">{stats.academicYear}</p>

              <p className="text-gray-500 mt-2">
                Super Administrator Dashboard
              </p>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold ${
                stats.electionStatus === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <span className="text-lg">
                {stats.electionStatus === "Active" ? "🟢" : "🔴"}
              </span>
              Election {stats.electionStatus}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
            {error}
          </div>
        )}

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

        {/* Quick Actions & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="
                    flex items-center gap-2
                    px-3 py-2
                    border border-slate-300
                    bg-white
                    text-slate-700
                    rounded-lg
                    hover:bg-slate-50
                    hover:border-indigo-400
                    transition
                    disabled:opacity-50
                  "
                >
                  <span className={logsLoading ? "animate-spin" : ""}>↻</span>
                  {logsLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={() => navigate("/admin/audit-logs")}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => {
                  let detailsText = "";
                  try {
                    if (typeof log.details === "string") {
                      const parsed = JSON.parse(log.details);
                      detailsText = parsed
                        ? JSON.stringify(parsed, null, 2)
                        : log.details;
                    } else {
                      detailsText = JSON.stringify(log.details);
                    }
                  } catch (e) {
                    detailsText = log.details || "—";
                  }

                  return (
                    <div
                      key={i}
                      className="flex justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex-1 pr-4">
                        <span className="font-medium text-gray-800">
                          {log.action}
                        </span>
                        <p className="text-gray-500 text-xs mt-1 break-words">
                          {detailsText}
                        </p>
                      </div>
                      <div className="text-right text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 py-12 text-center">
                  No recent activity yet
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
