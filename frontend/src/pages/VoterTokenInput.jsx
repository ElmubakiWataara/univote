import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const VoterTokenInput = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [election, setElection] = useState({
    title: "",
    logo: "", // This will be relative path like "/uploads/xxx.jpg"
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchElectionSettings();
  }, []);

  const fetchElectionSettings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/public/election-info",
      );

      if (res.data.success) {
        const logoUrl = res.data.election.logo_url || "";

        setElection({
          title: res.data.election.title || "Voting Portal",
          logo: logoUrl,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/verify-token",
        { token },
      );

      if (res.data.success) {
        login(res.data.token, res.data.voter);
        navigate("/vote");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get safe image URL
  const getImageUrl = (logoPath) => {
    if (!logoPath) return null;
    return logoPath.startsWith("http")
      ? logoPath
      : logoPath.startsWith("/")
        ? logoPath
        : `/uploads/${logoPath}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
      {/* Background Logo */}
      {election.logo && (
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-10"
          style={{
            backgroundImage: `url(${getImageUrl(election.logo)})`,
            backgroundSize: "50%",
          }}
        />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/40" />

      {/* Login Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/50">
        {/* Logo */}
        {election.logo && (
          <div className="flex justify-center mb-2">
            <img
              src={getImageUrl(election.logo)}
              alt=" "
              className="w-24 h-24 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/96x96?text=Logo";
              }}
            />
          </div>
        )}

        <div className="text-center mb-4 ">
          <h1 className="text-3xl font-bold text-gray-800">{election.title}</h1>
          <p className="text-lg text-gray-800 mt-1">
            Enter your voting token below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-00 mb-2">
              Voting Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-lg tracking-[0.35em] text-center uppercase"
              placeholder="YS2W0Z"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Continue to Vote"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/admin/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Administrator Login →
          </a>
        </div>
      </div>
    </div>
  );
};

export default VoterTokenInput;
