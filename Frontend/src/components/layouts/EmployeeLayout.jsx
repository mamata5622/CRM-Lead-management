import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  FiGrid,
  FiUsers,
  FiClock,
  FiBriefcase,
  FiPhone,
  FiCalendar,
  FiMessageSquare,
  FiBarChart2,
  FiHome,
  FiTruck,
  FiShield,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiTool,
  FiPackage,
  FiHeadphones,
  FiChevronRight,
  FiCommand,
  FiCheck,
  FiHelpCircle,
  FiExternalLink,
} from "react-icons/fi";

// Navigation configuration

const MAIN_NAVIGATION = [
  {
    label: "Dashboard",
    path: "/employee/dashboard",
    icon: FiGrid,
    end: true,
  },
  {
    label: "My Leads",
    path: "/employee/leads",
    icon: FiUsers,
  },
  {
    label: "Follow-Ups",
    path: "/employee/follow-ups",
    icon: FiClock,
  },
  {
    label: "My Deals",
    path: "/employee/deals",
    icon: FiBriefcase,
  },
  {
    label: "Call Logs",
    path: "/employee/call-logs",
    icon: FiPhone,
  },
  {
    label: "Calendar",
    path: "/employee/calendar",
    icon: FiCalendar,
  },
  {
    label: "Communication",
    path: "/employee/communication",
    icon: FiMessageSquare,
  },
  {
    label: "Reports",
    path: "/employee/reports",
    icon: FiBarChart2,
  },
];

const VERTICAL_NAVIGATION = [
  {
    label: "Real Estate",
    path: "/employee/verticals/real-estate",
    icon: FiHome,
  },
  {
    label: "Manpower",
    path: "/employee/verticals/manpower",
    icon: FiUsers,
  },
  {
    label: "Logistics",
    path: "/employee/verticals/logistics",
    icon: FiTruck,
  },
  {
    label: "Vendor Supply",
    path: "/employee/verticals/vendor-supply",
    icon: FiPackage,
  },
  {
    label: "Construction",
    path: "/employee/verticals/construction",
    icon: FiTool,
  },
  {
    label: "Borewell",
    path: "/employee/verticals/borewell",
    icon: FiTool,
  },
  {
    label: "Security",
    path: "/employee/verticals/security",
    icon: FiShield,
  },
  {
    label: "Consultancy",
    path: "/employee/verticals/consultancy",
    icon: FiHeadphones,
  },
];

