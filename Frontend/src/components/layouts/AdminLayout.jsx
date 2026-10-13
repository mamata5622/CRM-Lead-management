import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";

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
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaUser,
  FaEnvelope,
  FaCheck,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaUserShield,
} from "react-icons/fa";

const mainMenu = [
  { name: "Dashboard", path: "/admin/dashboard", icon: FaHome },
  { name: "CRM & Leads", path: "/admin/adminleads", icon: FaUsers },
  { name: "Follow-Ups", path: "/admin/follow-ups", icon: FaCalendarAlt },
  { name: "Role Management", path: "/admin/role-management", icon: FaUserShield },
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

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [user, setUser] = useState(getStoredUser);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Follow-up reminder",
      message: "Check your upcoming follow-ups.",
      time: "Recently",
      read: false,
    },
    {
      id: 2,
      title: "Welcome to your workspace",
      message: "Your admin dashboard is ready.",
      time: "Today",
      read: false,
    },
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const adminName = user.name || user.fullName || user.username || "Admin";
  const adminRole = user.role || "Administrator";
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setSidebarOpen(false);
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  const handleVerticalClick = (name) => {
    navigate(`/admin/adminleads?vertical=${encodeURIComponent(name)}`);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchValue.trim();
    if (!query) return;

    navigate(`/admin/adminleads?search=${encodeURIComponent(query)}`);
    setSearchValue("");
    setSearchOpen(false);
  };

  const markAllRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true })),
    );
  };

  const linkClass = ({ isActive }) =>
    [
      "group flex w-full items-center rounded-xl text-sm",
      "transition-all duration-200",
      sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
        : "text-slate-300 hover:bg-slate-800 hover:text-white",
    ].join(" ");

  const iconClass = "shrink-0 text-base";

  const pageTitles = {
    "/admin": "Admin Panel",
    "/admin/dashboard": "Dashboard",
    "/admin/adminleads": "CRM & Leads",
    "/admin/follow-ups": "Follow-Ups",
    "/admin/pipeline": "Deals Pipeline",
    "/admin/call-logs": "Call Logs",
    "/admin/settings": "Settings",
  };

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/admin/follow-ups/")
      ? "Follow-up Details"
      : "Admin Workspace");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-slate-800 bg-slate-950 text-white",
          "transition-all duration-300 ease-in-out",
          "w-[270px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[82px]" : "lg:w-[270px]",
        ].join(" ")}
      >
        {/* Brand */}
        <div
          className={[
            "flex h-[76px] shrink-0 items-center border-b border-slate-800",
            sidebarCollapsed ? "justify-center px-3" : "gap-3 px-5",
          ].join(" ")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-extrabold shadow-lg shadow-blue-950/30">
            ID
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-wide">
                ISHA DISHA
              </h1>
              <p className="mt-1 text-[10px] tracking-[2px] text-slate-400">
                COMMAND CENTER
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <FaTimes size={17} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-7 overflow-x-hidden overflow-y-auto px-3 py-6">
          <section>
            {!sidebarCollapsed && (
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
                MAIN MENU
              </p>
            )}

            <nav aria-label="Main navigation" className="space-y-1">
              {mainMenu.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/admin/dashboard"}
                  title={sidebarCollapsed ? name : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={linkClass}
                >
                  <Icon className={iconClass} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{name}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </section>

          <section>
            {!sidebarCollapsed && (
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
                BUSINESS VERTICALS
              </p>
            )}

            <nav aria-label="Business verticals" className="space-y-1">
              {verticalMenu.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  title={sidebarCollapsed ? name : undefined}
                  onClick={() => {
                    handleVerticalClick(name);
                    setSidebarOpen(false);
                  }}
                  className={[
                    "flex w-full items-center rounded-xl text-left text-[13px]",
                    "text-slate-300 transition hover:bg-slate-800 hover:text-white",
                    sidebarCollapsed
                      ? "justify-center px-2 py-3"
                      : "gap-3 px-3 py-2.5",
                  ].join(" ")}
                >
                  <Icon className={iconClass} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{name}</span>
                  )}
                </button>
              ))}
            </nav>
          </section>

          <section>
            {!sidebarCollapsed && (
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
                PREFERENCES
              </p>
            )}

            <NavLink
              to="/admin/settings"
              title={sidebarCollapsed ? "Settings" : undefined}
              onClick={() => setSidebarOpen(false)}
              className={linkClass}
            >
              <FaCog className={iconClass} />
              {!sidebarCollapsed && <span>Settings</span>}
            </NavLink>
          </section>
        </div>

        {/* User profile and logout */}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <div
            className={[
              "mb-3 flex items-center rounded-xl bg-slate-900",
              sidebarCollapsed ? "justify-center p-2" : "gap-3 p-3",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {adminName.charAt(0).toUpperCase()}
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{adminName}</p>
                <p className="truncate text-xs capitalize text-slate-400">
                  {adminRole}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            title={sidebarCollapsed ? "Logout" : undefined}
            onClick={handleLogout}
            className={[
              "flex w-full items-center rounded-xl text-sm text-red-300",
              "transition hover:bg-red-500/10 hover:text-red-200",
              sidebarCollapsed
                ? "justify-center px-2 py-3"
                : "gap-3 px-3 py-2.5",
            ].join(" ")}
          >
            <FaSignOutAlt className={iconClass} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <div
        className={[
          "min-h-screen min-w-0 transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-[82px]" : "lg:pl-[270px]",
        ].join(" ")}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Mobile sidebar toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <FaBars size={18} />
            </button>

            {/* Desktop sidebar collapse */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((previous) => !previous)}
              className="hidden shrink-0 rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <FaChevronRight size={15} />
              ) : (
                <FaChevronLeft size={15} />
              )}
            </button>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {pageTitle}
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your workspace
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <form
                  onSubmit={handleSearch}
                  className="absolute right-0 top-1/2 z-40 flex w-[min(80vw,320px)] -translate-y-1/2 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:static sm:w-auto sm:translate-y-0 sm:border-0 sm:p-0 sm:shadow-none"
                >
                  <FaSearch className="ml-1 shrink-0 text-slate-400" />
                  <input
                    autoFocus
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search leads..."
                    aria-label="Search leads"
                    className="min-w-0 flex-1 rounded-lg px-2 py-2 text-sm outline-none sm:w-36 lg:w-48"
                  />
                  <button
                    type="submit"
                    aria-label="Submit search"
                    className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                  >
                    <FaSearch size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchValue("");
                    }}
                    aria-label="Close search"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <FaTimes size={14} />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                  className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                >
                  <FaSearch size={17} />
                </button>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((previous) => !previous);
                  setProfileOpen(false);
                }}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={notificationsOpen}
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
              >
                <FaBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setNotificationsOpen(false)}
                  />

                  <div className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Notifications
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {unreadCount} unread
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <FaCheck size={11} />
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                          <FaBell className="mx-auto mb-3 text-2xl text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">
                            You're all caught up
                          </p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setNotifications((previous) =>
                                previous.map((notification) =>
                                  notification.id === item.id
                                    ? { ...notification, read: true }
                                    : notification,
                                ),
                              )
                            }
                            className="flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              {item.title.toLowerCase().includes("follow") ? (
                                <FaCalendarAlt />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.title}
                                </p>
                                {!item.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.message}
                              </p>
                              <p className="mt-2 text-[10px] text-slate-400">
                                {item.time}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-100 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate("/admin/follow-ups");
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        View follow-ups
                        <FaExternalLinkAlt size={10} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden h-8 border-l border-slate-200 sm:block" />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((previous) => !previous);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3 sm:px-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <FaUserCircle size={25} />
                </div>

                <div className="hidden max-w-[150px] text-left sm:block">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {adminName}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-500">
                    {adminRole}
                  </p>
                </div>

                <FaChevronDown className="hidden text-xs text-slate-400 sm:block" />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {adminName}
                      </p>
                      <p className="mt-1 truncate text-xs capitalize text-slate-500">
                        {adminRole}
                      </p>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/admin/settings");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                      >
                        <FaCog className="text-slate-400" />
                        Settings
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Responsive page content */}
        <main className="min-w-0 p-3 sm:p-5 lg:p-7 xl:p-8">
          <div className="mx-auto w-full max-w-[1800px] min-w-0">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:text-left sm:px-7">
          © {new Date().getFullYear()} ISHA DISHA. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
