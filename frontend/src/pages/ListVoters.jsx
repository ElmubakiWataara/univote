import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { Search, Pencil, Trash2 } from "lucide-react";

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
  const [showAll, setShowAll] = useState(false);

  const { token: authToken } = useAuth();

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/voters`, {
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
      await axios.delete(`${API_URL}/api/admin/voters/${id}`, {
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
        `${API_URL}/api/admin/voters/${editingVoter.id}`,
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

  const displayedVoters = showAll
    ? filteredVoters
    : filteredVoters.slice(0, 10);

  return (
    <AdminLayout currentPage="voters">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            List of Voters
          </h1>
          <div className="relative w-80">
            <Search
              className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Search voters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">
                  SN
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Student ID
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Full Name
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Department
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedVoters.map((voter, index) => (
                <tr
                  key={voter.id}
                  className="hover:bg-brand-green-soft/20 transition"
                >
                  <td className="py-4 px-6 text-gray-400 font-medium text-sm">
                    {index + 1}
                  </td>
                  <td className="py-4 px-6 font-mono text-sm text-gray-700">
                    {voter.student_id}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {voter.full_name}
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">
                    {voter.department || "—"}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {voter.has_voted ? (
                      <span className="px-4 py-1.5 bg-brand-green-soft text-brand-green text-xs font-semibold rounded-full">
                        Voted
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 bg-brand-yellow-soft text-brand-yellow text-xs font-semibold rounded-full">
                        Not Voted
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(voter)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-brand-green-soft hover:text-brand-green transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleDelete(voter.id, voter.full_name)}
                        disabled={deletingId === voter.id}
                        className="p-2 rounded-lg text-gray-400 hover:bg-brand-wine-soft hover:text-brand-wine transition disabled:opacity-50"
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

          {filteredVoters.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-400">
              No voters found matching your search.
            </div>
          )}

          {filteredVoters.length > 10 && (
            <div className="p-4 border-t border-gray-100 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 text-sm font-medium text-brand-wine hover:bg-brand-wine-soft rounded-full transition"
              >
                {showAll ? "Show Less" : `Show All (${filteredVoters.length})`}
              </button>
            </div>
          )}

          {filteredVoters.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-400">
              No voters found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Edit Voter Modal */}
      {editingVoter && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditingVoter(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-8">
              Edit Voter
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={editForm.student_id}
                    onChange={(e) =>
                      setEditForm({ ...editForm, student_id: e.target.value })
                    }
                    disabled={editingVoter.has_voted}
                    className={`w-full px-5 py-3.5 border rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine ${
                      editingVoter.has_voted
                        ? "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-50 border-gray-100"
                    }`}
                    required
                  />
                  {editingVoter.has_voted && (
                    <p className="text-xs text-brand-yellow mt-2">
                      Student ID cannot be changed because this voter has
                      already voted.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVoter(null)}
                  className="flex-1 py-3.5 border border-gray-200 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-brand-wine text-white font-semibold rounded-full hover:bg-brand-wine/90 transition"
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
