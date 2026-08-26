import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

//for icons
import {
  UserPlus,
  Ticket,
  Users,
  Settings,
  Vote,
  RefreshCw,
  Circle,
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    votesCast: 0,
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
  const fetchAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [votersRes, resultsRes, electionRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/admin/voters`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/api/admin/results`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_URL}/api/admin/election-settings`, {
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

        electionStatus:
          electionRes.status === "fulfilled" &&
          electionRes.value.data.settings?.is_active
            ? "Active"
            : "Closed",

        electionTitle:
          electionRes.status === "fulfilled"
            ? electionRes.value.data.settings?.title || "Election"
            : "Election",

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

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url; // Cloudinary
    return `${API_URL}${url}`; // local /uploads/...
  };

  // Initial load
  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-3xl shadow-sm p-4">
          <div className="flex items-center gap-6">
            {stats.logoUrl ? (
              <img
                src={getImageUrl(stats.logoUrl)}
                alt="Election Logo"
                className="w-20 h-20 rounded-2xl object-contain border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Vote className="w-9 h-9 text-gray-400" strokeWidth={1.75} />
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold">
                {stats.electionTitle || "University Election"}
              </h1>

              <p className="text-gray-500 mt-1">{stats.academicYear}</p>

              <p className="text-gray-500 mt-2">Admin Dashboard</p>
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
              <Circle
                className={`w-3 h-3 ${
                  stats.electionStatus === "Active"
                    ? "fill-green-500 text-green-500"
                    : "fill-red-500 text-red-500"
                }`}
              />
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
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <UserPlus
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />
                </div>
                <h4 className="font-semibold">Register Voters</h4>
                <p className="text-sm text-gray-600 mt-1">Single or Bulk</p>
              </button>

              <button
                onClick={() => navigate("/admin/generate-token")}
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <Ticket
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />{" "}
                </div>
                <h4 className="font-semibold">Generate Tokens</h4>
                <p className="text-sm text-gray-600 mt-1">For students</p>
              </button>

              <button
                onClick={() => navigate("/admin/list-voters")}
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <Users
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />{" "}
                </div>
                <h4 className="font-semibold">Manage Voters</h4>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
