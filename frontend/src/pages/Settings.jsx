import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { user, logout, token: authToken } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  // Profile Tab
  const [profileData, setProfileData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Add New Admin Tab (Super Admin Only)
  const [newAdminData, setNewAdminData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Election Title (for all admins)
  const [electionTitle, setElectionTitle] = useState(
    "University Student Council Election 2026",
  );

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (profileData.newPassword !== profileData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3000/api/admin/change-password",
        {
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setMessage("Password changed successfully");
      setProfileData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (newAdminData.password !== newAdminData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3000/api/super/create-admin",
        {
          username: newAdminData.username,
          password: newAdminData.password,
        },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      setMessage(`Admin "${res.data.admin.username}" created successfully`);
      setNewAdminData({ username: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  const toggleElection = async (isActive) => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3000/api/super/toggle-election",
        { is_active: isActive },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setMessage(`Election is now ${isActive ? "ACTIVE" : "CLOSED"}`);
    } catch (err) {
      setError("Failed to update election status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="settings">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="bg-white rounded-3xl shadow overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-5 text-center font-medium transition ${activeTab === "profile" ? "border-b-4 border-indigo-600 text-indigo-600" : "text-gray-600"}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("election")}
              className={`flex-1 py-5 text-center font-medium transition ${activeTab === "election" ? "border-b-4 border-indigo-600 text-indigo-600" : "text-gray-600"}`}
            >
              Election Config
            </button>
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setActiveTab("control")}
                  className={`flex-1 py-5 text-center font-medium transition ${activeTab === "control" ? "border-b-4 border-indigo-600 text-indigo-600" : "text-gray-600"}`}
                >
                  Election Control
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex-1 py-5 text-center font-medium transition ${activeTab === "users" ? "border-b-4 border-indigo-600 text-indigo-600" : "text-gray-600"}`}
                >
                  Add New Admin
                </button>
              </>
            )}
          </div>

          <div className="p-10">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold mb-8">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            )}

            {/* Election Config Tab */}
            {activeTab === "election" && (
              <div className="max-w-lg">
                <h2 className="text-2xl font-semibold mb-8">
                  Election Configuration
                </h2>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Election Title
                    </label>
                    <input
                      type="text"
                      value={electionTitle}
                      onChange={(e) => setElectionTitle(e.target.value)}
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Upload Election Logo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer text-indigo-600 hover:text-indigo-700"
                      >
                        Click to Upload Logo
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Election Control Tab (Super Admin) */}
            {activeTab === "control" && isSuperAdmin && (
              <div className="max-w-lg">
                <h2 className="text-2xl font-semibold mb-8 text-red-600">
                  Election Control
                </h2>
                <div className="space-y-8">
                  <button
                    onClick={() => toggleElection(true)}
                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xl rounded-3xl transition"
                  >
                    OPEN ELECTION
                  </button>
                  <button
                    onClick={() => toggleElection(false)}
                    className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-semibold text-xl rounded-3xl transition"
                  >
                    CLOSE ELECTION
                  </button>
                </div>
              </div>
            )}

            {/* Add New Admin Tab (Super Admin) */}
            {activeTab === "users" && isSuperAdmin && (
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold mb-8">Add New Admin</h2>
                <form onSubmit={handleCreateAdmin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={newAdminData.username}
                      onChange={(e) =>
                        setNewAdminData({
                          ...newAdminData,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newAdminData.password}
                      onChange={(e) =>
                        setNewAdminData({
                          ...newAdminData,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={newAdminData.confirmPassword}
                      onChange={(e) =>
                        setNewAdminData({
                          ...newAdminData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition"
                  >
                    Create New Admin
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
