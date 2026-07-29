// frontend/src/pages/ManageOrganizations.jsx
import { useState, useEffect } from "react";
import OwnerLayout from "../components/OwnerLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ManageOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null); // Detail modal
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  const fetchOrganizations = async () => {
    setLoading(true);
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
      setError("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const openEditModal = (org) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      email: org.email,
      phone: org.phone || "",
    });
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.put(
        `http://localhost:3000/api/owner/organizations/${editingOrg.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess("Organization updated successfully!");
      setEditingOrg(null);
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update organization");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `http://localhost:3000/api/owner/organizations/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setSuccess(`Status updated to ${newStatus}`);
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`,
      )
    )
      return;

    try {
      await axios.delete(
        `http://localhost:3000/api/owner/organizations/${id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setSuccess(`Organization "${name}" deleted successfully`);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete organization");
    }
  };

  // Reset Election Data
  const handleResetElection = async (org) => {
    const confirmed = window.confirm(
      `⚠️ DANGEROUS ACTION\n\nYou are about to RESET all election data for "${org.name}".\nThis cannot be undone.\n\Click OK to continue.`,
    );

    if (!confirmed) return;

    setResetting(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        `http://localhost:3000/api/owner/organizations/${org.id}/reset`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess(res.data.message);
      setSelectedOrg(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset election data");
    } finally {
      setResetting(false);
    }
  };

  return (
    <OwnerLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Elections</h1>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-5 px-8">ID</th>
                  <th className="text-left py-5 px-8">Name</th>
                  <th className="text-left py-5 px-8">Email</th>
                  <th className="text-left py-5 px-8">Number</th>
                  <th className="text-left py-5 px-8">Action</th>
                  <th className="text-left py-5 px-8">Status</th>
                  <th className="text-left py-5 px-8">Crt_at</th>
                  <th className="text-left py-5 px-8">Upd_at</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-gray-500">
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedOrg(org)}
                    >
                      <td className="py-5 px-8">{org.id}</td>
                      <td className="py-5 px-8 font-medium text-indigo-600">
                        {org.name}
                      </td>
                      <td className="py-5 px-8">{org.email}</td>
                      <td className="py-5 px-8">{org.phone || "—"}</td>
                      <td
                        className="py-5 px-8 space-x-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEditModal(org)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                      <td
                        className="py-5 px-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={org.status}
                          onChange={(e) =>
                            handleStatusChange(org.id, e.target.value)
                          }
                          className={`px-4 py-2 text-sm font-medium border-0 cursor-pointer rounded-full ${
                            org.status === "active"
                              ? "bg-green-100 text-green-700"
                              : org.status === "suspended"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="py-5 px-8 text-sm text-gray-500">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-5 px-8 text-sm text-gray-500">
                        {new Date(org.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedOrg.name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Organization Details
                </p>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">ID</span>
                <span className="font-medium">{selectedOrg.id}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{selectedOrg.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{selectedOrg.phone || "—"}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedOrg.status === "active"
                      ? "bg-green-100 text-green-700"
                      : selectedOrg.status === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selectedOrg.status}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {new Date(selectedOrg.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">
                  {new Date(selectedOrg.updated_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => {
                  setSelectedOrg(null);
                  openEditModal(selectedOrg);
                }}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-2xl hover:bg-indigo-700"
              >
                Edit Organization
              </button>

              <button
                onClick={() => handleResetElection(selectedOrg)}
                disabled={resetting}
                className="w-full py-3 bg-red-600 text-white font-medium rounded-2xl hover:bg-red-700 disabled:opacity-70"
              >
                {resetting ? "Resetting..." : " Reset Election Data"}
              </button>

              <button
                onClick={() => setSelectedOrg(null)}
                className="w-full py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingOrg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Organization</h2>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="flex-1 py-4 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 disabled:opacity-70"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
};

export default ManageOrganizations;
