// frontend/src/pages/OwnerDashboard.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const OwnerDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/owner/organizations",
        formData,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess("Organization registered successfully!");
      setFormData({ name: "", email: "", phone: "", password: "" });
      fetchOrganizations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to register organization",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout currentPage="owner">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>

        {/* Register New Organization */}
        <div className="bg-white rounded-3xl shadow p-8 max-w-lg">
          <h2 className="text-2xl font-semibold mb-6">
            Register New Faculty/Organization
          </h2>
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (SuperAdmin Login)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (Optional)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password for SuperAdmin
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition"
            >
              {submitting ? "Registering..." : "Register Organization"}
            </button>
          </form>

          {success && <p className="mt-4 text-green-600">{success}</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>

        {/* List of Organizations */}
        <div className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-2xl font-semibold mb-6">
            Registered Organizations
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4">Name</th>
                  <th className="text-left py-4">Email</th>
                  <th className="text-left py-4">Status</th>
                  <th className="text-left py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="py-4">{org.name}</td>
                    <td className="py-4">{org.email}</td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${org.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="py-4">Actions</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OwnerDashboard;
