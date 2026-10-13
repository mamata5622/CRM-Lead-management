
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiArrowUpRight,
  FiArrowRight,
  FiRefreshCw,
  FiSearch,
  FiClock,
  FiAlertCircle,
  FiTarget,
  FiBriefcase,
  FiActivity,
  FiDollarSign,
  FiPhone,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";

// Existing API configuration — unchanged.
const API_URL = `${import.meta.env.VITE_BASE_URL}/admin/leads`;
const FOLLOWUPS_API = `${import.meta.env.VITE_BASE_URL}/admin/follow-ups`;

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("adminToken");

const getHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.leads)) return data.leads;
  if (Array.isArray(data?.followUps)) return data.followUps;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: Number(value || 0) >= 10000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "Date not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizedStatus = (status) =>
  String(status || "New").trim().toLowerCase();

const statusStyles = {
  new: "bg-blue-50 text-blue-700 ring-blue-600/10",
  contacted: "bg-cyan-50 text-cyan-700 ring-cyan-600/10",
  qualified: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  proposal: "bg-violet-50 text-violet-700 ring-violet-600/10",
  "proposal sent": "bg-violet-50 text-violet-700 ring-violet-600/10",
  negotiation: "bg-amber-50 text-amber-700 ring-amber-600/10",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  lost: "bg-rose-50 text-rose-700 ring-rose-600/10",
};

const statusColors = {
  New: "bg-blue-500",
  Contacted: "bg-cyan-500",
  Qualified: "bg-indigo-500",
  Proposal: "bg-violet-500",
  Negotiation: "bg-amber-500",
  Won: "bg-emerald-500",
  Lost: "bg-rose-500",
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg sm:p-5"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={21} />
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between gap-2">
      <p className="text-xs leading-5 text-slate-500">{subtitle}</p>
      <FiArrowUpRight className="shrink-0 text-slate-300 transition group-hover:text-indigo-600" />
    </div>
  </button>
);

