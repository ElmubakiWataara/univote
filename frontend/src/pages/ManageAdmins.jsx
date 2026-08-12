import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { Pencil, Trash2 } from "lucide-react";

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  const inputClass =
    "w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine";

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/super/get-admins`, {
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

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${API_URL}/api/super/create-admin`, formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setSuccess("Admin created successfully!");
      setFormData({ name: "", email: "", password: "" });
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditForm({ username: admin.username, password: "" });
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/api/super/admins/${editingAdmin.id}`,
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

  const handleDeleteAdmin = async (id, username) => {
    if (
      !window.confirm(
        `Delete admin "${username}"? This action cannot be undone.`,
      )
    )
      return;

    try {
      await axios.delete(`${API_URL}/api/super/admins/${id}`, {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Manage Admins
        </h1>
        <p className="text-gray-500">
          Create and manage election administrators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Create New Admin */}
        <div className="lg:col-span-2 self-start bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-8">
            Basic Details
          </h2>

          <form onSubmit={handleCreateAdmin} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={inputClass}
                placeholder="Enter admin name"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input
                type="email"
                name="new-admin-email"
                autoComplete="off"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={inputClass}
                placeholder="admin@esofa.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Password
              </label>
              <input
                type="password"
                name="new-admin-password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={inputClass}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-brand-wine hover:bg-brand-wine/90 text-white font-semibold text-lg rounded-full transition disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Admin"}
            </button>
          </form>

          {success && (
            <div className="mt-6 px-4 py-3 rounded-2xl bg-brand-green-soft text-brand-green font-medium text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-6 px-4 py-3 rounded-2xl bg-brand-wine-soft text-brand-wine font-medium text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Admins List */}
        <div className="lg:col-span-3 self-start bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              All Admins ({admins.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading admins...
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No admins found.
            </div>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      ID
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Created
                    </th>
                    <th className="text-center py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6 text-gray-400 text-sm">
                        {admin.id}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {admin.username}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`capitalize px-3 py-1 text-xs font-semibold rounded-full ${
                            admin.role === "superadmin"
                              ? "bg-brand-wine-soft text-brand-wine"
                              : "bg-brand-green-soft text-brand-green"
                          }`}
                        >
                          {admin.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-2 rounded-full text-gray-400 hover:bg-brand-wine-soft hover:text-brand-wine transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAdmin(admin.id, admin.username)
                            }
                            className="p-2 rounded-full text-gray-400 hover:bg-brand-wine-soft hover:text-brand-wine transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-8">
              Edit Admin
            </h2>

            <form onSubmit={handleUpdateAdmin} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingAdmin.email}
                  className="w-full px-5 py-3.5 bg-gray-100 border border-gray-100 rounded-full text-gray-400"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 py-3.5 border border-gray-200 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-brand-wine text-white font-semibold rounded-full hover:bg-brand-wine/90 transition disabled:opacity-60"
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
