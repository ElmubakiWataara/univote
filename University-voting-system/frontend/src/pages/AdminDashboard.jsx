// frontend/src/pages/AdminDashboard.jsx
import AdminLayout from "../components/AdminLayout";

const AdminDashboard = () => {
  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with the election.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Total Voters</div>
            <div className="text-5xl font-semibold text-gray-900 mt-3">
              1,284
            </div>
            <div className="text-emerald-600 text-sm mt-2">
              ↑ 12% from last election
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Votes Cast</div>
            <div className="text-5xl font-semibold text-gray-900 mt-3">873</div>
            <div className="text-emerald-600 text-sm mt-2">68% turnout</div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Candidates</div>
            <div className="text-5xl font-semibold text-gray-900 mt-3">12</div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Election Status</div>
            <div className="mt-3">
              <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
                ● ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
          <p className="text-gray-500">
            Recent tokens generated and votes will appear here.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
