// frontend/src/pages/AuditLogs.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { token: authToken } = useAuth();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:3000/api/super/audit-logs?limit=200",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setLogs(res.data.logs || []);
    } catch (err) {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Combined Search + Filter
  const filteredLogs = logs.filter((log) => {
    const searchTerm = search.toLowerCase().trim();

    // Text Search
    let textMatch = true;
    if (searchTerm) {
      const actionMatch = log.action?.toLowerCase().includes(searchTerm);
      const detailsMatch = log.details
        ?.toString()
        .toLowerCase()
        .includes(searchTerm);

      let dateMatch = false;
      if (log.created_at) {
        const date = new Date(log.created_at);
        const dateString = date.toLocaleDateString().toLowerCase();
        const fullDateTime = date.toLocaleString().toLowerCase();
        const isoDate = log.created_at.toLowerCase();

        dateMatch =
          dateString.includes(searchTerm) ||
          fullDateTime.includes(searchTerm) ||
          isoDate.includes(searchTerm);
      }

      textMatch = actionMatch || detailsMatch || dateMatch;
    }

    // Dropdown Filter
    let actionTypeMatch = true;
    if (filter !== "all") {
      actionTypeMatch = log.action === filter;
    }

    return textMatch && actionTypeMatch;
  });

  return (
    <AdminLayout currentPage="settings">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">
              Complete system activity history
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 border border-slate-300 bg-white text-slate-700 rounded-xl hover:bg-slate-50 hover:border-indigo-400 transition disabled:opacity-50"
          >
            <span
              className={
                loading
                  ? "animate-spin inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full"
                  : ""
              }
            >
              ↻
            </span>
            {loading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow p-6 mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search logs (action, details, date)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">All Actions</option>
            <option value="VOTER_REGISTERED">Voter Registered</option>
            <option value="BULK_VOTER_REGISTERED">Bulk Registration</option>
            <option value="CANDIDATE_ADDED">Candidate Added</option>
            <option value="VOTE_CAST">Vote Cast</option>
            <option value="ELECTION_TOGGLED">Election Toggled</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-8 py-5 text-left text-sm font-medium text-gray-500">
                    Time
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-medium text-gray-500">
                    Action
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-medium text-gray-500">
                    Actor
                  </th>
                  <th className="px-8 py-5 text-left text-sm font-medium text-gray-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-8 py-5 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-medium text-gray-900">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm">
                        <span className="capitalize">{log.actor_role}</span>
                        <span className="text-gray-500 ml-2">
                          #{log.actor_id}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-gray-600 break-words max-w-md">
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-8 py-20 text-center text-gray-500"
                    >
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
