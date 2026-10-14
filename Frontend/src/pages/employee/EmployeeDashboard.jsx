
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiClock,
  FiBriefcase,
  FiPhone,
  FiCalendar,
  FiArrowUpRight,
  FiArrowRight,
  FiRefreshCw,
  FiPlus,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiMail,
  FiUser,
  FiTrendingUp,
  FiActivity,
  FiExternalLink,
} from "react-icons/fi";

// --------------------------------------------------
// API configuration
// --------------------------------------------------

const API_BASE_URL = String(import.meta.env.VITE_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const LEADS_URL = `${API_BASE_URL}/leads`;
const FOLLOWUPS_URL = `${API_BASE_URL}/admin/follow-ups`;

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("adminToken") ||
  "";

const getAuthConfig = () => {
  const token = getToken();

  return {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  };
};

// Handles arrays and common Express/Mongoose response wrappers:
// [], { leads: [] }, { data: [] }, { data: { leads: [] } }, etc.
const extractArray = (response, possibleKeys = []) => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  for (const key of possibleKeys) {
    if (Array.isArray(response[key])) return response[key];
  }

  if (Array.isArray(response.data)) return response.data;

  if (response.data && typeof response.data === "object") {
    for (const key of possibleKeys) {
      if (Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }

    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
  }

  if (response.result && Array.isArray(response.result)) {
    return response.result;
  }

  return [];
};

const getStoredUser = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("user") || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getEmployeeName = (user) =>
  user?.name ||
  user?.fullName ||
  user?.username ||
  user?.email?.split("@")[0] ||
  "Employee";

const getLeadId = (lead) => lead?._id || lead?.id;

const getLeadName = (lead) =>
  lead?.name || lead?.fullName || lead?.company || "Unnamed lead";

const getFollowUpDate = (item) =>
  item?.dueDate || item?.followUp || item?.followUpDate || null;

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return "Not scheduled";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  const date = parseDate(value);
  if (!date) return "Not scheduled";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: amount >= 10000000 ? "compact" : "standard",
  }).format(amount);
};

const normalizeStatus = (status) =>
  String(status || "New").trim().toLowerCase();

