// frontend/src/pages/ResultsPage.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ResultsPage = () => {
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/admin/results", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setResults(res.data.results || {});
      setTotalVotes(res.data.total_votes || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  if (loading) {
    return (
      <AdminLayout currentPage="settings">
        <div className="flex justify-center items-center h-96">
          <p className="text-xl">Loading results...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="settings">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Election Results
            </h1>
            <p className="text-gray-600 mt-1">
              Total votes cast:{" "}
              <span className="font-semibold">{totalVotes}</span>
            </p>
          </div>
          <button
            onClick={fetchResults}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition"
          >
            Refresh Results
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {Object.keys(results).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-500">
            No results available yet.
          </div>
        ) : (
          Object.entries(results).map(([position, candidates]) => (
            <div key={position} className="bg-white rounded-3xl shadow p-8">
              <h2 className="text-2xl font-semibold mb-8 text-indigo-700 border-b pb-4">
                {position}
              </h2>

              <div className="space-y-6">
                {candidates.map((candidate, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 transition"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                      {candidate.photo_url ? (
                        <img
                          src={`http://localhost:3000${candidate.photo_url}`}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          👤
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-xl">
                        {candidate.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all"
                            style={{ width: `${candidate.percentage}%` }}
                          />
                        </div>
                        <div className="text-right w-20">
                          <span className="font-bold text-lg">
                            {candidate.votes}
                          </span>
                          <span className="text-sm text-gray-500"> votes</span>
                        </div>
                        <div className="w-16 text-right font-medium">
                          {candidate.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default ResultsPage;
