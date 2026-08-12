import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { UploadCloud, FileText } from "lucide-react";

const RegisterVoter = () => {
  const [formData, setFormData] = useState({
    student_id: "",
    full_name: "",
    department: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const { token: authToken } = useAuth();

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        `${API_URL}/api/admin/register-voter`,
        formData,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess(`Voter ${res.data.voter.full_name} registered successfully!`);
      setFormData({ student_id: "", full_name: "", department: "", email: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register voter");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    setBulkLoading(true);
    setBulkResult(null);
    setError("");

    const form = new FormData();
    form.append("file", bulkFile);

    try {
      const res = await axios.post(`${API_URL}/api/admin/voters/bulk`, form, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setBulkResult(res.data);
      setBulkFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const inputClass =
    "w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine";

  return (
    <AdminLayout currentPage="voters">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Register Voters
        </h1>
        <p className="text-gray-500">
          Register students one by one or upload a CSV in bulk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* === SINGLE REGISTRATION === */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-8">
            Basic Details
          </h2>

          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className={inputClass}
                placeholder="Enter Full Name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      student_id: e.target.value.toUpperCase(),
                    })
                  }
                  className={inputClass}
                  placeholder="U2023001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Computer Science"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={inputClass}
                placeholder="voter@esofa.edu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-wine hover:bg-brand-wine/90 text-white font-semibold text-lg rounded-full transition disabled:opacity-60"
            >
              {loading ? "Registering..." : "Register Voter"}
            </button>
          </form>

          {success && (
            <div className="mt-6 px-4 py-3 rounded-2xl bg-brand-green-soft text-brand-green font-medium text-sm">
              {success}
            </div>
          )}
          {error && !bulkResult && (
            <div className="mt-6 px-4 py-3 rounded-2xl bg-brand-wine-soft text-brand-wine font-medium text-sm">
              {error}
            </div>
          )}
        </div>

        {/* === BULK REGISTRATION === */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Bulk Registration
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            Upload a CSV with columns:{" "}
            <span className="font-medium text-gray-700">
              student_id, full_name, department, email
            </span>
          </p>

          <form onSubmit={handleBulkUpload}>
            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center mb-6 transition hover:border-brand-yellow hover:bg-brand-yellow-soft/30">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files[0])}
                className="hidden"
                id="bulk-upload"
              />
              <label htmlFor="bulk-upload" className="cursor-pointer block">
                <div className="mx-auto w-16 h-16 rounded-full bg-brand-yellow flex items-center justify-center mb-3 shadow-md shadow-brand-yellow/30">
                  {bulkFile ? (
                    <FileText
                      className="w-7 h-7 text-white"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <UploadCloud
                      className="w-7 h-7 text-white"
                      strokeWidth={1.75}
                    />
                  )}
                </div>
                <span className="text-gray-600 font-medium text-sm">
                  {bulkFile ? bulkFile.name : "Choose CSV File"}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!bulkFile || bulkLoading}
              className="w-full py-4 bg-brand-yellow hover:bg-brand-yellow/90 text-white font-semibold text-lg rounded-full transition disabled:opacity-60"
            >
              {bulkLoading
                ? "Processing Bulk Upload..."
                : "Upload & Register All"}
            </button>
          </form>

          {bulkResult && (
            <div className="mt-6 p-6 bg-brand-green-soft border border-brand-green/10 rounded-2xl">
              <h3 className="font-semibold text-brand-green mb-3 text-sm">
                Bulk Upload Summary
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Total Records:{" "}
                <span className="font-medium">{bulkResult.summary.total}</span>
                <br />
                Successfully Added:{" "}
                <span className="font-medium text-brand-green">
                  {bulkResult.summary.success}
                </span>
                <br />
                Failed / Skipped:{" "}
                <span className="font-medium text-brand-wine">
                  {bulkResult.summary.failed}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default RegisterVoter;
