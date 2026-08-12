import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { Camera } from "lucide-react";

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

  const inputClass =
    "w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine";

  useEffect(() => {
    fetchElectionSettings();
  }, []);

  const fetchElectionSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/election-settings`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const settings = res.data.settings;

      setElectionStatus(settings.is_active);

      setConfig({
        title: settings.title || "",
        academic_year: settings.academic_year || "",
        description: settings.description || "",
        logo_url: settings.logo_url || "",
      });

      if (settings.logo_url) {
        setLogoPreview(
          settings.logo_url.startsWith("http")
            ? settings.logo_url
            : `${API_URL}${settings.logo_url.startsWith("/") ? "" : "/"}${settings.logo_url}`,
        );
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
        `${API_URL}/api/super/toggle-election`,
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
    reader.onloadend = () => setLogoPreview(reader.result);
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
        `${API_URL}/api/super/update-election-config`,
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
        <div className="p-10 text-gray-500">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="settings">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Election Settings
          </h1>
          <p className="text-gray-500">
            Manage election status and configuration.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 rounded-full p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab("toggle")}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
              activeTab === "toggle"
                ? "bg-white text-brand-wine shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Election Toggle
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
              activeTab === "config"
                ? "bg-white text-brand-wine shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Election Configuration
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-brand-green-soft text-brand-green p-4 rounded-2xl text-sm font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-brand-wine-soft text-brand-wine p-4 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* TOGGLE TAB */}
        {activeTab === "toggle" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 max-w-3xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Election Status
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Enable or disable voting across the system.
                </p>
              </div>

              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${
                  electionStatus
                    ? "bg-brand-green-soft text-brand-green"
                    : "bg-brand-wine-soft text-brand-wine"
                }`}
              >
                {electionStatus ? "ACTIVE" : "CLOSED"}
              </span>
            </div>

            <div
              className={`mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border ${
                electionStatus
                  ? "bg-brand-green-soft/40 border-brand-green/10"
                  : "bg-brand-wine-soft/40 border-brand-wine/10"
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900">
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
                className={`px-8 py-3.5 rounded-full text-white font-semibold transition disabled:opacity-60 shrink-0 ${
                  electionStatus
                    ? "bg-brand-wine hover:bg-brand-wine/90"
                    : "bg-brand-green hover:bg-brand-green/90"
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
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-8">
              Basic Details
            </h2>

            <form onSubmit={handleConfigSubmit} className="space-y-8">
              {/* Title + Logo row */}
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Election Title
                    </label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) =>
                        setConfig({ ...config, title: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Elections"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
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
                      className={inputClass}
                      placeholder="2025 / 2026"
                    />
                  </div>
                </div>

                {/* Logo circle */}
                <div className="flex flex-col items-center shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-md shadow-brand-yellow/30 hover:scale-105 transition overflow-hidden">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Election Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-9 h-9 text-white" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500 mt-3">
                      {logoPreview ? "Change Logo" : "Add Logo"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Election Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) =>
                    setConfig({ ...config, description: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl h-28 outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine resize-none"
                  placeholder="Brief description of the election..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-brand-wine hover:bg-brand-wine/90 text-white font-semibold text-lg rounded-full transition disabled:opacity-60"
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
