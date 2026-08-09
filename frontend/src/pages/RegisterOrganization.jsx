// frontend/src/pages/RegisterOrganization.jsx
import { useState } from "react";
import OwnerLayout from "../components/OwnerLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";

const RegisterOrganization = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        `${API_URL}/api/owner/organizations`,
        formData,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess("Organization registered successfully!");
      setFormData({ name: "", email: "", phone: "", password: "" });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to register organization",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="max-w-lg">
        <h1 className="text-3xl font-bold mb-8">Register New Election</h1>

        <div className="bg-white rounded-3xl shadow p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (SuperAdmin Login)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone (Optional)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password for SuperAdmin
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition"
            >
              {submitting ? "Registering..." : "Register Election"}
            </button>
          </form>

          {success && (
            <p className="mt-6 text-green-600 font-medium">{success}</p>
          )}
          {error && <p className="mt-6 text-red-600">{error}</p>}
        </div>
      </div>
    </OwnerLayout>
  );
};

export default RegisterOrganization;
