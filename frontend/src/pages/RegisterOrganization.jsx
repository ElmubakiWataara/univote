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

  const inputClass =
    "w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${API_URL}/api/owner/organizations`, formData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

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
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Register New Election
        </h1>
        <p className="text-gray-500 mb-8">
          Create a election and SuperAdmin login credentials.
        </p>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-8">
            Basic Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. CSISA"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Email (SuperAdmin Login)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={inputClass}
                  placeholder="CSISA@esofa.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={inputClass}
                  placeholder="0551234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Password for SuperAdmin
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={inputClass}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-brand-wine hover:bg-brand-wine/90 text-white font-semibold text-lg rounded-full transition disabled:opacity-60"
            >
              {submitting ? "Registering..." : "Register Election"}
            </button>
          </form>

          {success && (
            <div className="mt-6 px-4 py-3 rounded-2xl bg-brand-green-soft text-brand-green font-medium text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-6 px-4 py-3 rounded-2xl bg-brand-wine-soft text-brand-wine font-medium text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};

export default RegisterOrganization;
