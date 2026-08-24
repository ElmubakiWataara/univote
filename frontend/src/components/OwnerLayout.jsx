import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Vote,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import esofaLogo from "../assets/EsofaVotes.svg";

const OwnerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "dashboard",
      label: "Owner Dashboard",
      icon: LayoutDashboard,
      path: "/owner/dashboard",
    },
    {
      id: "register",
      label: "Register Election",
      icon: UserPlus,
      path: "/owner/register-organization",
    },
    {
      id: "manage",
      label: "Manage Elections",
      icon: Users,
      path: "/owner/organizations",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`h-full bg-gradient-to-b from-gray-900 to-slate-950 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? "w-72" : "w-20"}`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center">
            {/* <Vote className="w-5 h-5 text-white" strokeWidth={1.75} /> */}
            <img
              src={esofaLogo}
              alt="Esofa Votes"
              className="w-full h-full object-contain"
            />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-2xl tracking-tight">
              Esofa Votes
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all hover:bg-white/10 mb-2 ${isActive(item.path) ? "bg-brand-yellow/20 text-white font-medium" : ""}`}
              >
                {Icon && (
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                )}
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-2xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.username}</p>
                <p className="text-xs text-white/50">Platform Owner</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center px-8 justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            ) : (
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            )}
          </button>

          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-gray-700">
              Platform Owner
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-brand-wine hover:bg-brand-wine/90 text-white font-medium rounded-xl transition"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
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

export default OwnerLayout;
