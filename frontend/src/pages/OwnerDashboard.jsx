import { useState, useEffect } from "react";
import OwnerLayout from "../components/OwnerLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";

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
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage platform organizations and elections
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl">{error}</div>
        )}

        {/* Organization Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Total Organizations</div>
            <div className="text-5xl font-bold mt-4">
              {loading ? "—" : organizations.length}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Active</div>
            <div className="text-5xl font-bold mt-4 text-green-600">
              {loading
                ? "—"
                : organizations.filter((o) => o.status === "active").length}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Pending</div>
            <div className="text-5xl font-bold mt-4 text-yellow-600">
              {loading
                ? "—"
                : organizations.filter((o) => o.status === "pending").length}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Suspended</div>
            <div className="text-5xl font-bold mt-4 text-red-600">
              {loading
                ? "—"
                : organizations.filter((o) => o.status === "suspended").length}
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Total Voters</div>
            <div className="text-5xl font-bold mt-4 text-blue-600">
              {loading ? "—" : (stats.totalVoters ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Total Votes Cast</div>
            <div className="text-5xl font-bold mt-4 text-green-600">
              {loading ? "—" : (stats.totalVotes ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Total Admins</div>
            <div className="text-5xl font-bold mt-4 text-purple-600">
              {loading ? "—" : (stats.totalAdmins ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Total Candidates</div>
            <div className="text-5xl font-bold mt-4 text-orange-600">
              {loading ? "—" : (stats.totalCandidates ?? 0)}
            </div>
          </div>
        </div>

        {/* Quick Register Card */}
        <div className="bg-white rounded-3xl shadow p-10 max-w-lg">
          <h2 className="text-2xl font-semibold mb-6">
            Quick Register New Election
          </h2>
          <p className="text-gray-600 mb-6">
            Create a new faculty election and generate SuperAdmin credentials
          </p>
          <a
            href="/owner/register-organization"
            className="inline-block px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition"
          >
            Register New Election →
          </a>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerDashboard;
