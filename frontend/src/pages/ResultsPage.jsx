// frontend/src/pages/ResultsPage.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import API_URL from "../config/api";
import { FileSpreadsheet, FileText, RefreshCw, X, User } from "lucide-react";

const ResultsPage = () => {
  const [results, setResults] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const { token: authToken } = useAuth();

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/results`, {
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

  const getRankColor = (rank, totalCandidates) => {
    if (rank === 1) return "bg-brand-green";
    if (rank === totalCandidates) return "bg-brand-wine";
    return "bg-brand-yellow";
  };

  const openCandidateModal = (candidate, position, rank) => {
    setSelectedCandidate({ ...candidate, position, rank });
  };

  const closeModal = () => setSelectedCandidate(null);

  //exports to excel
  const exportToExcel = () => {
    const data = [];
    Object.entries(results).forEach(([position, candidates]) => {
      candidates.forEach((c) => {
        data.push({
          Position: position,
          Candidate: c.name,
          Votes: c.votes,
          Percentage: `${c.percentage}%`,
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

  // export to pdf
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
        `${c.percentage}%`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Candidate", "Votes", "Percentage"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 11 },
        headStyles: { fillColor: [21, 128, 61] }, // brand-green
      });

      y = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Election_Results_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url; // Cloudinary
    return `${API_URL}${url}`; // local /uploads/...
  };

  // Reusable Image Component
  const CandidateImage = ({ photo_url, name, size = "16" }) => {
    const [failed, setFailed] = useState(false);
    const src = getImageUrl(photo_url);

    const sizeClass = size === "20" ? "w-20 h-20" : "w-16 h-16";

    if (!src || failed) {
      return (
        <div
          className={`${sizeClass} bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400`}
        >
          <User className="w-1/2 h-1/2" strokeWidth={1.5} />
        </div>
      );
    }

    return (
      <div
        className={`${sizeClass} bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0`}
      >
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout currentPage="settings">
        <div className="flex justify-center items-center h-96 text-gray-500">
          Loading results...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Election Results
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Total votes cast:{" "}
              <span className="font-semibold text-gray-700">{totalVotes}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="px-5 py-2.5 bg-brand-wine hover:bg-brand-wine/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" strokeWidth={1.75} />
              PDF
            </button>
            <button
              onClick={fetchResults}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-brand-wine-soft text-brand-wine font-medium text-sm">
            {error}
          </div>
        )}

        {Object.keys(results).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
            No results available yet.
          </div>
        ) : (
          Object.entries(results).map(([position, candidates]) => {
            const sortedCandidates = [...candidates].sort(
              (a, b) => b.votes - a.votes,
            );
            const totalCandidates = sortedCandidates.length;

            return (
              <div
                key={position}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
              >
                <h2 className="text-xl font-semibold mb-6 text-gray-900 border-b border-gray-100 pb-4">
                  {position}
                </h2>

                <div className="space-y-3">
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
                        className="flex items-center gap-5 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition group"
                      >
                        <CandidateImage
                          photo_url={candidate.photo_url}
                          name={candidate.name}
                        />

                        {candidate.yes_or_no && (
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              candidate.yes_or_no === "YES"
                                ? "bg-brand-green-soft text-brand-green"
                                : "bg-brand-wine-soft text-brand-wine"
                            }`}
                          >
                            {candidate.yes_or_no}
                          </span>
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-brand-green transition">
                                {candidate.name}
                              </h3>
                              <span className="text-sm text-gray-400">
                                Rank #{rank}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xl text-gray-900">
                                {candidate.votes}
                              </span>
                              <span className="text-sm text-gray-400 ml-1">
                                votes
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-700 ${colorClass}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-14 text-right font-medium text-gray-700">
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
      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo section */}
            <div className="relative bg-brand-wine-soft">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>

              {selectedCandidate.photo_url ? (
                <img
                  src={
                    selectedCandidate.photo_url.startsWith("http")
                      ? selectedCandidate.photo_url
                      : `${API_URL}${selectedCandidate.photo_url}`
                  }
                  alt={selectedCandidate.name}
                  className="w-full h-72 object-cover object-top"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = none;
                  }}
                />
              ) : (
                <div className="w-full h-72 flex items-center justify-center text-6xl text-brand-wine/40">
                  👤
                </div>
              )}

              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-16">
                <h3 className="text-4xl font-bold text-white uppercase leading-tight">
                  {selectedCandidate.name}
                </h3>
              </div>
            </div>

            {/* Stats footer */}
            <div className="bg-brand-wine text-white px-5 py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xl font-bold uppercase tracking-wide text-white/80 flex items-center gap-1">
                    <span className="opacity-70"></span>
                    {selectedCandidate.position}
                  </p>
                  <p className="mt-2 text-2xl font-bold leading-none">
                    {selectedCandidate.votes.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/70 mt-1">votes</p>

                  {selectedCandidate.yes_or_no && (
                    <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/15">
                      {selectedCandidate.yes_or_no}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-4xl font-bold leading-none">
                    {selectedCandidate.percentage}%
                  </p>
                </div>
              </div>

              {selectedCandidate.bio && (
                <div className="mt-5 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/70 mb-1">Bio / Manifesto</p>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {selectedCandidate.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ResultsPage;
