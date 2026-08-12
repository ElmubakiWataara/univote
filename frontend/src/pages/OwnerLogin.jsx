import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { ShieldCheck } from "lucide-react";

const OwnerLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/api/owner/login`, {
        username,
        password,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate("/owner/dashboard"); // Owner dashboard
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-yellow-soft flex items-center justify-center mb-4">
            <ShieldCheck
              className="w-6 h-6 text-brand-yellow"
              strokeWidth={1.75}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Login</h1>
          <p className="text-gray-500 text-sm mt-2">Platform Administrator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              required
            />
          </div>

          {error && (
            <div className="text-center font-medium bg-brand-wine-soft text-brand-wine px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-green hover:bg-brand-green/90 text-white font-semibold text-lg rounded-xl transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login as Owner"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OwnerLogin;
