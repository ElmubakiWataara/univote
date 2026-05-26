// frontend/src/pages/RegisterVoter.jsx
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const RegisterVoter = () => {
  // Single Registration
  const [formData, setFormData] = useState({
    student_id: "",
    full_name: "",
    department: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Bulk Upload
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const { token: authToken } = useAuth();

  // Single Registration
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/admin/register-voter",
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

  // Bulk Upload
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    setBulkLoading(true);
    setBulkResult(null);

    const form = new FormData();
    form.append("file", bulkFile);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/admin/voters/bulk",
        form,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setBulkResult(res.data);
      setBulkFile(null); // Reset file input
    } catch (err) {
      setError(err.response?.data?.message || "Bulk upload failed");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="voters">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* === SINGLE REGISTRATION === */}
        <div className="bg-white rounded-3xl shadow p-10">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">
            Single Registration
          </h2>
          <p className="text-gray-600 mb-8">Register one student at a time.</p>

          <form onSubmit={handleSingleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  placeholder="U2023001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  placeholder="Computer Science"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                placeholder="student@university.edu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-2xl transition disabled:opacity-70"
            >
              {loading ? "Registering..." : "Register Voter"}
            </button>
          </form>

          {success && (
            <p className="mt-6 text-green-600 font-medium">{success}</p>
          )}
          {error && <p className="mt-6 text-red-600">{error}</p>}
        </div>

        {/* === BULK REGISTRATION === */}
        <div className="bg-white rounded-3xl shadow p-10">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">
            Bulk Registration
          </h2>
          <p className="text-gray-600 mb-6">
            Upload a CSV file with columns:{" "}
            <strong>student_id, full_name, department, email</strong>
          </p>

          <form onSubmit={handleBulkUpload}>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center mb-6">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files[0])}
                className="hidden"
                id="bulk-upload"
              />
              <label
                htmlFor="bulk-upload"
                className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium block"
              >
                {bulkFile ? bulkFile.name : "Choose CSV File"}
              </label>
            </div>

            <button
              type="submit"
              disabled={!bulkFile || bulkLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-2xl transition disabled:opacity-70"
            >
              {bulkLoading
                ? "Processing Bulk Upload..."
                : "Upload & Register All"}
            </button>
          </form>

          {bulkResult && (
            <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <h3 className="font-semibold text-emerald-700 mb-3">
                Bulk Upload Summary
              </h3>
              <p className="text-sm">
                Total Records:{" "}
                <span className="font-medium">{bulkResult.summary.total}</span>
                <br />
                Successfully Added:{" "}
                <span className="font-medium text-emerald-600">
                  {bulkResult.summary.success}
                </span>
                <br />
                Failed / Skipped:{" "}
                <span className="font-medium text-red-600">
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
