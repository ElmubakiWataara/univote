import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const SuperAdminDashboard = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkElectionStatus();
    fetchAuditLogs();
  }, []);

  const checkElectionStatus = async () => {
    try {
      // For now, we'll use toggle response or a separate endpoint later
      const res = await axios.get(
        "http://localhost:3000/api/super/audit-logs",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Simple way: assume last toggle tells us status (can improve later)
    } catch (err) {}
  };

  const toggleElection = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3000/api/super/toggle-election",
        { is_active: !isActive },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setIsActive(res.data.settings.is_active);
      setMessage(
        `Election is now ${res.data.settings.is_active ? "ACTIVE" : "CLOSED"}`,
      );
    } catch (err) {
      setMessage("Failed to toggle election");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/super/audit-logs",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Election Control */}
        <div className="bg-white rounded-3xl shadow p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6">Election Control</h2>

          <div className="flex items-center gap-6">
            <div
              className={`text-2xl font-bold ${isActive ? "text-green-600" : "text-red-600"}`}
            >
              {isActive ? "● ELECTION IS ACTIVE" : "● ELECTION IS CLOSED"}
            </div>

            <button
              onClick={toggleElection}
              disabled={loading}
              className={`px-8 py-4 rounded-2xl text-white font-semibold text-lg transition ${
                isActive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading
                ? "Updating..."
                : isActive
                  ? "CLOSE ELECTION"
                  : "OPEN ELECTION"}
            </button>
          </div>

          {message && <p className="mt-4 text-lg font-medium">{message}</p>}
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-2xl font-semibold mb-6">
            Audit Logs (Recent Activity)
          </h2>
          <div className="max-h-96 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Actor</th>
                  <th className="text-left py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.action}</td>
                    <td className="py-3 px-4">{log.actor_role}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
