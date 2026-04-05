// frontend/src/pages/GenerateToken.jsx
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const GenerateToken = () => {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { token: authToken } = useAuth();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!studentId) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setTokenData(null);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/admin/generate-token",
        { student_id: studentId.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setTokenData(res.data);
      setSuccess(`Token generated successfully for ${res.data.voter_name}`);
      setStudentId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (tokenData?.token) {
      navigator.clipboard.writeText(tokenData.token);
      setSuccess("Token copied to clipboard!");
    }
  };

  return (
    <AdminLayout currentPage="voters">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Voter Token
        </h1>
        <p className="text-gray-600 mb-8">
          Enter a valid Student ID to generate a one-time voting token.
        </p>

        <div className="bg-white rounded-3xl shadow p-10">
          <form onSubmit={handleGenerate} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="U2023001"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !studentId}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold text-lg rounded-2xl transition"
            >
              {loading ? "Generating Token..." : "Generate Token"}
            </button>
          </form>

          {tokenData && (
            <div className="mt-10 p-8 bg-emerald-50 border border-emerald-200 rounded-3xl">
              <p className="text-emerald-700 font-semibold text-lg">
                ✅ Token Generated Successfully
              </p>
              <div className="mt-6 flex gap-4 items-center bg-white p-5 rounded-2xl border">
                <code className="font-mono text-base flex-1 break-all text-gray-800">
                  {tokenData.token}
                </code>
                <button
                  onClick={copyToken}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition"
                >
                  Copy Token
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Please write this token down and hand it to the student.
                <br />
                It will expire in 15 minutes.
              </p>
            </div>
          )}

          {error && <p className="mt-6 text-red-600 font-medium">{error}</p>}
          {success && (
            <p className="mt-6 text-emerald-600 font-medium">{success}</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GenerateToken;
