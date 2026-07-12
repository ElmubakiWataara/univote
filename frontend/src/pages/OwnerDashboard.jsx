// frontend/src/pages/OwnerDashboard.jsx
import { useState, useEffect } from "react";
import OwnerLayout from "../components/OwnerLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const OwnerDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token: authToken } = useAuth();

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/owner/organizations",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setOrganizations(res.data.organizations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <OwnerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage platform organizations and elections
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Total Organizations</div>
            <div className="text-5xl font-bold mt-4">
              {organizations.length}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Active</div>
            <div className="text-5xl font-bold mt-4 text-green-600">
              {organizations.filter((o) => o.status === "active").length}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Pending</div>
            <div className="text-5xl font-bold mt-4 text-yellow-600">
              {organizations.filter((o) => o.status === "pending").length}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow">
            <div className="text-gray-500 text-sm">Suspended</div>
            <div className="text-5xl font-bold mt-4 text-red-600">
              {organizations.filter((o) => o.status === "suspended").length}
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
