import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import { Camera } from "lucide-react";

const AddCandidate = () => {
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    yes_or_no: "",
    bio: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { token: authToken } = useAuth();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("position", formData.position);
      form.append("yes_or_no", formData.yes_or_no);
      if (formData.bio) form.append("bio", formData.bio);
      if (photo) form.append("photo", photo);

      const res = await axios.post(`${API_URL}/api/admin/candidates`, form, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setSuccess(`Candidate "${res.data.candidate.name}" added successfully!`);
      setFormData({ name: "", position: "", yes_or_no: "", bio: "" });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add candidate. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="candidates">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          Add New Candidate
        </h1>
        <p className="text-gray-500 mb-8">
          Add a candidate to the election ballot.
        </p>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-8">
            Basic Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name + Photo row */}
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                  placeholder="Enter Full Name"
                  required
                />
              </div>

              {/* Photo upload circle */}
              <div className="flex flex-col items-center shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-brand-yellow flex items-center justify-center shadow-md shadow-brand-yellow/30 hover:scale-105 transition overflow-hidden">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500 mt-3">
                    {photoPreview ? "Change Photo" : "Add Photo"}
                  </span>
                </label>
              </div>
            </div>

            {/* Position + Yes/No row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                  placeholder="President, Secretary..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Yes / No (Optional)
                </label>
                <input
                  type="text"
                  value={formData.yes_or_no}
                  onChange={(e) =>
                    setFormData({ ...formData, yes_or_no: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-full outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine"
                  placeholder="For unopposed candidates"
                />
              </div>
            </div>

            {/* Bio full width */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Motto / Manifesto (Optional)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl h-28 outline-none transition focus:ring-2 focus:ring-brand-wine/20 focus:border-brand-wine resize-none"
                placeholder="Brief introduction or campaign statement..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-wine hover:bg-brand-wine/90 text-white font-semibold text-lg rounded-full transition disabled:opacity-60"
            >
              {loading ? "Adding Candidate..." : "Add Candidate"}
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
    </AdminLayout>
  );
};

export default AddCandidate;
