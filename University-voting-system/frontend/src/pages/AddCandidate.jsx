// frontend/src/pages/AddCandidate.jsx
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AddCandidate = () => {
  const [formData, setFormData] = useState({
    name: "",
    position: "",
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
      if (formData.bio) form.append("bio", formData.bio);
      if (photo) form.append("photo", photo);

      const res = await axios.post(
        "http://localhost:3000/api/admin/candidates",
        form,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            // Do NOT set Content-Type manually when using FormData
          },
        },
      );

      setSuccess(`Candidate "${res.data.candidate.name}" added successfully!`);
      setFormData({ name: "", position: "", bio: "" });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error(err);
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
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add New Candidate
        </h1>
        <p className="text-gray-600 mb-8">
          Add a candidate to the election ballot.
        </p>

        <div className="bg-white rounded-3xl shadow p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Candidate Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mx-auto h-48 w-48 object-cover rounded-2xl shadow"
                  />
                ) : (
                  <div className="text-gray-400 text-7xl mb-4"> </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium block mt-4"
                >
                  {photoPreview ? "Change Photo" : "Click to Upload Photo"}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600"
                placeholder="President, Vice President, Secretary..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio / Manifesto (Optional)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full px-6 py-4 border border-gray-300 rounded-2xl h-32 focus:ring-2 focus:ring-indigo-600"
                placeholder="Brief introduction or campaign statement..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-2xl transition disabled:opacity-70"
            >
              {loading ? "Adding Candidate..." : "Add Candidate"}
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

export default AddCandidate;