const getStatusClass = (status = "") => {
  const normalized = normalizeStatus(status);

  if (["won", "completed"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (["lost", "cancelled"].includes(normalized)) {
    return "bg-red-50 text-red-700";
  }

  if (
    ["negotiation", "proposal sent", "proposal"].includes(normalized)
  ) {
    return "bg-violet-50 text-violet-700";
  }

  if (
    ["qualified", "in progress", "contacted"].includes(normalized)
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-amber-50 text-amber-700";
};

const isClosedFollowUp = (item) =>
  ["completed", "cancelled"].includes(normalizeStatus(item?.status));

const isClosedLead = (lead) =>
  ["won", "lost"].includes(normalizeStatus(lead?.status));

// --------------------------------------------------
// Reusable components
// --------------------------------------------------

function SectionHeading({ title, subtitle, action, onAction }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 sm:text-sm"
        >
          {action}
          <FiArrowRight />
        </button>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  loading,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {value}
            </p>
          )}
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1 text-xs text-slate-500">
        <FiArrowUpRight className="text-emerald-600" />
        {subtitle}
      </p>
    </button>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-9 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
        <Icon size={25} />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>

      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

// --------------------------------------------------
// Employee Dashboard
// --------------------------------------------------

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const requestRef = useRef(null);
  const mountedRef = useRef(false);

  const [user, setUser] = useState(getStoredUser);
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const employeeName = getEmployeeName(user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  // ------------------------------------------------
  // Session expiry
  // ------------------------------------------------

  const handleExpiredSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    toast.error("Your session has expired. Please log in again.");
    navigate("/login", { replace: true });
  }, [navigate]);

  // ------------------------------------------------
  // Load live dashboard data
  // ------------------------------------------------

  const fetchDashboardData = useCallback(
    async ({ showLoading = true, notify = false } = {}) => {
      if (!API_BASE_URL) {
        const message =
          "VITE_BASE_URL is missing. Configure it in your frontend .env file.";

        setApiError(message);
        setLoading(false);
        setRefreshing(false);

        if (notify) toast.error(message);
        return;
      }

      if (!getToken()) {
        setApiError("Your session token is missing. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        navigate("/login", { replace: true });
        return;
      }

      // Reuse an in-progress request instead of starting duplicates.
      if (requestRef.current) return requestRef.current;

      if (showLoading) setLoading(true);
      setApiError("");

      const request = (async () => {
        try {
          const config = getAuthConfig();

          const results = await Promise.allSettled([
            axios.get(LEADS_URL, config),
            axios.get(FOLLOWUPS_URL, config),
          ]);

          if (!mountedRef.current) return;

          const authFailure = results.some(
            (result) =>
              result.status === "rejected" &&
              result.reason?.response?.status === 401
          );

          if (authFailure) {
            handleExpiredSession();
            return;
          }

          const [leadsResult, followUpsResult] = results;
          const failures = results.filter(
            (result) => result.status === "rejected"
          );

          if (leadsResult.status === "fulfilled") {
            const leadData = extractArray(leadsResult.value.data, [
              "leads",
              "results",
              "items",
            ]);

            setLeads(leadData);
          }

          if (followUpsResult.status === "fulfilled") {
            const followUpData = extractArray(followUpsResult.value.data, [
              "followUps",
              "followups",
              "results",
              "items",
            ]);

            setFollowUps(followUpData);
          }

          if (failures.length === 2) {
            const message =
              "Unable to load dashboard data. Check your API routes, server, and permissions.";

            setApiError(message);
            if (notify) toast.error(message);
            return;
          }

          if (failures.length === 1) {
            const failedIndex = results.findIndex(
              (result) => result.status === "rejected"
            );

            const message =
              failedIndex === 0
                ? "Leads could not be loaded. Showing any available follow-up data."
                : "Follow-ups could not be loaded. Showing any available lead data.";

            setApiError(message);
            if (notify) toast.warning(message);
          } else {
            setApiError("");
            setLastUpdated(new Date());

            if (notify) toast.success("Dashboard refreshed successfully.");
          }
        } catch (error) {
          console.error("Employee dashboard error:", error);

          if (error?.response?.status === 401) {
            handleExpiredSession();
            return;
          }

          const message =
            error?.response?.data?.message ||
            "An unexpected error occurred while loading your dashboard.";

          if (mountedRef.current) setApiError(message);
          if (notify) toast.error(message);
        } finally {
          requestRef.current = null;

          if (mountedRef.current) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      })();

      requestRef.current = request;
      return request;
    },
    [handleExpiredSession, navigate]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboardData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchDashboardData]);

  // Refresh profile when another part of the app updates it.
  useEffect(() => {
    const refreshUser = () => setUser(getStoredUser());

    window.addEventListener("storage", refreshUser);
    window.addEventListener("userUpdated", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("userUpdated", refreshUser);
    };
  }, []);

  const handleRefresh = async () => {
    if (requestRef.current) return;

    setRefreshing(true);
    await fetchDashboardData({ showLoading: false, notify: true });
  };

  // ------------------------------------------------
  // Statistics
  // ------------------------------------------------

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeLeads = leads.filter((lead) => !isClosedLead(lead));
    const wonLeads = leads.filter(
      (lead) => normalizeStatus(lead.status) === "won"
    );

    const pipelineValue = activeLeads.reduce((total, lead) => {
      const value = Number(lead.value);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);

    const scheduledFollowUps = followUps.filter(
      (item) => !item.isArchived && !isClosedFollowUp(item)
    );

    const todayFollowUps = scheduledFollowUps.filter((item) => {
      const date = parseDate(getFollowUpDate(item));

      return date && date >= todayStart && date < tomorrow;
    });

    const overdueFollowUps = scheduledFollowUps.filter((item) => {
      const date = parseDate(getFollowUpDate(item));

      // Overdue means due before today began. A follow-up due earlier
      // today is included in today's count, not the overdue count.
      return date && date < todayStart;
    });

    return {
      totalLeads: leads.length,
      activeLeads: activeLeads.length,
      wonLeads: wonLeads.length,
      pipelineValue,
      todayFollowUps: todayFollowUps.length,
      overdueFollowUps: overdueFollowUps.length,
    };
  }, [leads, followUps]);

  // ------------------------------------------------
  // Upcoming follow-ups and recent leads
  // ------------------------------------------------

  const upcomingFollowUps = useMemo(() => {
    const now = new Date();

    return followUps
      .filter((item) => {
        if (item.isArchived || isClosedFollowUp(item)) return false;

        const date = parseDate(getFollowUpDate(item));
        return date && date >= now;
      })
      .sort(
        (a, b) =>
          parseDate(getFollowUpDate(a)).getTime() -
          parseDate(getFollowUpDate(b)).getTime()
      )
      .slice(0, 5);
  }, [followUps]);

  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort((a, b) => {
          const dateA = parseDate(a.updatedAt || a.createdAt)?.getTime() || 0;
          const dateB = parseDate(b.updatedAt || b.createdAt)?.getTime() || 0;
          return dateB - dateA;
        })
        .slice(0, 5),
    [leads]
  );

  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-100 p-5 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full bg-white/40 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-700">
              Employee Workspace
            </p>

            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {greeting}, {employeeName}!
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Here's your work overview. Stay on top of your leads, customer
              conversations, and follow-ups.
            </p>

            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm">
              <FiCalendar className="text-blue-600" />
              {todayLabel}
            </p>

            {lastUpdated && (
              <p className="mt-2 text-xs text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/employee/leads")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <FiPlus />
              My Leads
            </button>
          </div>
        </div>
      </section>

      {/* API error */}
      {apiError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"
        >
          <FiAlertCircle className="shrink-0 text-amber-600" />

          <p className="flex-1 text-sm text-amber-800">{apiError}</p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start text-sm font-semibold text-amber-800 underline disabled:opacity-50 sm:self-auto"
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Summary of the records returned by your APIs.
            </p>
          </div>

          <FiActivity className="text-xl text-slate-400" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="My Leads"
            value={stats.totalLeads}
            subtitle="Total records returned"
            icon={FiUsers}
            iconClass="bg-blue-50 text-blue-600"
            loading={loading}
            onClick={() => navigate("/employee/leads")}
          />

          <StatCard
            title="Follow-Ups Today"
            value={stats.todayFollowUps}
            subtitle={`${stats.overdueFollowUps} overdue`}
            icon={FiClock}
            iconClass="bg-orange-50 text-orange-600"
            loading={loading}
            onClick={() => navigate("/employee/follow-ups")}
          />

          <StatCard
            title="Active Leads"
            value={stats.activeLeads}
            subtitle={`${stats.wonLeads} won leads`}
            icon={FiBriefcase}
            iconClass="bg-emerald-50 text-emerald-600"
            loading={loading}
            onClick={() => navigate("/employee/deals")}
          />

          <StatCard
            title="Pipeline Value"
            value={formatCurrency(stats.pipelineValue)}
            subtitle="Active lead values"
            icon={FiTrendingUp}
            iconClass="bg-violet-50 text-violet-600"
            loading={loading}
            onClick={() => navigate("/employee/deals")}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          title="Quick Actions"
          subtitle="Get to your daily work faster."
        />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[
            {
              title: "My Leads",
              subtitle: "View assigned leads",
              icon: FiUsers,
              color: "bg-blue-50 text-blue-600",
              path: "/employee/leads",
            },
            {
              title: "Follow-Ups",
              subtitle: "Manage reminders",
              icon: FiClock,
              color: "bg-orange-50 text-orange-600",
              path: "/employee/follow-ups",
            },
            {
              title: "Log a Call",
              subtitle: "View call records",
              icon: FiPhone,
              color: "bg-emerald-50 text-emerald-600",
              path: "/employee/call-logs",
            },
            {
              title: "Calendar",
              subtitle: "Check your schedule",
              icon: FiCalendar,
              color: "bg-violet-50 text-violet-600",
              path: "/employee/calendar",
            },
            {
              title: "Communication",
              subtitle: "Customer activities",
              icon: FiMessageSquare,
              color: "bg-pink-50 text-pink-600",
              path: "/employee/communication",
            },
          ].map((action) => {
            const Icon = action.icon;

            return (
              <button
                type="button"
                key={action.title}
                onClick={() => navigate(action.path)}
                className="group rounded-xl border border-slate-100 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${action.color}`}>
                  <Icon size={21} />
                </div>

                <p className="text-sm font-bold text-slate-800">
                  {action.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {action.subtitle}
                </p>

                <FiArrowUpRight className="mt-3 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent leads and upcoming follow-ups */}
      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        {/* Recent leads */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <SectionHeading
              title="Recent Leads"
              subtitle="The latest lead records returned by your API."
              action="View all"
              onAction={() => navigate("/employee/leads")}
            />
          </div>

          {loading ? (
            <div className="space-y-4 px-5 pb-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title="No leads available"
              description="Your recent leads will appear here when the leads API returns records."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left">
                <thead className="border-y border-slate-100 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                      Lead
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                      Value
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead, index) => (
                    <tr
                      key={getLeadId(lead) || index}
                      onClick={() => {
                        const id = getLeadId(lead);
                        navigate(id ? `/employee/leads/${id}` : "/employee/leads");
                      }}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                            {getLeadName(lead)
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
                              {getLeadName(lead)}
                            </p>

                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {lead.company ||
                                lead.email ||
                                lead.phone ||
                                "Lead"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                            lead.status
                          )}`}
                        >
                          {lead.status || "New"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                        {formatCurrency(lead.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming follow-ups */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <SectionHeading
              title="Upcoming Follow-Ups"
              subtitle="Your next scheduled customer activities."
              action="View all"
              onAction={() => navigate("/employee/follow-ups")}
            />
          </div>

          {loading ? (
            <div className="space-y-4 px-5 pb-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : upcomingFollowUps.length === 0 ? (
            <EmptyState
              icon={FiCalendar}
              title="No upcoming follow-ups"
              description="Scheduled follow-ups will appear here when returned by your backend."
            />
          ) : (
            <div className="space-y-1 px-4 pb-4 sm:px-5">
              {upcomingFollowUps.map((item, index) => {
                const lead =
                  item.lead && typeof item.lead === "object"
                    ? item.lead
                    : null;

                const title =
                  item.title ||
                  lead?.name ||
                  lead?.company ||
                  "Customer follow-up";

                const dueDate = getFollowUpDate(item);

                return (
                  <button
                    type="button"
                    key={item._id || item.id || index}
                    onClick={() => {
                      const id = item._id || item.id;
                      navigate(
                        id ? `/employee/follow-ups/${id}` : "/employee/follow-ups"
                      );
                    }}
                    className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="mt-0.5 rounded-xl bg-orange-50 p-3 text-orange-600">
                      <FiClock size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {title}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <FiCalendar className="shrink-0" />
                        {formatDateTime(dueDate)}
                      </p>

                      {(lead?.company || lead?.location) && (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                          <FiMapPin className="shrink-0" />
                          {lead.company || lead.location}
                        </p>
                      )}
                    </div>

                    <span
                      className={`mt-1 shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status || "Pending"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Employee profile */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <SectionHeading
            title="Your Work Profile"
            subtitle="Your currently stored employee information."
            action="My profile"
            onAction={() => navigate("/employee/profile")}
          />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FiUser size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Employee name</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {employeeName}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <FiBriefcase size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Role</p>
                <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-800">
                  {user.role || "Employee"}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <FiMail size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Email address</p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                  {user.email || "No email available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
          <div className="inline-flex rounded-xl bg-white p-3 text-blue-600 shadow-sm">
            <FiCheckCircle size={22} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Keep moving forward
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Follow up with customers on time, keep lead information updated,
            and maintain a clear record of every interaction.
          </p>

          <button
            type="button"
            onClick={() => navigate("/employee/follow-ups")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Follow-Ups
            <FiArrowRight />
          </button>
        </div>
      </section>

      <p className="px-1 text-xs leading-5 text-slate-400">
        Dashboard figures are based on the records returned by your configured
        APIs. Your backend must enforce employee-level access to these records.
      </p>
    </div>
  );
}
