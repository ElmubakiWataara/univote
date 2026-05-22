// frontend/src/pages/Settings.jsx
import AdminLayout from "../components/AdminLayout";

const Settings = () => {
  return (
    <AdminLayout currentPage="settings">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="bg-white rounded-3xl shadow p-10 space-y-10">
          <div>
            <h2 className="text-xl font-semibold mb-4">Election Title</h2>
            <input
              type="text"
              className="w-full px-6 py-4 border border-gray-300 rounded-2xl"
              defaultValue="University Student Council Election 2026"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Upload Election Logo</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
              <p className="text-gray-500">Click to upload logo (PNG/JPG)</p>
            </div>
          </div>

          <div className="pt-6 border-t">
            <button className="px-8 py-4 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700">
              Logout from All Devices
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
