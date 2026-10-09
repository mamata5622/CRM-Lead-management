import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaBriefcase,
  FaPhoneAlt,
  FaBuilding,
  FaTruck,
  FaTools,
  FaTint,
  FaShieldAlt,
  FaBoxes,
  FaChartLine,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaChevronDown,
} from "react-icons/fa";

const mainMenu = [
  { name: "Dashboard", path: "/admin/dashboard", icon: FaHome },
  { name: "CRM & Leads", path: "/admin/adminleads", icon: FaUsers },
  { name: "Follow-Ups", path: "/admin/follow-ups", icon: FaCalendarAlt },
  { name: "Deals Pipeline", path: "/admin/pipeline", icon: FaBriefcase },
  { name: "Call Logs", path: "/admin/call-logs", icon: FaPhoneAlt },
];

const verticalMenu = [
  { name: "Real Estate", icon: FaBuilding },
  { name: "Manpower", icon: FaUsers },
  { name: "Logistics", icon: FaTruck },
  { name: "Vendor Supply", icon: FaBoxes },
  { name: "Construction", icon: FaTools },
  { name: "Borewell", icon: FaTint },
  { name: "Security", icon: FaShieldAlt },
  { name: "Consultancy", icon: FaChartLine },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Safely read the logged-in user's information.
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = getUser();
  const adminName = user.name || user.fullName || "Admin";
  const adminRole = user.role || "Administrator";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;

  const handleVerticalClick = (name) => {
    setSidebarOpen(false);
    navigate(`/admin/adminleads?vertical=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col
          bg-slate-900 text-white transition-transform duration-300
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-700 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
            ID
          </div>

          <div>
            <h1 className="text-sm font-bold tracking-wide">ISHA DISHA</h1>
            <p className="mt-1 text-[10px] tracking-[2px] text-slate-400">
              COMMAND CENTER
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-slate-300 lg:hidden"
            aria-label="Close sidebar"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Navigation menus */}
        <div className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {/* Main menu */}
          <div>
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
              MAIN MENU
            </p>

            <nav className="space-y-1">
              {mainMenu.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/admin/dashboard"}
                  onClick={() => setSidebarOpen(false)}
                  className={linkClass}
                >
                  <Icon size={16} />
                  <span>{name}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Business verticals */}
          <div>
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
              BUSINESS VERTICALS
            </p>

            <nav className="space-y-1">
              {verticalMenu.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleVerticalClick(name)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  <Icon size={15} />
                  <span>{name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Preferences */}
          <div>
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
              PREFERENCES
            </p>

            <NavLink
              to="/admin/settings"
              onClick={() => setSidebarOpen(false)}
              className={linkClass}
            >
              <FaCog size={16} />
              <span>Settings</span>
            </NavLink>
          </div>
        </div>

        {/* Admin profile and logout */}
        <div className="shrink-0 border-t border-slate-700 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{adminName}</p>
              <p className="truncate text-xs text-slate-400">{adminRole}</p>
            </div>

            <FaChevronDown className="text-xs text-slate-400" />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
          >
            <FaSignOutAlt size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-[250px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <FaBars size={19} />
            </button>

            <div>
              <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                Admin Panel
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your workspace
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <FaBell size={18} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden h-8 border-l border-slate-200 sm:block" />

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <FaUserCircle size={24} />
              </div>

              <div className="hidden sm:block">
                <p className="max-w-[150px] truncate text-sm font-semibold text-slate-800">
                  {adminName}
                </p>
                <p className="text-xs text-slate-500">{adminRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Child routes render here */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
