import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Ticket,
  Users,
  Settings,
  Vote,
  RefreshCw,
  Circle,
} from "lucide-react";
import API_URL from "../config/api";

// ---------- Action → visual identity (matches Audit Logs page) ----------
const ACTION_META = {
  VOTER_REGISTERED: { label: "Voter Registered", tone: "sky" },
  BULK_VOTER_REGISTERED: { label: "Bulk Registration", tone: "sky" },
  CANDIDATE_ADDED: { label: "Candidate Added", tone: "emerald" },
  CANDIDATE_UPDATED: { label: "Candidate Updated", tone: "emerald" },
  TOKEN_GENERATED: { label: "Token Generated", tone: "violet" },
  VOTE_CAST: { label: "Vote Cast", tone: "indigo" },
  BALLOT_SUBMITTED: { label: "Ballot Submitted", tone: "indigo" },
  ELECTION_TOGGLE: { label: "Election Toggled", tone: "amber" },
  ELECTION_CONFIG_UPDATED: { label: "Election Config Updated", tone: "amber" },
  ADMIN_CREATED: { label: "Admin Created", tone: "slate" },
  ADMIN_UPDATED: { label: "Admin Updated", tone: "slate" },
  ADMIN_DELETED: { label: "Admin Deleted", tone: "rose" },
};

const TONE_CLASSES = {
  sky: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
};

const ActionBadge = ({ action }) => {
  const meta = ACTION_META[action] || { label: action, tone: "slate" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${TONE_CLASSES[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
};

// ---------- Compact, human-readable summary of a log's details ----------
// This is a snapshot card, not the full audit log table, so each entry
// gets ONE short readable line rather than a raw JSON dump or a full
// breakdown — just enough to know what happened at a glance.
const parseDetails = (details) => {
  if (details == null || details === "") return null;
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }
  return details;
};

const summarizeDetails = (action, details) => {
  const parsed = parseDetails(details);
  if (parsed == null) return "—";
  if (typeof parsed === "string") return parsed;

  // Ballot / vote submissions: "2 votes cast" + who
  if (Array.isArray(parsed.votes)) {
    const count = parsed.votes_cast ?? parsed.votes.length;
    const who = parsed.student_id ? ` by ${parsed.student_id}` : "";
    return `${count} vote${count === 1 ? "" : "s"} cast${who}`;
  }

  // Voter registration: show the name
  if (parsed.full_name) {
    return `${parsed.full_name}${parsed.student_id ? ` (${parsed.student_id})` : ""}`;
  }

  // Token generation: who it was for
  if (parsed.token_value) {
    return `${parsed.voter_name || parsed.student_id || "Voter"} · token ${parsed.token_value}`;
  }

  // Election config update
  if (parsed.title || parsed.academic_year) {
    return [parsed.title, parsed.academic_year].filter(Boolean).join(" · ");
  }

  // Election toggle
  if (typeof parsed.is_active === "boolean") {
    return parsed.is_active ? "Election activated" : "Election closed";
  }

  // Generic fallback: first couple of key/value pairs, human-cased
  return Object.entries(parsed)
    .slice(0, 3)
    .map(([key, value]) => {
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const val =
        value != null && typeof value === "object"
          ? JSON.stringify(value)
          : value;
      return `${label}: ${val}`;
    })
    .join(" · ");
};

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
      const [votersRes, resultsRes, candidatesRes, electionRes, adminsRes] =
        await Promise.allSettled([
          axios.get(`${API_URL}/api/admin/voters`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get(`${API_URL}/api/admin/results`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get(`${API_URL}/api/admin/candidates`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get(`${API_URL}/api/admin/election-settings`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get(`${API_URL}/api/super/get-admins`, {
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

        totalAdmins:
          adminsRes.status === "fulfilled"
            ? adminsRes.value.data.admins?.length || 0
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

  // Fetch ONLY logs (for refresh button + polling)
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const logsRes = await axios.get(
        `${API_URL}/api/super/audit-logs?limit=8`,
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

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url; // Cloudinary
    return `${API_URL}${url}`; // local /uploads/...
  };

  // Initial load
  useEffect(() => {
    fetchSuperAdminData();
    fetchLogs();
  }, []);

  // Auto-refresh logs every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
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
                Super Administrator Dashboard
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
              Candidates
            </div>
            <div className="text-4xl font-bold mt-3 text-gray-900">
              {loading ? "—" : stats.candidates}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Admins
            </div>
            <div className="text-4xl font-bold mt-3 text-gray-900">
              {loading ? "—" : stats.totalAdmins}
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
                onClick={() => navigate("/admin/list-candidates")}
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <Users
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />
                </div>
                <h4 className="font-semibold text-gray-900">
                  Manage Candidates
                </h4>
              </button>

              <button
                onClick={() => navigate("/admin/election-config")}
                className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
                  <Settings
                    className="w-5 h-5 text-brand-green"
                    strokeWidth={1.75}
                  />
                </div>
                <h4 className="font-semibold text-gray-900">
                  Settings &amp; Control
                </h4>
              </button>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-lg text-gray-900">
                Recent Activity
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm rounded-lg hover:bg-gray-50 hover:border-brand-green/40 transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${logsLoading ? "animate-spin" : ""}`}
                    strokeWidth={1.75}
                  />
                  {logsLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={() => navigate("/admin/audit-logs")}
                  className="text-brand-green text-sm font-medium hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => (
                  <div
                    key={log.id ?? i}
                    className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <ActionBadge action={log.action} />
                      <p className="text-gray-600 text-sm mt-1.5 truncate">
                        {summarizeDetails(log.action, log.details)}
                      </p>
                    </div>
                    <div className="text-gray-400 text-xs whitespace-nowrap pt-0.5">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 py-12 text-center">
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
