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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-5">
            {stats.logoUrl ? (
              <img
                src={getImageUrl(stats.logoUrl)}
                alt="Election Logo"
                className="w-16 h-16 rounded-xl object-contain border border-gray-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-brand-green-soft flex items-center justify-center">
                <Vote className="w-7 h-7 text-brand-green" strokeWidth={1.75} />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {stats.electionTitle || "University Election"}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {stats.academicYear}
              </p>
              <p className="text-gray-400 text-xs mt-1 uppercase tracking-wide">
                Admin Dashboard
              </p>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold ${
                stats.electionStatus === "Active"
                  ? "bg-brand-green-soft text-brand-green"
                  : "bg-brand-wine-soft text-brand-wine"
              }`}
            >
              <Circle
                className={`w-2.5 h-2.5 ${
                  stats.electionStatus === "Active"
                    ? "fill-brand-green text-brand-green"
                    : "fill-brand-wine text-brand-wine"
                }`}
              />
              Election {stats.electionStatus}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-brand-wine-soft border border-brand-wine/10 text-brand-wine p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Voters
            </div>
            <div className="text-4xl font-bold mt-3 text-gray-900">
              {loading ? "—" : stats.totalVoters}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Votes Cast
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-green">
              {loading ? "—" : stats.votesCast}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Turnout
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-yellow">
              {stats.totalVoters > 0
                ? Math.round((stats.votesCast / stats.totalVoters) * 100)
                : 0}
              %
            </div>
          </div>
        </div>

        {/* Quick Actions & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h3 className="font-semibold text-lg text-gray-900 mb-5">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-5">
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
                <h4 className="font-semibold text-gray-900">Register Voters</h4>
                <p className="text-sm text-gray-500 mt-1">Single or Bulk</p>
              </button>

              <button
                onClick={() => navigate("/admin/generate-token")}
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <Ticket
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />
                </div>
                <h4 className="font-semibold text-gray-900">Generate Tokens</h4>
                <p className="text-sm text-gray-500 mt-1">For students</p>
              </button>

              <button
                onClick={() => navigate("/admin/list-voters")}
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <Users
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />
                </div>
                <h4 className="font-semibold text-gray-900">Manage Voters</h4>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
