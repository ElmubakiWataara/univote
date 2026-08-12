import { useState, useEffect } from "react";
import OwnerLayout from "../components/OwnerLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  UserPlus,
} from "lucide-react";

const OwnerDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({
    totalVoters: 0,
    totalVotes: 0,
    totalAdmins: 0,
    totalCandidates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token: authToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until AuthContext has finished restoring the token
    if (authLoading) return;

    if (!authToken) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [orgRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/owner/organizations`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get(`${API_URL}/api/owner/stats`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        setOrganizations(orgRes.data.organizations || []);
        setStats(statsRes.data.stats || {});
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken, authLoading]);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage platform organizations and elections
          </p>
        </div>

        {error && (
          <div className="p-4 bg-brand-wine-soft text-brand-wine rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Organization Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Total Organizations
            </div>
            <div className="text-4xl font-bold mt-3 text-gray-900">
              {loading ? "—" : organizations.length}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Active
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-green">
              {loading
                ? "—"
                : organizations.filter((o) => o.status === "active").length}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              Pending
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-yellow">
              {loading
                ? "—"
                : organizations.filter((o) => o.status === "pending").length}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <Ban className="w-3.5 h-3.5" strokeWidth={1.75} />
              Suspended
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-wine">
              {loading
                ? "—"
                : organizations.filter((o) => o.status === "suspended").length}
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Voters
            </div>
            <div className="text-4xl font-bold mt-3 text-gray-900">
              {loading ? "—" : (stats.totalVoters ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Votes Cast
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-green">
              {loading ? "—" : (stats.totalVotes ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Admins
            </div>
            <div className="text-4xl font-bold mt-3 text-gray-900">
              {loading ? "—" : (stats.totalAdmins ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Candidates
            </div>
            <div className="text-4xl font-bold mt-3 text-brand-yellow">
              {loading ? "—" : (stats.totalCandidates ?? 0)}
            </div>
          </div>
        </div>

        {/* Quick Register Card */}

        <button
          onClick={() => navigate("/owner/register-organization")}
          className="p-6 border border-gray-200 hover:border-brand-green hover:bg-brand-green-soft/30 rounded-2xl text-left transition"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-green-soft flex items-center justify-center mb-4">
            <UserPlus className="w-5 h-5 text-brand-green" strokeWidth={1.75} />
          </div>
          <h4 className="font-semibold text-gray-900">
            Quick Register New Election
          </h4>
          <p className="text-sm text-gray-500 mt-6">
            {" "}
            Create a new election and generate SuperAdmin credentials
          </p>
        </button>
      </div>
    </OwnerLayout>
  );
};

export default OwnerDashboard;
