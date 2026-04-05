import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const VotingPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // Load candidates when page opens
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchCandidates();
  }, [token]);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/vote/candidates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data.candidates || []);
    } catch (err) {
      setError("Failed to load candidates");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/vote/vote",
        { candidate_id: selectedCandidate },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setMessage(res.data.message);
        // Auto logout after successful vote
        setTimeout(() => {
          logout();
          navigate("/");
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cast vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Cast Your Vote</h1>
            <p className="text-gray-600 mt-2">
              Welcome, <span className="font-semibold">{user?.fullName}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {message ? (
          // Success Screen
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-semibold text-green-800 mb-4">
              Thank You!
            </h2>
            <p className="text-xl text-green-700">{message}</p>
            <p className="mt-8 text-gray-500">You can now close this window.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold mb-8 text-center">
                Choose your candidate
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate.id)}
                    className={`border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedCandidate === candidate.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl">
                          {candidate.name}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {candidate.position}
                        </p>
                        {candidate.bio && (
                          <p className="text-gray-600 mt-3 text-sm line-clamp-3">
                            {candidate.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedCandidate === candidate.id
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedCandidate === candidate.id && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vote Button */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleVote}
                disabled={!selectedCandidate || submitting}
                className="px-16 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xl font-semibold rounded-2xl transition shadow-lg"
              >
                {submitting ? "Casting Vote..." : "Cast My Vote"}
              </button>
            </div>

            {error && (
              <div className="mt-6 text-center text-red-600 font-medium">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VotingPage;
