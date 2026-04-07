// frontend/src/pages/ListCandidates.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ListCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    position: "",
    bio: "",
  });

  const { token: authToken } = useAuth();

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:3000/api/admin/candidates",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      // Sort by position on frontend as backup
      const sorted = (res.data.candidates || []).sort((a, b) =>
        a.position.localeCompare(b.position),
      );
      setCandidates(sorted);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete candidate "${name}"?`)) return;

    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:3000/api/admin/candidates/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setCandidates(candidates.filter((c) => c.id !== id));
      alert(`Candidate "${name}" deleted successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete candidate");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);
    setEditForm({
      name: candidate.name,
      position: candidate.position,
      bio: candidate.bio || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      const res = await axios.put(
        `http://localhost:3000/api/admin/candidates/${editingCandidate.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setCandidates(
        candidates.map((c) =>
          c.id === editingCandidate.id ? res.data.candidate : c,
        ),
      );
      setEditingCandidate(null);
      alert("Candidate updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update candidate");
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout currentPage="candidates">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            List of Candidates
          </h1>
          <input
            type="text"
            placeholder="Search candidates..."
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
                <th className="text-left py-5 px-8 font-medium text-gray-600 w-20">
                  Image
                </th>
                <th className="text-left py-5 px-8 font-medium text-gray-600">
                  Name
                </th>
                <th className="text-left py-5 px-8 font-medium text-gray-600">
                  Position
                </th>
                <th className="text-left py-5 px-8 font-medium text-gray-600">
                  Bio
                </th>
                <th className="text-center py-5 px-8 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCandidates.map((candidate, index) => (
                <tr key={candidate.id} className="hover:bg-gray-50 transition">
                  <td className="py-5 px-8 text-gray-500 font-medium">
                    {index + 1}
                  </td>

                  {/* Image Column */}
                  <td className="py-5 px-8">
                    {candidate.photo_url ? (
                      <img
                        src={`http://localhost:3000${candidate.photo_url}`}
                        // alt={candidate.name}
                        className="w-12 h-12 object-cover rounded-xl border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                        📸
                      </div>
                    )}
                  </td>

                  <td className="py-5 px-8 font-medium">{candidate.name}</td>
                  <td className="py-5 px-8 text-gray-700">
                    {candidate.position}
                  </td>
                  <td className="py-5 px-8 text-gray-600 text-sm line-clamp-2">
                    {candidate.bio || "—"}
                  </td>
                  <td className="py-5 px-8 text-center space-x-6">
                    <button
                      onClick={() => openEditModal(candidate)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id, candidate.name)}
                      disabled={deletingId === candidate.id}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {deletingId === candidate.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCandidates.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-500">
              No candidates found.
            </div>
          )}
        </div>
      </div>

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Candidate</h2>

            <form onSubmit={handleEditSubmit} className="space-y-6">
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
                  Position
                </label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl h-32 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="flex-1 py-4 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50"
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

export default ListCandidates;
