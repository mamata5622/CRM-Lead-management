import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  FaCheck,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaUserShield,
  FaRegBell,
  FaKey,
  FaEnvelope,
} from "react-icons/fa";

// ======================================================
// NAVIGATION CONFIGURATION
// ======================================================

const navigationGroups = [
  {
    name: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: FaHome,
        exact: true,
      },
    ],
  },

  {
    name: "CRM Management",
    items: [
      {
        name: "CRM & Leads",
        path: "/admin/adminleads",
        icon: FaUsers,
      },
      {
        name: "Follow-Ups",
        path: "/admin/follow-ups",
        icon: FaCalendarAlt,
      },
      {
        name: "Communication Timeline",
        path: "/admin/communications",
        icon: FaEnvelope,
      },
      {
        name: "Call Logs",
        path: "/admin/call-logs",
        icon: FaPhoneAlt,
      },
    ],
  },

  {
    name: "Sales & Deals",
    items: [
      {
        name: "Deals Pipeline",
        path: "/admin/pipeline",
        icon: FaBriefcase,
      },
    ],
  },

  {
    name: "Business Verticals",
    items: [
      {
        name: "Real Estate",
        icon: FaBuilding,
        vertical: true,
      },
      {
        name: "Manpower",
        icon: FaUsers,
        vertical: true,
      },
      {
        name: "Logistics",
        icon: FaTruck,
        vertical: true,
      },
      {
        name: "Vendor Supply",
        icon: FaBoxes,
        vertical: true,
      },
      {
        name: "Construction",
        icon: FaTools,
        vertical: true,
      },
      {
        name: "Borewell",
        icon: FaTint,
        vertical: true,
      },
      {
        name: "Security",
        icon: FaShieldAlt,
        vertical: true,
      },
      {
        name: "Consultancy",
        icon: FaChartLine,
        vertical: true,
      },
    ],
  },

  {
    name: "User & Access Management",
    adminOnly: true,
    items: [
      {
        name: "Role Management",
        path: "/admin/role-management",
        icon: FaUserShield,
      },
    ],
  },
];

const pageTitles = [
  { path: "/admin/dashboard", title: "Dashboard" },
  { path: "/admin/adminleads", title: "CRM & Leads" },
  { path: "/admin/follow-ups", title: "Follow-Ups" },
  {
    path: "/admin/communications",
    title: "Communication Timeline",
  },
  { path: "/admin/role-management", title: "Role Management" },

  { path: "/admin/pipeline", title: "Deals Pipeline" },
  { path: "/admin/call-logs", title: "Call Logs" },
  { path: "/admin/settings", title: "Settings" },
];

// ======================================================
// HELPER FUNCTIONS
// ======================================================

const getStoredUser = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");

    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
};

const getInitials = (name = "Admin") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "A";

const normalizePath = (path = "") => path.replace(/\/+$/, "") || "/";

const getExpandedGroupsForPath = (pathname) => {
  const currentPath = normalizePath(pathname);

  const expanded = {};

  navigationGroups.forEach((group) => {
    expanded[group.name] = group.items.some((item) => {
      if (!item.path) return false;

      const itemPath = normalizePath(item.path);

      return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    });
  });

  // Keep the business vertical list collapsed initially.
  if (!expanded["Business Verticals"]) {
    expanded["Business Verticals"] = false;
  }

  return expanded;
};

