import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { Inbox, PartyPopper, Camera, User } from "lucide-react";

const VotingPage = () => {
  const [positions, setPositions] = useState([]);
  const [selections, setSelections] = useState({});
  const [skippedPositions, setSkippedPositions] = useState(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const { token, logout } = useAuth();
  const navigate = useNavigate();

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
        <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center text-gray-400">
          <Camera className="w-6 h-6" strokeWidth={1.5} />
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

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    loadCandidates();
  }, [token]);

  const loadCandidates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vote/candidates`, {
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
    setSkippedPositions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(position);
      return newSet;
    });
  };

  const skipPosition = (position) => {
    setSkippedPositions((prev) => {
      const newSet = new Set(prev);
      newSet.add(position);
      return newSet;
    });

    setSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[position];
      return newSelections;
    });

    if (currentStep < positions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
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
    if (submitting) return;
    setSubmitting(true);

    try {
      const votedCount = Object.keys(selections).length;
      const skippedCount = skippedPositions.size;
      const totalPositions = positions.length;
      const interactedCount = votedCount + skippedCount;

      if (interactedCount < totalPositions) {
        const untouched = totalPositions - interactedCount;
        alert(`You have ${untouched} position(s) where you neither voted nor skipped. 
              Please vote or skip all positions before submitting.`);
        setSubmitting(false);
        return;
      }

      const votesPayload = Object.entries(selections).map(
        ([position, candidateId]) => ({
          candidate_id: candidateId,
        }),
      );

      const res = await axios.post(
        `${API_URL}/api/vote/submit-ballot`,
        { votes: votesPayload },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setMessage(
        res.data.full_abstention
          ? "You have chosen to skip all positions. Your ballot has been recorded as full abstention."
          : `Thank you! You successfully voted in ${votedCount} position(s). ` +
              (skippedCount > 0
                ? `${skippedCount} position(s) were skipped.`
                : ""),
      );

      setTimeout(() => {
        logout();
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Failed to submit your ballot. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading positions...
      </div>
    );

  if (positions.length === 0) {
    setTimeout(() => {
      logout();
      navigate("/");
    }, 3000);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-yellow-soft flex items-center justify-center mb-6">
            <Inbox className="w-7 h-7 text-brand-yellow" strokeWidth={1.75} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            No Candidates Available
          </h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
            There are no candidates registered for this election yet.
            <br />
            Please contact your election administrator.
          </p>
          <p className="text-sm text-gray-400 mt-6">
            Returning to token screen...
          </p>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="min-h-screen bg-brand-green-soft flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
            <PartyPopper
              className="w-9 h-9 text-brand-green"
              strokeWidth={1.75}
            />
          </div>
          <h2 className="text-3xl font-bold text-brand-green">Thank You!</h2>
          <p className="text-lg text-gray-700 mt-3 max-w-md mx-auto px-6">
            {message}
          </p>
        </div>
      </div>
    );
  }

  const currentPosition = positions[currentStep];
  const isLastStep = currentStep === positions.length - 1;
  const isSkipped =
    currentPosition && skippedPositions.has(currentPosition.position);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2 text-gray-500">
            <span>
              Position {currentStep + 1} of {positions.length}
            </span>
            <span className="font-medium text-brand-green">
              {currentPosition?.position}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / positions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentPosition?.position}
            </h2>
            <button
              onClick={() => skipPosition(currentPosition.position)}
              className={`px-5 py-2 border rounded-xl transition text-sm font-medium ${
                isSkipped
                  ? "bg-brand-yellow text-white border-brand-yellow"
                  : "text-gray-600 border-gray-200 hover:border-brand-yellow hover:text-brand-yellow"
              }`}
            >
              {isSkipped ? "Skipped" : "Skip"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentPosition?.candidates.map((candidate) => {
              const isSelected =
                selections[currentPosition.position] === candidate.id;

              const imageSrc = candidate.photo_url
                ? candidate.photo_url.startsWith("http")
                  ? candidate.photo_url
                  : `${API_URL}${candidate.photo_url}`
                : null;

              return (
                <div
                  key={candidate.id}
                  onClick={() =>
                    selectCandidate(currentPosition.position, candidate.id)
                  }
                  className={`relative rounded-3xl overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected
                      ? "border-brand-wine shadow-lg shadow-brand-wine/20"
                      : "border-gray-100 hover:border-brand-wine/30"
                  }`}
                >
                  {/* Photo */}
                  <div className="relative h-56 sm:h-64 md:h-72 bg-brand-wine-soft overflow-hidden">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={candidate.name}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling?.classList.remove(
                            "hidden",
                          );
                        }}
                      />
                    ) : null}

                    {/* Fallback (shown if no image or load fails) */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center text-brand-wine/40 ${
                        imageSrc ? "hidden" : ""
                      }`}
                    >
                      <User className="w-16 h-16" strokeWidth={1.5} />
                    </div>

                    {/* Name overlay */}
                    <div className="absolute bottom-0 left-0 right-0  px-4 pb-4 pt-10">
                      <h3 className="text-lg font-semibold text-wine uppercase leading-tight drop-shadow">
                        {candidate.position}
                      </h3>
                    </div>

                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-wine text-white flex items-center justify-center shadow">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-brand-green text-white px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold uppercase tracking-wide flex items-center gap-1">
                        <span className="opacity-70"></span>
                        {candidate.name}
                      </p>
                      {candidate.yes_or_no && (
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[14px] font-semibold bg-brand-wine">
                          {candidate.yes_or_no}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-white bg-white" : "border-white/50"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-wine" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button
            onClick={goToPrevious}
            disabled={currentStep === 0}
            className="px-10 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium disabled:opacity-40 hover:bg-brand-yellow/50 transition"
          >
            Previous Position
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmitAllVotes}
              disabled={submitting}
              className="px-10 py-3.5 bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-xl transition disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Ballot"}
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="px-10 py-3.5 bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-xl transition"
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
