// frontend/src/pages/ResultsPage.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ResultsPage = () => {
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null); // For modal

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

  // Get color based on rank
  const getRankColor = (rank, totalCandidates) => {
    if (rank === 1) return "bg-emerald-500";
    if (rank === totalCandidates) return "bg-red-500";
    if (totalCandidates <= 3) return rank === 2 ? "bg-amber-500" : "bg-red-500";
    const ratio = (rank - 1) / (totalCandidates - 1);
    if (ratio < 0.3) return "bg-teal-500";
    if (ratio < 0.6) return "bg-amber-500";
    return "bg-orange-500";
  };

  const openCandidateModal = (candidate, position, rank) => {
    setSelectedCandidate({ ...candidate, position, rank });
  };

  const closeModal = () => setSelectedCandidate(null);

  // Export functions (unchanged)
  const exportToExcel = () => {
    /* ... your existing code ... */
  };
  const exportToPDF = () => {
    /* ... your existing code ... */
  };

  if (loading) {
    return (
      <AdminLayout currentPage="settings">
        <div className="flex justify-center items-center h-96">
          Loading results...
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

          <div className="flex gap-4">
            <button
              onClick={exportToExcel}
              className="px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition flex items-center gap-2"
            >
              📊 Excel
            </button>
            <button
              onClick={exportToPDF}
              className="px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition flex items-center gap-2"
            >
              📄 PDF
            </button>
            <button
              onClick={fetchResults}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>
        )}

        {Object.keys(results).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-500">
            No results available yet.
          </div>
        ) : (
          Object.entries(results).map(([position, candidates]) => {
            const sortedCandidates = [...candidates].sort(
              (a, b) => b.votes - a.votes,
            );
            const totalCandidates = sortedCandidates.length;

            return (
              <div key={position} className="bg-white rounded-3xl shadow p-8">
                <h2 className="text-2xl font-semibold mb-8 text-indigo-700 border-b pb-4">
                  {position}
                </h2>

                <div className="space-y-6">
                  {sortedCandidates.map((candidate, index) => {
                    const rank = index + 1;
                    const colorClass = getRankColor(rank, totalCandidates);
                    const percentage = candidate.percentage || 0;

                    return (
                      <div
                        key={index}
                        onClick={() =>
                          openCandidateModal(candidate, position, rank)
                        }
                        className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition group"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          {candidate.photo_url ? (
                            <img
                              src={`http://localhost:3000${candidate.photo_url}`}
                              alt={candidate.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://via.placeholder.com/64x64?text=No+Photo";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                              👤
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-xl group-hover:text-indigo-600 transition">
                                {candidate.name}
                              </h3>
                              <span className="text-sm text-gray-500">
                                {/* Rank #{rank} */}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-2xl">
                                {candidate.votes}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                votes
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-700 ${colorClass}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-16 text-right font-medium text-lg">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-3xl text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {selectedCandidate.photo_url ? (
                    <img
                      src={`http://localhost:3000${selectedCandidate.photo_url}`}
                      alt={selectedCandidate.name}
                      className="w-64 h-64 object-cover rounded-3xl shadow"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-3xl flex items-center justify-center text-8xl">
                      👤
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-gray-900">
                    {selectedCandidate.name}
                  </h2>
                  <p className="text-2xl text-indigo-600 mt-1">
                    {selectedCandidate.position}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-gray-500">Votes Received</p>
                      <p className="text-5xl font-bold text-gray-900 mt-1">
                        {selectedCandidate.votes}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Percentage</p>
                      <p className="text-5xl font-bold text-gray-900 mt-1">
                        {selectedCandidate.percentage}%
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.bio && (
                    <div className="mt-10">
                      <p className="text-sm text-gray-500 mb-3">
                        Bio / Manifesto
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedCandidate.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ResultsPage;
