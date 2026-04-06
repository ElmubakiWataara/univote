// frontend/src/pages/ListVoters.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ListVoters = () => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [editingVoter, setEditingVoter] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    department: "",
    email: "",
  });

  const { token: authToken } = useAuth();

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/admin/voters", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setVoters(res.data.voters || []);
    } catch (err) {
      console.error("Failed to fetch voters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete voter "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:3000/api/admin/voters/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setVoters(voters.filter((v) => v.id !== id));
      alert(`Voter "${name}" deleted successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete voter");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (voter) => {
    setEditingVoter(voter);
    setEditForm({
      student_id: voter.student_id,
      full_name: voter.full_name,
      department: voter.department || "",
      email: voter.email || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingVoter) return;

    try {
      const res = await axios.put(
        `http://localhost:3000/api/admin/voters/${editingVoter.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      // Refresh the list to get the latest status from backend
      await fetchVoters();
      setEditingVoter(null);
      alert("Voter updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update voter");
    }
  };
  const filteredVoters = voters.filter(
    (v) =>
      v.student_id.toLowerCase().includes(search.toLowerCase()) ||
      v.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout currentPage="voters">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">List of Voters</h1>
          <input
            type="text"
            placeholder="Search voters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-5 py-3 w-80 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-5 px-8 font-medium text-gray-600 w-12">
                  SN
                </th>
                <th className="text-left py-5 px-8 font-medium text-gray-600">
                  Student ID
                </th>
                <th className="text-left py-5 px-8 font-medium text-gray-600">
                  Full Name
                </th>
                <th className="text-left py-5 px-8 font-medium text-gray-600">
                  Department
                </th>
                <th className="text-center py-5 px-8 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-center py-5 px-8 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVoters.map((voter, index) => (
                <tr key={voter.id} className="hover:bg-gray-50 transition">
                  <td className="py-5 px-8 text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="py-5 px-8 font-mono text-gray-800">
                    {voter.student_id}
                  </td>
                  <td className="py-5 px-8 font-medium">{voter.full_name}</td>
                  <td className="py-5 px-8 text-gray-600">
                    {voter.department || "—"}
                  </td>
                  <td className="py-5 px-8 text-center">
                    {voter.has_voted ? (
                      <span className="px-6 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-3xl">
                        Voted
                      </span>
                    ) : (
                      <span className="px-6 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-3xl">
                        Not Voted
                      </span>
                    )}
                  </td>
                  <td className="py-5 px-8 text-center space-x-4">
                    <button
                      onClick={() => openEditModal(voter)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(voter.id, voter.full_name)}
                      disabled={deletingId === voter.id}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {deletingId === voter.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVoters.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-500">
              No voters found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Edit Voter Modal */}
      {editingVoter && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Voter</h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  value={editForm.student_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, student_id: e.target.value })
                  }
                  disabled={editingVoter.has_voted} // ← Cannot edit ID if already voted
                  className={`w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600 ${
                    editingVoter.has_voted
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  required
                />
                {editingVoter.has_voted && (
                  <p className="text-xs text-amber-600 mt-1">
                    Student ID cannot be changed because voter has already
                    voted.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
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
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVoter(null)}
                  className="flex-1 py-4 border border-gray-300 rounded-2xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ListVoters;
