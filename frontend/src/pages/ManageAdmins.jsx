import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/super/admins", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setAdmins(res.data.admins || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // New Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/super/create-admin",
        formData,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess("Admin created successfully!");
      setFormData({ username: "", password: "" });
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditForm({ username: admin.username, password: "" });
  };

  // Update Admin
  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setSubmitting(true);
    try {
      const res = await axios.put(
        `http://localhost:3000/api/super/admins/${editingAdmin.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess("Admin updated successfully!");
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update admin");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (id, username) => {
    if (
      !window.confirm(
        `Delete admin "${username}"? This action cannot be undone.`,
      )
    )
      return;

    try {
      await axios.delete(`http://localhost:3000/api/super/admins/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setSuccess(`Admin "${username}" deleted successfully`);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete admin");
    }
  };

  return (
    <AdminLayout currentPage="settings">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Admins</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Create New Admin - Left Sidebar */}
          <div className="lg:col-span-2 self-start bg-white rounded-3xl shadow p-8">
            <h2 className="text-xl font-semibold mb-6">Create New Admin</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4  bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create Admin"}
              </button>
            </form>

            {success && (
              <p className="mt-8 text-green-600 font-medium">{success}</p>
            )}
            {error && <p className="mt-8 text-red-600">{error}</p>}
          </div>

          {/* Admins List */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow self-start">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                All Admins ({admins.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Loading admins...
              </div>
            ) : (
              <div className="max-h-[700px] overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-5 px-8 font-medium text-gray-600">
                        ID
                      </th>
                      <th className="text-left py-5 px-8 font-medium text-gray-600">
                        Username
                      </th>
                      <th className="text-left py-5 px-8 font-medium text-gray-600">
                        Role
                      </th>
                      <th className="text-left py-5 px-8 font-medium text-gray-600">
                        Created
                      </th>
                      <th className="text-center py-5 px-8 font-medium text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="py-5 px-8">{admin.id}</td>
                        <td className="py-5 px-8 font-medium">
                          {admin.username}
                        </td>
                        <td className="py-5 px-8">
                          <span className="capitalize px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {admin.role}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-gray-500 text-sm">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-5 px-8 text-center space-x-4">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAdmin(admin.id, admin.username)
                            }
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              // Admins Table
            )}

            {admins.length === 0 && !loading && (
              <div className="p-12 text-center text-gray-500">
                No admins found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Admin</h2>
            <form onSubmit={handleUpdateAdmin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 py-4 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 disabled:opacity-70"
                >
                  {submitting ? "Updating..." : "Update Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageAdmins;
