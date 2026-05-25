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

  // Export to Excel
  const exportToExcel = () => {
    const data = [];
    Object.entries(results).forEach(([position, candidates]) => {
      candidates.forEach((c) => {
        data.push({
          Position: position,
          Candidate: c.name,
          Votes: c.votes,
          Percentage: c.percentage + "%",
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Election Results");
    XLSX.writeFile(
      wb,
      `Election_Results_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Election Results", 14, 20);
    doc.setFontSize(12);
    doc.text(`Total Votes: ${totalVotes}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

    let y = 50;

    Object.entries(results).forEach(([position, candidates]) => {
      doc.setFontSize(14);
      doc.text(position, 14, y);
      y += 10;

      const tableData = candidates.map((c) => [
        c.name,
        c.votes,
        c.percentage + "%",
      ]);

      doc.autoTable({
        startY: y,
        head: [["Candidate", "Votes", "Percentage"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 11 },
        headStyles: { fillColor: [79, 70, 229] },
      });

      y = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Election_Results_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Get color based on rank in the position
  const getRankColor = (rank, totalCandidates) => {
    if (rank === 1) return "bg-emerald-500"; // Green - Leader
    if (rank === totalCandidates) return "bg-red-500"; // Red - Last
    if (totalCandidates <= 3) {
      return rank === 2 ? "bg-amber-500" : "bg-red-500";
    }
    // For 4+ candidates - smooth gradient
    const ratio = (rank - 1) / (totalCandidates - 1);
    if (ratio < 0.3) return "bg-teal-500";
    if (ratio < 0.6) return "bg-amber-500";
    return "bg-orange-500";
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
            <h1 className="text-3x1 font-bold text-gray-900">
              Election Results
            </h1>
            <p className="text-gray-900 mt-1 text-xl">
              Total votes cast:{" "}
              <span className="font-semibold text-xl">{totalVotes}</span>
            </p>
          </div>

          <div className="flex justify-between items-center  gap-4">
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
              Refresh Results
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

                <div className="space-y-8">
                  {sortedCandidates.map((candidate, index) => {
                    const rank = index + 1;
                    const colorClass = getRankColor(rank, totalCandidates);
                    const percentage = candidate.percentage || 0;

                    return (
                      <div key={index} className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                          {candidate.photo_url ? (
                            <img
                              src={`http://localhost:3000${candidate.photo_url}`}
                              // alt={candidate.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              👤
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-xl">
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
    </AdminLayout>
  );
};

export default ResultsPage;
