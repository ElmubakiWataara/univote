// frontend/src/pages/ListVoters.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ListVoters = () => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
              {filteredVoters.map((voter) => (
                <tr key={voter.id} className="hover:bg-gray-50 transition">
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

          {filteredVoters.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-500">
              No voters found matching your search.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ListVoters;
