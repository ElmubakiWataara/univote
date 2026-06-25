import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";

const ElectionSettings = () => {
  const { token: authToken } = useAuth();

  const [activeTab, setActiveTab] = useState("toggle");

  const [electionStatus, setElectionStatus] = useState(false);

  const [config, setConfig] = useState({
    title: "",
    academic_year: "",
    description: "",
    logo_url: "",
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchElectionSettings();
  }, []);

  const fetchElectionSettings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/super/election-settings",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const settings = res.data.settings;

      setElectionStatus(settings.is_active);

      setConfig({
        title: settings.title || "",
        academic_year: settings.academic_year || "",
        description: settings.description || "",
        logo_url: settings.logo_url || "",
      });

      if (settings.logo_url) {
        setLogoPreview(`http://localhost:3000${settings.logo_url}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load election settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleElection = async () => {
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/super/toggle-election",
        {
          is_active: !electionStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      setElectionStatus(res.data.settings.is_active);

      setSuccess(
        `Election is now ${res.data.settings.is_active ? "ACTIVE" : "CLOSED"}`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setLogo(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("title", config.title);
      formData.append("academic_year", config.academic_year);
      formData.append("description", config.description);

      if (logo) {
        formData.append("logo", logo);
      }

      await axios.post(
        "http://localhost:3000/api/super/update-election-config",
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      setSuccess("Election configuration updated successfully");

      fetchElectionSettings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update election configuration",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="settings">
        <div className="p-10">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="settings">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Election Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage election status and configuration.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("toggle")}
            className={`px-6 py-3 rounded-2xl font-medium transition ${
              activeTab === "toggle"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Election Toggle
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`px-6 py-3 rounded-2xl font-medium transition ${
              activeTab === "config"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Election Configuration
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* TOGGLE TAB */}
        {activeTab === "toggle" && (
          <div className="bg-white rounded-3xl shadow p-10 max-w-3xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Election Status
                </h2>

                <p className="text-gray-600 mt-2">
                  Enable or disable voting across the system.
                </p>
              </div>

              <span
                className={`px-5 py-2 rounded-full font-semibold ${
                  electionStatus
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {electionStatus ? "ACTIVE" : "CLOSED"}
              </span>
            </div>

            <div className="mt-10 flex items-center justify-between bg-gray-50 p-6 rounded-3xl">
              <div>
                <p className="font-semibold text-lg">
                  {electionStatus
                    ? "Voting is currently enabled"
                    : "Voting is currently disabled"}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Students can vote only when the election is active.
                </p>
              </div>

              <button
                onClick={handleToggleElection}
                disabled={submitting}
                className={`px-8 py-4 rounded-2xl text-white font-semibold transition ${
                  electionStatus
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting
                  ? "Updating..."
                  : electionStatus
                    ? "Close Election"
                    : "Open Election"}
              </button>
            </div>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === "config" && (
          <div className="bg-white rounded-3xl shadow p-10 max-w-4xl">
            <form onSubmit={handleConfigSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Election Title
                </label>

                <input
                  type="text"
                  value={config.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>

                <input
                  type="text"
                  value={config.academic_year}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      academic_year: e.target.value,
                    })
                  }
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
                  placeholder="2025 / 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Election Description
                </label>

                <textarea
                  value={config.description}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-6 py-4 h-36 border border-gray-300 rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Election Logo
                </label>

                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Election Logo"
                    className="w-40 h-40 object-cover rounded-2xl border mb-4"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition"
              >
                {submitting ? "Saving..." : "Save Configuration"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ElectionSettings;
