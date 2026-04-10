// frontend/src/pages/VotingPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const VotingPage = () => {
  const [positions, setPositions] = useState([]); // [{position, candidates}]
  const [selections, setSelections] = useState({}); // {position: candidateId}
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    loadCandidates();
  }, [token]);

  const loadCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/vote/candidates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const grouped = res.data.candidates.reduce((acc, candidate) => {
        if (!acc[candidate.position]) acc[candidate.position] = [];
        acc[candidate.position].push(candidate);
        return acc;
      }, {});

      const positionArray = Object.keys(grouped).map((position) => ({
        position,
        candidates: grouped[position],
      }));

      setPositions(positionArray);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectCandidate = (position, candidateId) => {
    setSelections((prev) => ({
      ...prev,
      [position]: candidateId,
    }));
  };

  const goToNext = () => {
    if (currentStep < positions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitAllVotes = async () => {
    setSubmitting(true);

    try {
      for (const [position, candidateId] of Object.entries(selections)) {
        await axios.post(
          "http://localhost:3000/api/vote/vote",
          { candidate_id: candidateId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      setMessage("Thank you! All your votes have been cast successfully.");
      setTimeout(() => {
        logout();
        navigate("/");
      }, 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit some votes");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading positions...
      </div>
    );

  if (message) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-4xl font-bold text-emerald-800">Thank You!</h2>
          <p className="text-xl text-emerald-700 mt-4">{message}</p>
        </div>
      </div>
    );
  }

  const currentPosition = positions[currentStep];
  const isLastStep = currentStep === positions.length - 1;
  const hasSelectedCurrent =
    currentPosition && selections[currentPosition.position];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-sm mb-2 text-gray-500">
            <span>
              Position {currentStep + 1} of {positions.length}
            </span>
            <span className="font-medium text-indigo-600">
              {currentPosition?.position}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / positions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h2 className="text-3xl font-bold text-center mb-10">
            {currentPosition?.position}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPosition?.candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() =>
                  selectCandidate(currentPosition.position, candidate.id)
                }
                className={`border-2 rounded-3xl p-8 cursor-pointer transition-all hover:shadow-md ${
                  selections[currentPosition.position] === candidate.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex gap-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                    {candidate.photo_url ? (
                      <img
                        src={`http://localhost:3000${candidate.photo_url}`}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-2xl">{candidate.name}</h3>
                    <p className="text-indigo-600 mt-1">{candidate.position}</p>
                    {candidate.bio && (
                      <p className="text-gray-600 mt-4 text-sm line-clamp-3">
                        {candidate.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      selections[currentPosition.position] === candidate.id
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selections[currentPosition.position] === candidate.id && (
                      <div className="w-3.5 h-3.5 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <button
            onClick={goToPrevious}
            disabled={currentStep === 0}
            className="px-12 py-4 border border-gray-300 rounded-2xl font-medium disabled:opacity-40 hover:bg-gray-50"
          >
            ← Previous Position
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmitAllVotes}
              disabled={
                Object.keys(selections).length !== positions.length ||
                submitting
              }
              className="px-12 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
            >
              {submitting ? "Submitting All Votes..." : "Submit All Votes"}
            </button>
          ) : (
            <button
              onClick={goToNext}
              disabled={!hasSelectedCurrent}
              className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition"
            >
              Next Position →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPage;
