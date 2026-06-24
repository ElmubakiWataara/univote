// frontend/src/pages/ElectionConfig.jsx
import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ElectionConfig = () => {
  const [activeTab, setActiveTab] = useState("toggle");
  const [electionStatus, setElectionStatus] = useState(false);
  const [formData, setFormData] = useState({ title: "" });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  // Fetch current election settings
  //   const fetchSettings = async () => {
  //     try {
  //       const res = await axios.get("http://localhost:3000/api/super/settings", {
  //         headers: { Authorization: `Bearer ${authToken}` },
  //       });
  //       setElectionStatus(res.data.settings?.is_active || false);
  //       setFormData({ title: res.data.settings?.title || "" });
  //       if (res.data.settings?.logo_url)
  //         setLogoPreview(res.data.settings.logo_url);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   useEffect(() => {
  //     fetchSettings();
  //   }, []);

  // Toggle Election Status
  const handleToggleElection = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        "http://localhost:3000/api/super/toggle-election",
        { is_active: !electionStatus },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setElectionStatus(res.data.settings.is_active);
      setSuccess(
        `Election is now ${res.data.settings.is_active ? "ACTIVE" : "CLOSED"}`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle election");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Election Title & Logo
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();
      form.append("title", formData.title);
      if (logo) form.append("logo", logo);

      const res = await axios.put(
        "http://localhost:3000/api/super/settings",
        form,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setSuccess("Election settings updated successfully!");
      if (res.data.settings.logo_url)
        setLogoPreview(res.data.settings.logo_url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <AdminLayout currentPage="settings">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Election Configuration
        </h1>

        {/* Tabs */}
        <div className="flex border-b mb-8">
          <button
            onClick={() => setActiveTab("toggle")}
            className={`px-8 py-4 font-medium text-lg border-b-4 transition ${
              activeTab === "toggle"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Election Toggle
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-8 py-4 font-medium text-lg border-b-4 transition ${
              activeTab === "config"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Election Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "toggle" && (
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Election Status
                </h2>
                <p className="text-gray-500 mt-1">
                  Control whether voting is currently available to voters.
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  electionStatus
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {electionStatus ? "ACTIVE" : "CLOSED"}
              </span>
            </div>

            <div className="mt-8 border rounded-3xl p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    Voting Access
                  </h3>

                  <p className="text-gray-600 mt-1">
                    {electionStatus
                      ? "Students can currently cast votes."
                      : "Voting is currently disabled."}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleElection}
                  disabled={submitting}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 ${
                    electionStatus ? "bg-green-600" : "bg-gray-300"
                  } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-300 ${
                      electionStatus ? "translate-x-9" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleToggleElection}
                disabled={submitting}
                className={`w-full py-4 rounded-2xl font-semibold text-white transition ${
                  electionStatus
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting
                  ? "Updating Election Status..."
                  : electionStatus
                    ? "Close Election"
                    : "Open Election"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="bg-white rounded-3xl shadow p-10 max-w-2xl">
            <h2 className="text-2xl font-semibold mb-8">Election Settings</h2>

            <form onSubmit={handleConfigSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Election Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. University of XYZ Student Election 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Election Logo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="mx-auto h-32 object-contain"
                    />
                  ) : (
                    <div className="text-6xl text-gray-300 mb-4">🏛️</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {logoPreview ? "Change Logo" : "Upload Logo"}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition disabled:opacity-70"
              >
                {submitting ? "Saving Settings..." : "Save Election Settings"}
              </button>
            </form>
          </div>
        )}

        {success && (
          <p className="mt-6 text-green-600 font-medium">{success}</p>
        )}
        {error && <p className="mt-6 text-red-600">{error}</p>}
      </div>
    </AdminLayout>
  );
};

export default ElectionConfig;
