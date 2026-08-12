import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { Search, Pencil, Trash2 } from "lucide-react";

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
    yes_or_no: "",
  });
  const [showAll, setShowAll] = useState(false);

  const { token: authToken } = useAuth();

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/candidates`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
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

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url; // Cloudinary
    return `${API_URL}${url}`; // local /uploads/...
  };

  const CandidateImage = ({ photo_url, name }) => {
    const [failed, setFailed] = useState(false);
    const src = getImageUrl(photo_url);

    if (!src || failed) {
      return (
        <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center text-3xl text-gray-400">
          👤
        </div>
      );
    }

    return (
      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete candidate "${name}"?`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/admin/candidates/${id}`, {
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
      name: candidate.name || "",
      position: candidate.position || "",
      bio: candidate.bio || "",
      yes_or_no: candidate.yes_or_no || "", // Important
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      const res = await axios.put(
        `${API_URL}/api/admin/candidates/${editingCandidate.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      // Refresh the list to show updated yes_or_no
      await fetchCandidates();

      setEditingCandidate(null);
      alert("Candidate updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update candidate");
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.position?.toLowerCase().includes(search.toLowerCase()),
  );

  const displayedCandidates = showAll
    ? filteredCandidates
    : filteredCandidates.slice(0, 7);

  return (
    <AdminLayout currentPage="candidates">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            List of Candidates
          </h1>
          <div className="relative w-80">
            <Search
              className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="Search candidates..."
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
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide w-20">
                  Image
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Position
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Bio
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Yes/No
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedCandidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className="hover:bg-brand-green-soft/20 transition"
                >
                  <td className="py-4 px-6 text-gray-400 font-medium text-sm">
                    {index + 1}
                  </td>
                  <td className="py-4 px-6">
                    <CandidateImage
                      photo_url={candidate.photo_url}
                      name={candidate.name}
                    />
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {candidate.name}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {candidate.position}
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm line-clamp-2">
                    {candidate.bio || "—"}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium text-sm">
                    {candidate.yes_or_no || "—"}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(candidate)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-brand-green-soft hover:text-brand-green transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(candidate.id, candidate.name)
                        }
                        disabled={deletingId === candidate.id}
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

          {filteredCandidates.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-400">
              No candidates found.
            </div>
          )}

          {filteredCandidates.length > 10 && (
            <div className="p-4 border-t border-gray-100 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 text-sm font-medium text-brand-wine hover:bg-brand-wine-soft rounded-full transition"
              >
                {showAll
                  ? "Show Less"
                  : `Show All (${filteredCandidates.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingCandidate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setEditingCandidate(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-8">
              Edit Candidate
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({ ...editForm, position: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Yes / No (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.yes_or_no}
                    onChange={(e) =>
                      setEditForm({ ...editForm, yes_or_no: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                    placeholder="YES or NO"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl h-28 outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine resize-none"
                  placeholder="Brief introduction or campaign statement..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
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

export default ListCandidates;
