// frontend/src/pages/ListCandidates.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ListCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      setCandidates(res.data.candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

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
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="py-5 px-8 font-medium">{candidate.name}</td>
                  <td className="py-5 px-8 text-gray-700">
                    {candidate.position}
                  </td>
                  <td className="py-5 px-8 text-gray-600 text-sm line-clamp-2">
                    {candidate.bio || "—"}
                  </td>
                  <td className="py-5 px-8 text-center space-x-6">
                    <button className="text-blue-600 hover:text-blue-700">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      Delete
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
    </AdminLayout>
  );
};

export default ListCandidates;
