// frontend/src/pages/RegisterVoter.jsx
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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

  const { token: authToken } = useAuth();

  const handleSubmit = async (e) => {
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

  return (
    <AdminLayout currentPage="voters">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Register New Voter
        </h1>
        <p className="text-gray-600 mb-8">
          Add a new student to the voting system.
        </p>

        <div className="bg-white rounded-3xl shadow p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
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
      </div>
    </AdminLayout>
  );
};

export default RegisterVoter;
