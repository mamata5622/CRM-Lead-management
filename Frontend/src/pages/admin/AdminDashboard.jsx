import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  FaUsers,
  FaUserPlus,
  FaCalendarCheck,
  FaTrophy,
  FaRupeeSign,
  FaArrowRight,
  FaPhoneAlt,
  FaClock,
  FaSyncAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaChartLine,
  FaPlus,
} from "react-icons/fa";

const statusColors = {
  New: "bg-blue-500",
  Contacted: "bg-amber-500",
  Qualified: "bg-indigo-500",
  "Proposal Sent": "bg-purple-500",
  Proposal: "bg-purple-500",
  Negotiation: "bg-orange-500",
  Won: "bg-emerald-500",
  Lost: "bg-red-500",
};

const statusBadges = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-amber-50 text-amber-700",
  Qualified: "bg-indigo-50 text-indigo-700",
  "Proposal Sent": "bg-purple-50 text-purple-700",
  Proposal: "bg-purple-50 text-purple-700",
  Negotiation: "bg-orange-50 text-orange-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-red-700",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: Number(value) >= 10000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "?";

const formatDate = (date) => {
  if (!date) return "Not scheduled";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not scheduled";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isSameDay = (first, second) =>
  first.getDate() === second.getDate() &&
  first.getMonth() === second.getMonth() &&
  first.getFullYear() === second.getFullYear();

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

// Supports common backend response structures.
const extractLeads = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.leads)) return result.leads;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.leads)) return result.data.leads;
  if (Array.isArray(result?.data?.data)) return result.data.data;

  return null;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = useMemo(() => getStoredUser(), []);
  const adminName = user.name || user.fullName || "Admin";

  // Fetch leads from the protected admin API.
  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your login session is missing. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/admin/leads`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success === false) {
        throw new Error(res.data.message || "Unable to load leads.");
      }

      const records = extractLeads(res.data);

      if (!records) {
        throw new Error("Unexpected API response from the server.");
      }

      setLeads(records);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Dashboard statistics.
  const stats = useMemo(() => {
    const now = new Date();

    const todayLeads = leads.filter((lead) => {
      if (!lead.createdAt) return false;

      const createdAt = new Date(lead.createdAt);

      return !Number.isNaN(createdAt.getTime()) && isSameDay(createdAt, now);
    });

    const wonLeads = leads.filter((lead) => lead.status === "Won");

    const activeLeads = leads.filter(
      (lead) => !["Won", "Lost"].includes(lead.status),
    );

    const overdueLeads = leads.filter((lead) => {
      if (!lead.followUp || ["Won", "Lost"].includes(lead.status)) {
        return false;
      }

      const followUpDate = new Date(lead.followUp);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      return (
        !Number.isNaN(followUpDate.getTime()) && followUpDate < startOfToday
      );
    });

    const pipelineValue = activeLeads.reduce(
      (total, lead) => total + (Number(lead.value) || 0),
      0,
    );

    const winRate =
      leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

    return {
      total: leads.length,
      today: todayLeads.length,
      won: wonLeads.length,
      overdue: overdueLeads.length,
      pipelineValue,
      winRate,
      active: activeLeads.length,
    };
  }, [leads]);

  // Lead activity for the last seven days.
  const weeklyData = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));

      const count = leads.filter((lead) => {
        if (!lead.createdAt) return false;

        const created = new Date(lead.createdAt);

        return !Number.isNaN(created.getTime()) && isSameDay(created, date);
      }).length;

      return {
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        dateLabel: formatDate(date),
        count,
      };
    });
  }, [leads]);

  const maxWeeklyCount = Math.max(...weeklyData.map((day) => day.count), 1);

  // Lead distribution by status.
  const statusData = useMemo(() => {
    const statuses = [
      "New",
      "Contacted",
      "Qualified",
      "Proposal Sent",
      "Negotiation",
      "Won",
      "Lost",
    ];

    return statuses.map((status) => ({
      name: status,
      count: leads.filter((lead) => {
        if (status === "Proposal Sent") {
          return ["Proposal Sent", "Proposal"].includes(lead.status);
        }

        return lead.status === status;
      }).length,
      color: statusColors[status],
    }));
  }, [leads]);

  // Latest leads.
  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();

          return dateB - dateA;
        })
        .slice(0, 5),
    [leads],
  );

  // Upcoming follow-ups.
  const upcomingFollowUps = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leads
      .filter((lead) => {
        if (!lead.followUp || ["Won", "Lost"].includes(lead.status)) {
          return false;
        }

        const date = new Date(lead.followUp);

        return !Number.isNaN(date.getTime()) && date >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.followUp).getTime() - new Date(b.followUp).getTime(),
      )
      .slice(0, 4);
  }, [leads]);

  const statCards = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: FaUsers,
      iconStyle: "bg-blue-50 text-blue-600",
      description: "All recorded leads",
    },
    {
      label: "New Today",
      value: stats.today,
      icon: FaUserPlus,
      iconStyle: "bg-purple-50 text-purple-600",
      description: "Created today",
    },
    {
      label: "Follow-Ups Overdue",
      value: stats.overdue,
      icon: FaCalendarCheck,
      iconStyle: "bg-amber-50 text-amber-600",
      description: "Require attention",
    },
    {
      label: "Converted Leads",
      value: stats.won,
      icon: FaTrophy,
      iconStyle: "bg-emerald-50 text-emerald-600",
      description: `${stats.winRate}% of all leads`,
    },
    {
      label: "Active Pipeline",
      value: formatCurrency(stats.pipelineValue),
      icon: FaRupeeSign,
      iconStyle: "bg-indigo-50 text-indigo-600",
      description: `${stats.active} active opportunities`,
    },
  ];

  const goToLeads = () => navigate("/admin/adminleads");
  const goToFollowUps = () => navigate("/admin/follow-ups");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600">OVERVIEW</p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Welcome back, {adminName}!
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here's what's happening across your business today.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={goToLeads}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FaPlus />
            View Leads
          </button>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <FaExclamationCircle className="mt-1 shrink-0" />

            <div>
              <p className="font-semibold">Unable to load dashboard data</p>
              <p className="mt-1 break-words text-sm">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start text-sm font-semibold underline disabled:opacity-50 sm:self-center"
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>

                  <h2 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-800">
                    {loading ? "—" : card.value}
                  </h2>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconStyle}`}
                >
                  <Icon size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">{card.description}</p>
            </div>
          );
        })}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Weekly activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Lead Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                New leads created over the last 7 days
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Last 7 days
            </span>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Loading activity...
            </div>
          ) : (
            <div className="mt-8">
              <div className="flex h-52 items-end justify-around gap-3 border-b border-slate-100 px-2">
                {weeklyData.map((day) => (
                  <div
                    key={day.dateLabel}
                    title={`${day.dateLabel}: ${day.count} leads`}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-slate-600">
                      {day.count}
                    </span>

                    <div
                      className="w-full max-w-12 rounded-t-lg bg-blue-500 transition-all duration-300 hover:bg-blue-700"
                      style={{
                        height: `${Math.max(
                          (day.count / maxWeeklyCount) * 130,
                          5,
                        )}px`,
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-around gap-3 px-2">
                {weeklyData.map((day) => (
                  <div
                    key={day.dateLabel}
                    className="flex-1 text-center text-xs text-slate-500"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                Leads created per day
              </div>
            </div>
          )}
        </div>

        {/* Pipeline status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Lead Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current distribution by status
            </p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Loading pipeline...
            </div>
          ) : (
            <>
              <div className="mt-7 space-y-5">
                {statusData.map((item) => {
                  const percentage =
                    stats.total > 0 ? (item.count / stats.total) * 100 : 0;

                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                          />

                          <span className="text-sm text-slate-600">
                            {item.name}
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-slate-800">
                          {item.count}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={goToLeads}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Manage all leads
                <FaArrowRight size={12} />
              </button>
            </>
          )}
        </div>
      </section>

      {/* Recent leads and follow-ups */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent leads */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Recent Leads
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest leads from your database
              </p>
            </div>

            <button
              type="button"
              onClick={goToLeads}
              className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Loading leads...
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FaUsers className="mx-auto text-3xl text-slate-300" />

              <p className="mt-3 font-semibold text-slate-700">
                No leads available
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your latest leads will appear here when available.
              </p>

              <button
                type="button"
                onClick={goToLeads}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to Leads
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-semibold">Lead</th>
                    <th className="px-4 py-3 font-semibold">Vertical</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Value</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead, index) => (
                    <tr
                      key={lead._id || lead.id || index}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {lead.initials || getInitials(lead.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                              {lead.name || "Unnamed lead"}
                            </p>

                            <p className="max-w-40 truncate text-xs text-slate-500">
                              {lead.company || "No company"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {lead.vertical || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusBadges[lead.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lead.status || "New"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
                        {formatCurrency(lead.value)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming follow-ups */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Follow-Ups</h2>

              <p className="mt-1 text-sm text-slate-500">
                Upcoming scheduled follow-ups
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FaClock />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Loading follow-ups...
            </div>
          ) : upcomingFollowUps.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FaCalendarCheck className="mx-auto text-3xl text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No upcoming follow-ups
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Scheduled follow-ups will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingFollowUps.map((lead, index) => (
                <div
                  key={lead._id || lead.id || index}
                  className="flex items-start gap-3 px-5 py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FaCalendarCheck />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {lead.name || "Unnamed lead"}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {lead.company || lead.vertical || "Lead"}
                    </p>

                    <p className="mt-2 text-xs font-medium text-blue-600">
                      {formatDate(lead.followUp)}
                    </p>
                  </div>

                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      aria-label={`Call ${lead.name || "lead"}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <FaPhoneAlt size={13} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={goToFollowUps}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View follow-ups
              <FaArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-800">Quick Actions</h2>

          <p className="mt-1 text-sm text-slate-500">
            Navigate directly to frequently used sections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={goToLeads}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FaUserPlus size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">Manage Leads</p>
              <p className="mt-1 text-xs text-slate-500">
                View and organize leads
              </p>
            </div>

            <FaArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
          </button>

          <button
            type="button"
            onClick={goToFollowUps}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FaClock size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">Follow-Ups</p>
              <p className="mt-1 text-xs text-slate-500">
                Review scheduled activities
              </p>
            </div>

            <FaArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-600" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/pipeline")}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaChartLine size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">Deals Pipeline</p>
              <p className="mt-1 text-xs text-slate-500">
                Monitor active opportunities
              </p>
            </div>

            <FaArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/call-logs")}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-purple-200 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FaPhoneAlt size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">Call Logs</p>
              <p className="mt-1 text-xs text-slate-500">
                Open call management
              </p>
            </div>

            <FaArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-purple-600" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Isha Disha Command Center</p>

        <p className="flex items-center gap-2">
          <FaCheckCircle className="text-emerald-500" />
          Dashboard data is fetched from your API
        </p>
      </footer>
    </div>
  );
}
