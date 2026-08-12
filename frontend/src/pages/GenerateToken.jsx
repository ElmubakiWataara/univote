import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { CheckCircle2, Copy } from "lucide-react";

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
        `${API_URL}/api/admin/generate-token`,
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Generate Voter Token
        </h1>
        <p className="text-gray-500 mb-8">
          Enter a valid Student ID to generate a one-time voting token.
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3.5 text-lg border border-gray-200 rounded-xl outline-none transition focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                placeholder="U2023001"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !studentId}
              className="w-full py-3.5 bg-brand-green hover:bg-brand-green/90 disabled:bg-gray-300 text-white font-semibold text-lg rounded-xl transition"
            >
              {loading ? "Generating Token..." : "Generate Token"}
            </button>
          </form>

          {tokenData && (
            <div className="mt-8 p-6 bg-brand-green-soft border border-brand-green/10 rounded-2xl">
              <div className="flex items-center gap-2 text-brand-green font-semibold">
                <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
                Token Generated Successfully
              </div>
              <div className="mt-5 flex gap-3 items-center bg-white p-4 rounded-xl border border-gray-100">
                <code className="font-mono text-xl tracking-wide flex-1 break-all text-gray-800">
                  {tokenData.token}
                </code>
                <button
                  onClick={copyToken}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition shrink-0"
                >
                  <Copy className="w-4 h-4" strokeWidth={1.75} />
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Please write this token down and hand it to the student.
                <br />
                It will expire in 15 minutes.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 px-4 py-3 rounded-xl bg-brand-wine-soft text-brand-wine font-medium text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 px-4 py-3 rounded-xl bg-brand-green-soft text-brand-green font-medium text-sm">
              {success}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GenerateToken;
