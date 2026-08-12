import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { NonBinaryIcon } from "lucide-react";

const VoterTokenInput = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [election, setElection] = useState({
    title: "",
    logo: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-token`, {
        token,
      });

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-brand-green-soft/30 to-gray-100 flex items-center justify-center">
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-gray-900/10" />

      {/* Login Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/50">
        {/* Logo */}
        {election.logo && (
          <div className="flex justify-center mb-4">
            <img
              src={getImageUrl(election.logo)}
              alt=" "
              className="w-20 h-20 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = none;
              }}
            />
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your voting token below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voting Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              className="w-full px-5 py-4 border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-lg tracking-[0.35em] text-center uppercase"
              placeholder="YS2W0Z"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-brand-wine-soft text-brand-wine rounded-xl p-4 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white font-semibold transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Continue to Vote"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VoterTokenInput;
