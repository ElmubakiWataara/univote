// frontend/src/components/AdminLayout.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = user?.role === "admin";

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
      path: "/admin/dashboard",
    },
    {
      id: "voters",
      label: "Manage Voters",
      icon: "👥",
      submenu: [
        {
          id: "register-voter",
          label: "Register Voters",
          path: "/admin/register-voter",
        },
        {
          id: "generate-token",
          label: "Generate Tokens",
          path: "/admin/generate-token",
        },
        {
          id: "list-voters",
          label: "List of Voters",
          path: "/admin/list-voters",
        },
      ],
    },
    {
      id: "candidates",
      label: "Manage Candidates",
      icon: "🏆",
      submenu: [
        {
          id: "add-candidate",
          label: "Add Candidate",
          path: "/admin/add-candidate",
        },
        {
          id: "list-candidates",
          label: "List of Candidates",
          path: "/admin/list-candidates",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      path: "/admin/settings",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`h-full bg-gradient-to-b from-indigo-950 to-slate-950 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? "w-72" : "w-20"}`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
            🗳️
          </div>
          {sidebarOpen && (
            <span className="font-bold text-2xl tracking-tight">UniVote</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.id} className="mb-2">
              {item.path ? (
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all hover:bg-white/10 ${isActive(item.path) ? "bg-white/15 font-medium" : ""}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ) : (
                <div className="px-5 py-3 text-white/70 font-medium flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && item.label}
                </div>
              )}

              {/* Submenu */}
              {sidebarOpen && item.submenu && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => navigate(sub.path)}
                      className={`w-full text-left px-5 py-2.5 text-sm rounded-xl transition-all hover:bg-white/10 ${isActive(sub.path) ? "bg-white/15 text-white" : "text-white/80"}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center text-xl">
              👤
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.username}</p>
                <p className="text-xs text-white/60 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b flex items-center px-8 justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl text-gray-600 hover:text-gray-900 transition"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>

          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-gray-700">
              {isSuperAdmin ? "Super Administrator" : "Administrator"}
            </div>

            <button
              onClick={logout}
              className="px-6 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-2xl transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