const ACCOUNT_NAVIGATION = [
  {
    label: "My Profile",
    path: "/employee/profile",
    icon: FiUser,
  },
  {
    label: "Settings",
    path: "/employee/settings",
    icon: FiSettings,
  },
  {
    label: "Help & Support",
    path: "/employee/help-support",
    icon: FiHelpCircle,
  },
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getInitials = (name = "Employee") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "E";

const getEmployeeName = (user) =>
  user?.name ||
  user?.fullName ||
  user?.username ||
  user?.email?.split("@")[0] ||
  "Employee";

// --------------------------------------------------
// Reusable avatar
// --------------------------------------------------

function EmployeeAvatar({ user, size = "h-10 w-10" }) {
  const [imageFailed, setImageFailed] = useState(false);

  const name = getEmployeeName(user);
  const image = user?.profileImage || user?.avatar;

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setImageFailed(true)}
        className={`${size} shrink-0 rounded-full border border-slate-200 bg-white object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700`}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

// --------------------------------------------------
// Navigation link
// --------------------------------------------------

function NavigationLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end || false}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5",
          "text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
            : "text-slate-300 hover:bg-white/10 hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={
              isActive
                ? "shrink-0 text-white"
                : "shrink-0 text-slate-400 group-hover:text-white"
            }
          />

          <span className="min-w-0 flex-1 truncate">{item.label}</span>

          {item.badge > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-500/20 text-blue-200"
              }`}
            >
              {item.badge}
            </span>
          )}

          {item.label === "Help & Support" && (
            <FiChevronRight size={14} className="shrink-0 opacity-50" />
          )}
        </>
      )}
    </NavLink>
  );
}

// --------------------------------------------------
// Employee layout
// --------------------------------------------------

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(readStoredUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const employeeName = getEmployeeName(user);
  const employeeRole = user?.role || "Employee";
  const employeeEmail = user?.email || "";

  const filteredMainNavigation = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return MAIN_NAVIGATION;

    return MAIN_NAVIGATION.filter((item) =>
      item.label.toLowerCase().includes(query),
    );
  }, [search]);

  const filteredVerticalNavigation = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return VERTICAL_NAVIGATION;

    return VERTICAL_NAVIGATION.filter((item) =>
      item.label.toLowerCase().includes(query),
    );
  }, [search]);

  // Close overlays when the current page changes.
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotificationOpen(false);
    setSearchOpen(false);
    setSearch("");
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = readStoredUser();
    const role = String(storedUser?.role || "").toLowerCase();

    if (!token) {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
      return;
    }

    if (role !== "employee") {
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "user") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
      return;
    }

    setUser(storedUser);
  }, [navigate]);

  // Close dropdowns when clicking outside them.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Refresh the cached user when another part of the app updates it.
  useEffect(() => {
    const refreshUser = () => setUser(readStoredUser());

    window.addEventListener("storage", refreshUser);
    window.addEventListener("userUpdated", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("userUpdated", refreshUser);
    };
  }, []);

  // Prevent background scrolling while the mobile drawer is open.
  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setProfileOpen(false);
        setNotificationOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen]);

  // Load notifications from the current user's cached data if available.
  // Replace this with your notifications API when that endpoint is ready.
  useEffect(() => {
    const stored = user?.notifications;

    setNotifications(Array.isArray(stored) ? stored : []);
  }, [user]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    // Clear only authentication-related keys used by this app.
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberedEmail");

    setUser({});
    setProfileOpen(false);
    setSidebarOpen(false);

    navigate("/login", { replace: true });
  };

  const goToSearchResult = (item) => {
    navigate(`${item.path}?search=${encodeURIComponent(search.trim())}`);

    setSearch("");
    setSearchOpen(false);
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));

    setNotifications(updated);
  };

  const goToProfile = () => {
    setProfileOpen(false);
    navigate("/employee/profile");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col",
          "bg-gradient-to-b from-[#102e50] to-[#071b33] text-white",
          "shadow-2xl transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Employee navigation"
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            onClick={() => navigate("/employee/dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-950/30">
              <FiCommand size={26} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-wide">
                ISHA DISHA
              </h1>

              <p className="text-[10px] font-medium tracking-[2px] text-blue-200">
                COMMAND CENTER
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
            Workspace
          </p>

          {filteredMainNavigation.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
              onNavigate={closeSidebar}
            />
          ))}

          {filteredMainNavigation.length === 0 &&
            filteredVerticalNavigation.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400">
                No matching navigation items.
              </p>
            )}

          <div className="my-5 border-t border-white/10" />

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
            Business Verticals
          </p>

          {filteredVerticalNavigation.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
              onNavigate={closeSidebar}
            />
          ))}

          <div className="my-5 border-t border-white/10" />

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
            Account
          </p>

          {ACCOUNT_NAVIGATION.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
              onNavigate={closeSidebar}
            />
          ))}
        </nav>

        {/* Employee card */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={goToProfile}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
          >
            <EmployeeAvatar user={user} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{employeeName}</p>

              <p className="truncate text-xs capitalize text-slate-400">
                {employeeRole}
              </p>
            </div>

            <FiChevronRight className="shrink-0 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <FiLogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main application */}
      <div className="min-h-screen min-w-0 lg:ml-[272px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* Search and mobile menu */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="shrink-0 rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <FiMenu size={21} />
            </button>

            <div className="relative hidden w-full max-w-md sm:block">
              <FiSearch
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search navigation..."
                aria-label="Search navigation"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              {search.trim() && (
                <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  {[
                    ...filteredMainNavigation,
                    ...filteredVerticalNavigation,
                    ...ACCOUNT_NAVIGATION.filter((item) =>
                      item.label
                        .toLowerCase()
                        .includes(search.trim().toLowerCase()),
                    ),
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => goToSearchResult(item)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                      >
                        <Icon className="text-slate-500" />
                        <span>{item.label}</span>
                        <FiChevronRight className="ml-auto text-slate-400" />
                      </button>
                    );
                  })}

                  {[
                    ...filteredMainNavigation,
                    ...filteredVerticalNavigation,
                    ...ACCOUNT_NAVIGATION.filter((item) =>
                      item.label
                        .toLowerCase()
                        .includes(search.trim().toLowerCase()),
                    ),
                  ].length === 0 && (
                    <p className="p-3 text-sm text-slate-500">
                      No matching pages found.
                    </p>
                  )}
                </div>
              )}
            </div>

            <span className="truncate text-sm font-bold text-slate-800 sm:hidden">
              ISHA DISHA
            </span>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(!searchOpen);

                if (!searchOpen) {
                  setTimeout(() => searchRef.current?.focus(), 0);
                }
              }}
              aria-label="Toggle search"
              className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 sm:hidden"
            >
              <FiSearch size={20} />
            </button>

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setProfileOpen(false);
                }}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={notificationOpen}
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
              >
                <FiBell size={19} />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-full mt-3 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Notifications
                      </h3>

                      <p className="text-xs text-slate-500">
                        {unreadCount} unread
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        <FiCheck />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <button
                          key={notification._id || notification.id || index}
                          type="button"
                          onClick={() => {
                            if (notification.path) {
                              navigate(notification.path);
                              setNotificationOpen(false);
                            }
                          }}
                          className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-slate-800">
                              {notification.title || "Notification"}
                            </span>

                            <span className="mt-1 block text-xs text-slate-500">
                              {notification.message || ""}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-9 text-center">
                      <FiBell className="mx-auto text-2xl text-slate-300" />

                      <p className="mt-3 text-sm font-medium text-slate-700">
                        You're all caught up
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        New notifications will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div
              ref={profileRef}
              className="relative border-l border-slate-200 pl-3 sm:pl-4"
            >
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-label="Open employee profile menu"
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 sm:gap-3"
              >
                <EmployeeAvatar user={user} size="h-9 w-9" />

                <div className="hidden max-w-36 text-left sm:block">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {employeeName}
                  </p>

                  <p className="truncate text-xs capitalize text-slate-500">
                    {employeeRole}
                  </p>
                </div>

                <FiChevronDown
                  className={`hidden text-slate-400 transition sm:block ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar user={user} size="h-11 w-11" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {employeeName}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {employeeEmail || employeeRole}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={goToProfile}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FiUser size={17} />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/employee/settings");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FiSettings size={17} />
                      Account Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/employee/help-support");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FiExternalLink size={17} />
                      Help & Support
                    </button>

                    <div className="my-2 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut size={17} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Expandable mobile search */}
        {searchOpen && (
          <div className="border-b border-slate-200 bg-white p-4 sm:hidden">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                autoFocus
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search navigation..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {search.trim() && (
              <div className="mt-2 space-y-1">
                {[
                  ...filteredMainNavigation,
                  ...filteredVerticalNavigation,
                  ...ACCOUNT_NAVIGATION.filter((item) =>
                    item.label
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()),
                  ),
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => goToSearchResult(item)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <Icon />
                      {item.label}
                      <FiChevronRight className="ml-auto" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Page content */}
        <main className="min-h-[calc(100vh-140px)] min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} ISHA DISHA. All rights reserved.</p>

            <p className="flex items-center gap-1">
              Employee Workspace
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600">Secure session</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
