import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const { token: authToken } = useAuth();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/super/audit-logs?limit=200`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Audit Logs
            </h1>
            <p className="text-gray-500 mt-1">
              Complete system activity history
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:border-brand-green hover:text-brand-green transition disabled:opacity-50"
          >
            <span
              className={
                loading
                  ? "animate-spin inline-block w-3 h-3 border-2 border-brand-green border-t-transparent rounded-full"
                  : ""
              }
            >
              ↻
            </span>
            {loading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action or details..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white"
          >
            <option value="all">All Actions</option>
            <option value="VOTER_REGISTERED">Voter Registered</option>
            <option value="BULK_VOTER_REGISTERED">Bulk Registration</option>
            <option value="CANDIDATE_ADDED">Candidate Added</option>
            <option value="TOKEN_GENERATED">Token Generated</option>
            <option value="VOTE_CAST">Vote Cast</option>
            <option value="BALLOT_SUBMITTED">Ballot Submitted</option>
            <option value="ELECTION_TOGGLE">Election Toggled</option>
            <option value="ADMIN_CREATED">Admin Created</option>
            <option value="ADMIN_UPDATED">Admin Updated</option>
            <option value="ADMIN_DELETED">Admin Deleted</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Actor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs
                    .slice(0, showAll ? filteredLogs.length : 10)
                    .map((log, i) => (
                      <tr
                        key={i}
                        className="hover:bg-brand-green-soft/20 transition"
                      >
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="capitalize text-gray-700">
                            {log.actor_role}
                          </span>
                          <span className="text-gray-400 ml-2">
                            #{log.actor_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-md">
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
                      className="px-8 py-20 text-center text-gray-400"
                    >
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Show All Button */}
          {filteredLogs.length > 10 && (
            <div className="p-5 border-t border-gray-100 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white font-medium text-sm rounded-xl transition inline-flex items-center gap-2"
              >
                {showAll ? "Show Less" : `Show All (${filteredLogs.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