// ======================================================
// ADMIN LAYOUT
// ======================================================

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [user, setUser] = useState(getStoredUser);

  const [expandedGroups, setExpandedGroups] = useState(() =>
    getExpandedGroupsForPath(location.pathname),
  );

  // Demo notifications. Replace with API-backed notifications when ready.
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Follow-up reminder",
      message: "Check your upcoming follow-ups.",
      time: "Recently",
      read: false,
      type: "follow-up",
    },
    {
      id: 2,
      title: "Welcome to your workspace",
      message: "Your admin dashboard is ready.",
      time: "Today",
      read: false,
      type: "general",
    },
  ]);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  // ------------------------------------------------------
  // USER PROFILE
  // ------------------------------------------------------

  const adminName = user.name || user.fullName || user.username || "Admin";

  const adminRole = user.role || "Administrator";
  const adminEmail = user.email || "";
  const profileImage = user.profileImage || user.avatar || "";

  const isAdmin = String(user.role || "").toLowerCase() === "admin";

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  // ------------------------------------------------------
  // PAGE TITLE
  // ------------------------------------------------------

  const pageTitle = useMemo(() => {
    const pathname = normalizePath(location.pathname);

    // Handle detail pages before matching parent routes.
    if (pathname.startsWith("/admin/follow-ups/")) {
      return "Follow-up Details";
    }

    if (pathname.startsWith("/admin/adminleads/")) {
      return "Lead Details";
    }

    if (pathname.startsWith("/admin/communications/")) {
      return "Communication Details";
    }

    const match = pageTitles.find(
      (item) => normalizePath(item.path) === pathname,
    );

    if (match) return match.title;

    if (pathname === "/admin") return "Admin Panel";

    return "Admin Workspace";
  }, [location.pathname]);

  // ------------------------------------------------------
  // REFRESH USER AND NAVIGATION
  // ------------------------------------------------------

  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  // Automatically expand the group containing the current route.
  useEffect(() => {
    const currentPath = normalizePath(location.pathname);

    const activeGroup = navigationGroups.find((group) =>
      group.items.some((item) => {
        if (!item.path) return false;

        const itemPath = normalizePath(item.path);

        return (
          currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
        );
      }),
    );

    if (activeGroup) {
      setExpandedGroups((previous) => ({
        ...previous,
        [activeGroup.name]: true,
      }));
    }
  }, [location.pathname]);

  // ------------------------------------------------------
  // CLOSE DROPDOWNS ON OUTSIDE CLICK / ESCAPE
  // ------------------------------------------------------

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ------------------------------------------------------
  // SIDEBAR ACTIONS
  // ------------------------------------------------------

  const toggleGroup = useCallback((groupName) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [groupName]: !previous[groupName],
    }));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setSidebarOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);

    navigate("/login", { replace: true });
  }, [navigate]);

  const handleVerticalClick = useCallback(
    (name) => {
      navigate(`/admin/adminleads?vertical=${encodeURIComponent(name)}`);

      setSidebarOpen(false);
    },
    [navigate],
  );

  const handleSearch = useCallback(
    (event) => {
      event.preventDefault();

      const query = searchValue.trim();

      if (!query) return;

      navigate(`/admin/adminleads?search=${encodeURIComponent(query)}`);

      setSearchValue("");
      setSearchOpen(false);
      setSidebarOpen(false);
    },
    [navigate, searchValue],
  );

  // ------------------------------------------------------
  // NOTIFICATIONS
  // ------------------------------------------------------

  const markAllRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read: true,
      })),
    );
  };

  const markNotificationRead = (id) => {
    setNotifications((previous) =>
      previous.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  // ------------------------------------------------------
  // STYLES
  // ------------------------------------------------------

  const linkClass = ({ isActive }) =>
    [
      "group flex w-full min-w-0 items-center rounded-xl text-sm",
      "transition-all duration-200",
      sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
        : "text-slate-300 hover:bg-slate-800 hover:text-white",
    ].join(" ");

  const iconClass = "shrink-0 text-base";

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-slate-800 bg-slate-950 text-white",
          "transition-[width,transform] duration-300 ease-in-out",
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
            <div className="min-w-0 flex-1">
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

        {/* Grouped navigation */}
        <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-5">
          <nav aria-label="Admin navigation" className="space-y-5">
            {navigationGroups
              .filter((group) => !group.adminOnly || isAdmin)
              .map((group) => {
                const expanded = Boolean(expandedGroups[group.name]);

                return (
                  <section key={group.name}>
                    {/* Category heading */}
                    {!sidebarCollapsed && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.name)}
                        aria-expanded={expanded}
                        className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
                      >
                        <span className="truncate">{group.name}</span>

                        <FaChevronDown
                          className={[
                            "shrink-0 transition-transform duration-200",
                            expanded ? "rotate-0" : "-rotate-90",
                          ].join(" ")}
                        />
                      </button>
                    )}

                    {/* Category links */}
                    {(expanded || sidebarCollapsed) && (
                      <div className="space-y-1">
                        {group.items.map(
                          ({ name, path, icon: Icon, exact, vertical }) => {
                            if (vertical) {
                              const activeVertical =
                                new URLSearchParams(location.search).get(
                                  "vertical",
                                ) === name;

                              return (
                                <button
                                  key={name}
                                  type="button"
                                  title={sidebarCollapsed ? name : undefined}
                                  onClick={() => handleVerticalClick(name)}
                                  className={[
                                    "flex w-full min-w-0 items-center rounded-xl text-left text-sm",
                                    "transition-colors duration-200",
                                    sidebarCollapsed
                                      ? "justify-center px-2 py-3"
                                      : "gap-3 px-3 py-2.5",
                                    activeVertical
                                      ? "bg-blue-600 text-white"
                                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                  ].join(" ")}
                                >
                                  <Icon className={iconClass} />

                                  {!sidebarCollapsed && (
                                    <span className="truncate">{name}</span>
                                  )}
                                </button>
                              );
                            }

                            return (
                              <NavLink
                                key={path}
                                to={path}
                                end={Boolean(exact)}
                                title={sidebarCollapsed ? name : undefined}
                                onClick={() => setSidebarOpen(false)}
                                className={linkClass}
                              >
                                <Icon className={iconClass} />

                                {!sidebarCollapsed && (
                                  <span className="truncate">{name}</span>
                                )}
                              </NavLink>
                            );
                          },
                        )}
                      </div>
                    )}
                  </section>
                );
              })}

            {/* Preferences */}
            <section>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">
                  Preferences
                </p>
              )}

              <NavLink
                to="/admin/settings"
                title={sidebarCollapsed ? "Settings" : undefined}
                onClick={() => setSidebarOpen(false)}
                className={linkClass}
              >
                <FaCog className={iconClass} />

                {!sidebarCollapsed && (
                  <span className="truncate">Settings</span>
                )}
              </NavLink>
            </section>
          </nav>
        </div>

        {/* User profile and logout */}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <div
            className={[
              "mb-3 flex min-w-0 items-center rounded-xl bg-slate-900",
              sidebarCollapsed ? "justify-center p-2" : "gap-3 p-3",
            ].join(" ")}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${adminName}'s profile`}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {getInitials(adminName)}
              </div>
            )}

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
              "transition-colors hover:bg-red-500/10 hover:text-red-200",
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

      {/* ==================================================
          MAIN WORKSPACE
      ================================================== */}

      <div
        className={[
          "min-h-screen min-w-0 transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-[82px]" : "lg:pl-[270px]",
        ].join(" ")}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[76px] min-w-0 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur sm:gap-3 sm:px-5 lg:px-7">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {/* Mobile sidebar */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <FaBars size={18} />
            </button>

            {/* Desktop collapse */}
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

              <p className="hidden truncate text-xs text-slate-500 sm:block">
                ISHA DISHA · Manage your workspace
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((previous) => !previous);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
                aria-label="Open search"
                aria-expanded={searchOpen}
                className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
              >
                <FaSearch size={17} />
              </button>

              {searchOpen && (
                <form
                  onSubmit={handleSearch}
                  className="absolute right-0 top-full z-50 mt-3 flex w-[min(88vw,340px)] items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                >
                  <FaSearch className="ml-1 shrink-0 text-slate-400" />

                  <input
                    autoFocus
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search leads..."
                    aria-label="Search leads"
                    className="min-w-0 flex-1 rounded-lg px-2 py-2 text-sm outline-none"
                  />

                  <button
                    type="submit"
                    aria-label="Submit search"
                    className="rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700"
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
              )}
            </div>

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((previous) => !previous);
                  setProfileOpen(false);
                  setSearchOpen(false);
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
                      disabled={unreadCount === 0}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FaCheck size={11} />
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[min(60vh,320px)] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <FaRegBell className="mx-auto mb-3 text-2xl text-slate-300" />

                        <p className="text-sm font-medium text-slate-600">
                          You're all caught up
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => markNotificationRead(item.id)}
                          className="flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            {item.type === "follow-up" ? (
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
              )}
            </div>

            <div className="mx-1 hidden h-8 border-l border-slate-200 sm:block" />

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((previous) => !previous);
                  setNotificationsOpen(false);
                  setSearchOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3 sm:px-2"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <FaUserCircle size={25} />
                  </div>
                )}

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
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(88vw,280px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {adminName}
                    </p>

                    {adminEmail && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {adminEmail}
                      </p>
                    )}

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
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 p-3 sm:p-5 lg:p-7 xl:p-8">
          <div className="mx-auto w-full max-w-[1800px] min-w-0">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-7 sm:text-left">
          © {new Date().getFullYear()} ISHA DISHA. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