const SectionTitle = ({ title, subtitle, onClick, action = "View all" }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-base font-bold text-slate-900 sm:text-lg">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          {subtitle}
        </p>
      )}
    </div>

    {onClick && (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 sm:text-sm"
      >
        {action}
        <FiArrowRight />
      </button>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="px-5 py-10 text-center sm:py-12">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <Icon size={23} />
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-800">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm">
      {description}
    </p>
    {action}
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const adminName = user.name || user.fullName || user.username || "Admin";

  const goToLeads = () => navigate("/admin/adminleads");
  const goToFollowUps = () => navigate("/admin/follow-ups");
  const goToPipeline = () => navigate("/admin/pipeline");

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!getToken()) {
        setLoading(false);
        toast.error("Login session not found. Please log in again.");
        navigate("/login", { replace: true });
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const results = await Promise.allSettled([
          axios.get(API_URL, { headers: getHeaders() }),
          axios.get(FOLLOWUPS_API, { headers: getHeaders() }),
        ]);

        const leadResult = results[0];
        const followUpResult = results[1];

        if (leadResult.status === "fulfilled") {
          setLeads(getArray(leadResult.value));
        } else {
          const error = leadResult.reason;

          if (error?.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("adminToken");
            toast.error("Your session has expired. Please log in again.");
            navigate("/login", { replace: true });
            return;
          }

          toast.error(
            error?.response?.data?.message || "Could not load leads."
          );
          setLeads([]);
        }

        if (followUpResult.status === "fulfilled") {
          setFollowUps(getArray(followUpResult.value));
        } else {
          const error = followUpResult.reason;

          if (error?.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("adminToken");
            toast.error("Your session has expired. Please log in again.");
            navigate("/login", { replace: true });
            return;
          }

          setFollowUps([]);
        }

        setLastUpdated(new Date());
      } catch {
        toast.error("Unable to load dashboard data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newToday = leads.filter((lead) => {
      const created = new Date(lead.createdAt || lead.updatedAt || 0);
      return created >= startOfToday && created < tomorrow;
    }).length;

    const won = leads.filter(
      (lead) => normalizedStatus(lead.status) === "won"
    ).length;

    const lost = leads.filter(
      (lead) => normalizedStatus(lead.status) === "lost"
    ).length;

    const activeLeads = leads.filter(
      (lead) =>
        !["won", "lost"].includes(normalizedStatus(lead.status))
    );

    const overdueLeadFollowUps = leads.filter((lead) => {
      if (lead.overdue) return true;
      if (!lead.followUp) return false;

      const dueDate = new Date(lead.followUp);

      return (
        !Number.isNaN(dueDate.getTime()) &&
        dueDate < startOfToday &&
        !["won", "lost"].includes(normalizedStatus(lead.status))
      );
    }).length;

    const pendingFollowUps = followUps.filter((item) => {
      if (item.isArchived) return false;

      return !["completed", "cancelled"].includes(
        normalizedStatus(item.status || "Pending")
      );
    });

    const overdueFollowUps = pendingFollowUps.filter((item) => {
      const dueDate = item.dueDate || item.followUp;
      return dueDate && new Date(dueDate) < now;
    }).length;

    const pipelineValue = activeLeads.reduce(
      (sum, lead) => sum + Number(lead.value || 0),
      0
    );

    const decided = won + lost;
    const winRate = decided ? Math.round((won / decided) * 100) : 0;

    return {
      total: leads.length,
      newToday,
      won,
      lost,
      active: activeLeads.length,
      overdue: overdueLeadFollowUps + overdueFollowUps,
      pendingFollowUps: pendingFollowUps.length,
      pipelineValue,
      winRate,
    };
  }, [leads, followUps]);

  const recentLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...leads]
      .filter((lead) =>
        [
          lead.name,
          lead.company,
          lead.email,
          lead.phone,
          lead.vertical,
          lead.status,
        ].some((value) => String(value || "").toLowerCase().includes(term))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0) -
          new Date(a.createdAt || a.updatedAt || 0)
      )
      .slice(0, 6);
  }, [leads, search]);

  const statusSummary = useMemo(() => {
    const statuses = [
      "New",
      "Contacted",
      "Qualified",
      "Proposal",
      "Negotiation",
      "Won",
      "Lost",
    ];

    return statuses.map((name) => {
      const count = leads.filter((lead) => {
        const status = normalizedStatus(lead.status);

        if (name === "Proposal") {
          return ["proposal", "proposal sent"].includes(status);
        }

        return status === name.toLowerCase();
      }).length;

      return {
        name,
        count,
        color: statusColors[name],
      };
    });
  }, [leads]);

  const upcomingFollowUps = useMemo(() => {
    return [...followUps]
      .filter((item) => {
        if (item.isArchived) return false;

        return !["completed", "cancelled"].includes(
          normalizedStatus(item.status || "Pending")
        );
      })
      .sort((a, b) => {
        const aDate = new Date(
          a.dueDate || a.followUp || "9999-12-31"
        ).getTime();

        const bDate = new Date(
          b.dueDate || b.followUp || "9999-12-31"
        ).getTime();

        return aDate - bDate;
      })
      .slice(0, 4);
  }, [followUps]);

  const getFollowUpName = (item) => {
    if (item.lead && typeof item.lead === "object") {
      return item.lead.name || item.title || "Lead follow-up";
    }

    return item.title || item.leadName || "Lead follow-up";
  };

  const getFollowUpDate = (item) =>
    item.dueDate || item.followUp || item.reminderAt;

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      {/* Welcome and page actions */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-5 text-white shadow-lg sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border-[30px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-44 w-44 rounded-full bg-indigo-400/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
              <FiActivity />
              CRM COMMAND CENTER
            </div>

            <h1 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Welcome back, {adminName}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Track your leads, stay on top of follow-ups, and monitor your
              sales pipeline from one place.
            </p>

            {lastUpdated && (
              <p className="mt-3 text-xs text-indigo-200/70">
                Last synced: {formatDateTime(lastUpdated)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={goToLeads}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-800 transition hover:bg-indigo-50"
            >
              <FiUserPlus />
              Manage Leads
              <FiArrowUpRight />
            </button>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Business Overview
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Live figures from your existing database
            </p>
          </div>

          {loading && (
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              Loading data
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          <StatCard
            title="Total Leads"
            value={loading ? "—" : stats.total}
            subtitle="All registered leads"
            icon={FiUsers}
            iconClass="bg-indigo-50 text-indigo-600"
            onClick={goToLeads}
          />

          <StatCard
            title="New Today"
            value={loading ? "—" : stats.newToday}
            subtitle="Leads created today"
            icon={FiUserPlus}
            iconClass="bg-sky-50 text-sky-600"
            onClick={goToLeads}
          />

          <StatCard
            title="Follow-ups Due"
            value={loading ? "—" : stats.overdue}
            subtitle={`${stats.pendingFollowUps} pending activities`}
            icon={FiAlertCircle}
            iconClass="bg-rose-50 text-rose-600"
            onClick={goToFollowUps}
          />

          <StatCard
            title="Converted Leads"
            value={loading ? "—" : stats.won}
            subtitle={`${stats.winRate}% win rate of decided leads`}
            icon={FiCheckCircle}
            iconClass="bg-emerald-50 text-emerald-600"
            onClick={goToLeads}
          />
        </div>
      </section>

      {/* Pipeline and performance */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-sm sm:rounded-3xl sm:p-7 lg:col-span-2">
          <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border-[24px] border-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
                <FiDollarSign />
                Active Pipeline Value
              </div>

              <p className="mt-4 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                {loading ? "—" : money(stats.pipelineValue)}
              </p>

              <p className="mt-2 text-sm text-indigo-100">
                {stats.active} active opportunities
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:h-14 sm:w-14">
              <FiTrendingUp size={26} />
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goToPipeline}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              View pipeline
              <FiArrowRight />
            </button>

            <button
              type="button"
              onClick={goToLeads}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View leads
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Sales performance</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Win Rate
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiTarget size={22} />
            </div>
          </div>

          <div className="mt-7 flex items-end gap-2">
            <p className="text-4xl font-bold tracking-tight text-slate-900">
              {loading ? "—" : `${stats.winRate}%`}
            </p>
            <p className="pb-1 text-xs text-slate-500">of decided leads</p>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${stats.winRate}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Won</p>
              <p className="mt-1 text-xl font-bold text-emerald-800">
                {loading ? "—" : stats.won}
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 p-3">
              <p className="text-xs text-rose-700">Lost</p>
              <p className="mt-1 text-xl font-bold text-rose-800">
                {loading ? "—" : stats.lost}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent leads and lead status */}
      <section className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-3">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl xl:col-span-2">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle
                title="Recent Leads"
                subtitle="Your latest CRM records"
                onClick={goToLeads}
                action="View all"
              />

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <FiSearch className="shrink-0 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search leads..."
                  aria-label="Search recent leads"
                  className="min-w-0 w-full bg-transparent text-sm outline-none sm:w-40"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 px-5 pb-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex animate-pulse gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title={search ? "No matching leads" : "No leads available"}
              description={
                search
                  ? "Try another name, company, email, phone, or status."
                  : "Your backend leads will appear here when records are available."
              }
              action={
                !search && (
                  <button
                    type="button"
                    onClick={goToLeads}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Manage Leads
                  </button>
                )
              }
            />
          ) : (
            <>
              {/* Compact cards on small screens */}
              <div className="space-y-3 px-4 pb-4 md:hidden">
                {recentLeads.map((lead) => (
                  <button
                    type="button"
                    key={lead._id || lead.id}
                    onClick={goToLeads}
                    className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                      {(lead.name || "L").trim().charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {lead.name || "Unnamed lead"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {lead.company || lead.email || lead.phone || "No contact details"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                            statusStyles[normalizedStatus(lead.status)] ||
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {lead.status || "New"}
                        </span>

                        <span className="text-xs text-slate-500">
                          {lead.vertical || "No vertical"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-slate-800">
                        {money(lead.value)}
                      </p>
                      <FiArrowUpRight className="ml-auto mt-2 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Table on larger screens */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-y border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Lead</th>
                      <th className="px-4 py-3 font-semibold">Vertical</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Value</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentLeads.map((lead) => (
                      <tr
                        key={lead._id || lead.id}
                        onClick={goToLeads}
                        className="cursor-pointer transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
                              {(lead.name || "L").trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate font-semibold text-slate-900">
                                {lead.name || "Unnamed lead"}
                              </p>
                              <p className="mt-1 max-w-[190px] truncate text-xs text-slate-500">
                                {lead.company || lead.email || lead.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {lead.vertical || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              statusStyles[normalizedStatus(lead.status)] ||
                              "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {lead.status || "New"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                          {money(lead.value)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                          {formatDate(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={goToLeads}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Open CRM & Leads
              <FiArrowRight />
            </button>
          </div>
        </div>

        {/* Status distribution */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
          <SectionTitle
            title="Lead Status"
            subtitle="Current distribution"
          />

          <div className="mt-6 space-y-5">
            {statusSummary.map((item) => {
              const percentage = stats.total
                ? Math.round((item.count / stats.total) * 100)
                : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`}
                      />
                      <span className="truncate text-sm text-slate-600">
                        {item.name}
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-slate-900">
                      {loading ? "—" : item.count}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <FiBriefcase className="text-indigo-600" />
              <span className="text-xs font-medium">Active opportunities</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "—" : stats.active}
            </p>
            <button
              type="button"
              onClick={goToLeads}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Explore leads <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming follow-ups */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionTitle
            title="Upcoming Follow-ups"
            subtitle="Activities that need your attention"
            onClick={goToFollowUps}
            action="View all"
          />

          <button
            type="button"
            onClick={goToFollowUps}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <FiCalendar />
            Manage Follow-ups
            <FiArrowUpRight />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-50"
              />
            ))}
          </div>
        ) : upcomingFollowUps.length === 0 ? (
          <EmptyState
            icon={FiCheckCircle}
            title="No pending follow-ups"
            description="When follow-up activities are available in your database, they will appear here."
            action={
              <button
                type="button"
                onClick={goToFollowUps}
                className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open Follow-ups
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
            {upcomingFollowUps.map((item) => {
              const due = getFollowUpDate(item);
              const isOverdue =
                due &&
                new Date(due) < new Date() &&
                !["completed", "cancelled"].includes(
                  normalizedStatus(item.status)
                );

              return (
                <button
                  type="button"
                  key={item._id || item.id}
                  onClick={goToFollowUps}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isOverdue
                        ? "bg-rose-50 text-rose-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {isOverdue ? (
                      <FiAlertCircle size={19} />
                    ) : (
                      <FiClock size={19} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {getFollowUpName(item)}
                    </p>

                    {item.title && item.lead && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.title}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          isOverdue ? "text-rose-600" : "text-slate-500"
                        }`}
                      >
                        {formatDate(due)}
                      </span>

                      {item.priority && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          {item.priority}
                        </span>
                      )}

                      {item.status && (
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <FiArrowUpRight className="mt-1 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={goToLeads}
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-sm"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FiUsers size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Manage Leads</p>
            <p className="mt-1 text-xs text-slate-500">View and update CRM records</p>
          </div>
          <FiArrowUpRight className="shrink-0 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={goToFollowUps}
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-sm"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FiCalendar size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Follow-ups</p>
            <p className="mt-1 text-xs text-slate-500">Review pending activities</p>
          </div>
          <FiArrowUpRight className="shrink-0 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/call-logs")}
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-sm"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FiPhone size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Call Logs</p>
            <p className="mt-1 text-xs text-slate-500">Review communication records</p>
          </div>
          <FiArrowUpRight className="shrink-0 text-slate-400" />
        </button>
      </section>

      <div className="flex flex-col items-center justify-between gap-2 pb-2 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
        <p>ISHA DISHA · CRM Dashboard</p>
        <p>
          {lastUpdated
            ? `Data synced ${formatDateTime(lastUpdated)}`
            : "Connecting to your database"}
        </p>
      </div>
    </div>
  );
}
