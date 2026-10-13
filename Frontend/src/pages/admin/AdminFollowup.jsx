// frontend/src/pages/admin/AdminFollowup.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArchive,
  FiRotateCcw,
  FiX,
  FiPhone,
  FiMail,
  FiGlobe,
  FiInstagram,
  FiFacebook,
  FiLinkedin,
  FiSend,
  FiFileText,
} from "react-icons/fi";

const API_URL = `${import.meta.env.VITE_BASE_URL}/admin/follow-ups`;
const LEADS_API = `${import.meta.env.VITE_BASE_URL}/admin/leads`;

const CHANNELS = [
  "LinkedIn",
  "Facebook",
  "WhatsApp",
  "Email",
  "Phone Call",
  "Website Inquiry",
  "Instagram",
  "Other",
];

const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const emptyForm = () => ({
  lead: "",
  title: "",
  description: "",
  channel: "Phone Call",
  priority: "Medium",
  dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
  assignedTo: "",
});

const getToken = () => localStorage.getItem("token");

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getLeadName = (lead) => {
  if (!lead) return "Unknown lead";
  if (typeof lead === "string") return lead;
  return lead.name || lead.company || lead.email || "Unnamed lead";
};

const getUserName = (user) => {
  if (!user) return "Unassigned";
  if (typeof user === "string") return user;
  return user.name || user.fullName || user.email || "Assigned user";
};

const formatDate = (date) => {
  if (!date) return "Not scheduled";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const isOverdue = (item) =>
  item?.dueDate &&
  new Date(item.dueDate).getTime() < Date.now() &&
  ["Pending", "In Progress"].includes(item.status);

const channelIcon = (channel) => {
  switch (channel) {
    case "LinkedIn":
      return <FiLinkedin />;
    case "Facebook":
      return <FiFacebook />;
    case "WhatsApp":
    case "Phone Call":
      return <FiPhone />;
    case "Email":
      return <FiMail />;
    case "Instagram":
      return <FiInstagram />;
    case "Website Inquiry":
      return <FiGlobe />;
    default:
      return <FiMessageSquare />;
  }
};

const statusClass = (status) => {
  const classes = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return classes[status] || "bg-slate-100 text-slate-600 ring-slate-200";
};

const priorityClass = (priority) => {
  const classes = {
    Low: "bg-slate-100 text-slate-600",
    Medium: "bg-blue-50 text-blue-700",
    High: "bg-orange-50 text-orange-700",
    Urgent: "bg-red-50 text-red-700",
  };
  return classes[priority] || "bg-slate-100 text-slate-600";
};

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminFollowup() {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    byChannel: {},
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [communication, setCommunication] = useState({
    channel: "Phone Call",
    direction: "Outgoing",
    subject: "",
    message: "",
    outcome: "",
    communicatedAt: new Date().toISOString().slice(0, 16),
  });
  const [completionOutcome, setCompletionOutcome] = useState("");

  const fetchData = useCallback(async () => {
    if (!getToken()) {
      toast.error("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const params = {
        search: search.trim() || undefined,
        channel: channelFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        archived: showArchived ? "true" : "false",
        limit: 100,
      };

      const [followUpsResponse, statsResponse, leadsResponse] =
        await Promise.all([
          axios.get(API_URL, { ...authConfig(), params }),
          axios.get(`${API_URL}/stats`, authConfig()),
          axios.get(LEADS_API, authConfig()),
        ]);

      const followUpData = followUpsResponse.data;
      const leadData = leadsResponse.data;

      setFollowUps(
        Array.isArray(followUpData)
          ? followUpData
          : followUpData.followUps || followUpData.data || [],
      );

      setStats(
        statsResponse.data?.stats || {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          overdue: 0,
          byChannel: {},
        },
      );

      setLeads(
        Array.isArray(leadData)
          ? leadData
          : leadData.leads || leadData.data || [],
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load follow-ups"));
    } finally {
      setLoading(false);
    }
  }, [search, channelFilter, statusFilter, priorityFilter, showArchived]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visibleFollowUps = useMemo(() => followUps, [followUps]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetCreateForm = () => {
    setForm(emptyForm());
    setShowCreate(false);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.lead) {
      toast.error("Please select a lead");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Please enter a follow-up title");
      return;
    }
    if (!form.channel || !CHANNELS.includes(form.channel)) {
      toast.error("Please select a valid communication channel");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        lead: form.lead,
        title: form.title.trim(),
        description: form.description.trim(),
        channel: form.channel,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        assignedTo: form.assignedTo.trim() || null,
      };

      await axios.post(`${API_URL}/create`, payload, authConfig());

      toast.success("Follow-up created successfully");
      resetCreateForm();
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to create follow-up"));
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (item) => {
    try {
      const response = await axios.get(`${API_URL}/${item._id}`, authConfig());
      const fullFollowUp = response.data?.followUp || response.data;
      setSelected(fullFollowUp);
      setCompletionOutcome(fullFollowUp.completionOutcome || "");
      setNoteText("");
      setCommunication({
        channel: fullFollowUp.channel || "Phone Call",
        direction: "Outgoing",
        subject: "",
        message: "",
        outcome: "",
        communicatedAt: new Date().toISOString().slice(0, 16),
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to open follow-up details"));
    }
  };

  const refreshSelected = async () => {
    if (!selected?._id) return;

    const response = await axios.get(
      `${API_URL}/${selected._id}`,
      authConfig(),
    );

    const updated = response.data?.followUp || response.data;
    setSelected(updated);
    setCompletionOutcome(updated.completionOutcome || "");
  };

  const changeStatus = async (id, status, outcome = "") => {
    try {
      await axios.patch(
        `${API_URL}/${id}/status`,
        {
          status,
          completionOutcome: outcome,
        },
        authConfig(),
      );

      toast.success(`Status changed to ${status}`);
      await fetchData();

      if (selected?._id === id) await refreshSelected();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update status"));
    }
  };

  const addNote = async (event) => {
    event.preventDefault();

    if (!selected?._id || !noteText.trim()) {
      toast.error("Enter a note first");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/${selected._id}/notes`,
        { text: noteText.trim() },
        authConfig(),
      );

      toast.success("Note added to timeline");
      setNoteText("");
      await refreshSelected();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to add note"));
    } finally {
      setSaving(false);
    }
  };

  const addCommunication = async (event) => {
    event.preventDefault();

    if (!selected?._id) return;
    if (!communication.channel || !CHANNELS.includes(communication.channel)) {
      toast.error("Choose a valid channel");
      return;
    }
    if (!communication.message.trim()) {
      toast.error("Communication message is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...communication,
        subject: communication.subject.trim(),
        message: communication.message.trim(),
        outcome: communication.outcome.trim(),
        communicatedAt: communication.communicatedAt
          ? new Date(communication.communicatedAt).toISOString()
          : new Date().toISOString(),
      };

      await axios.post(
        `${API_URL}/${selected._id}/communications`,
        payload,
        authConfig(),
      );

      toast.success("Communication added to timeline");

      setCommunication({
        channel: selected.channel || "Phone Call",
        direction: "Outgoing",
        subject: "",
        message: "",
        outcome: "",
        communicatedAt: new Date().toISOString().slice(0, 16),
      });

      await refreshSelected();
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to add communication"));
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (item) => {
    const action = item.isArchived ? "restore" : "archive";

    if (!window.confirm(`Are you sure you want to ${action} this follow-up?`)) {
      return;
    }

    try {
      await axios.patch(`${API_URL}/${item._id}/archive`, {}, authConfig());
      toast.success(
        item.isArchived ? "Follow-up restored" : "Follow-up archived",
      );

      if (selected?._id === item._id) setSelected(null);
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to archive follow-up"));
    }
  };

  const statsCards = [
    {
      label: "Total follow-ups",
      value: stats.total ?? 0,
      icon: <FiMessageSquare />,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Pending",
      value: stats.pending ?? 0,
      icon: <FiClock />,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "In progress",
      value: stats.inProgress ?? 0,
      icon: <FiRefreshCw />,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Completed",
      value: stats.completed ?? 0,
      icon: <FiCheckCircle />,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Overdue",
      value: stats.overdue ?? 0,
      icon: <FiAlertCircle />,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Admin Follow-ups
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track every customer interaction in one communication timeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchData}
              className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
            >
              <FiRefreshCw /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              <FiPlus /> New Follow-up
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{card.label}</span>
                <span className={`rounded-xl p-2.5 ${card.color}`}>
                  {card.icon}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Channel summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-800">
            Communication channels
          </h2>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((channel) => (
              <button
                type="button"
                key={channel}
                onClick={() =>
                  setChannelFilter((current) =>
                    current === channel ? "" : channel,
                  )
                }
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  channelFilter === channel
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                }`}
              >
                {channelIcon(channel)}
                {channel}
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                  {stats.byChannel?.[channel] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, lead, company..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All channels</option>
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Show archived follow-ups
            </label>
            <p className="text-sm text-slate-500">
              {visibleFollowUps.length} result(s)
            </p>
          </div>
        </div>

        {/* Follow-up list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">
              Follow-up communication timeline
            </h2>
            <span className="text-xs text-slate-500">Sorted by due date</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading follow-ups...
            </div>
          ) : visibleFollowUps.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FiMessageSquare size={24} />
              </div>
              <h3 className="font-semibold text-slate-800">
                No follow-ups found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create a follow-up or adjust the filters.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className={`${buttonClass} mt-4 bg-indigo-600 text-white hover:bg-indigo-700`}
              >
                <FiPlus /> Create follow-up
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleFollowUps.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      {channelIcon(item.channel)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {item.title}
                        </h3>
                        {isOverdue(item) && (
                          <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Overdue
                          </span>
                        )}
                        {item.isArchived && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            Archived
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        Lead:{" "}
                        <span className="font-medium text-slate-800">
                          {getLeadName(item.lead)}
                        </span>
                      </p>

                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                          {channelIcon(item.channel)} {item.channel}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${statusClass(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${priorityClass(
                            item.priority,
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-slate-500">
                          Due: {formatDate(item.dueDate)}
                        </span>
                        <span className="text-slate-500">
                          Assigned: {getUserName(item.assignedTo)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {!item.isArchived && item.status !== "Completed" && (
                      <select
                        value={item.status}
                        onChange={(event) =>
                          changeStatus(item._id, event.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                        aria-label={`Change status for ${item.title}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => openDetails(item)}
                      className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
                    >
                      <FiFileText /> Timeline
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleArchive(item)}
                      className={`${buttonClass} border border-slate-200 bg-white text-slate-600 hover:bg-slate-100`}
                      title={item.isArchived ? "Restore" : "Archive"}
                    >
                      {item.isArchived ? <FiRotateCcw /> : <FiArchive />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create follow-up modal */}
      {showCreate && (
        <Modal title="Create follow-up" onClose={resetCreateForm}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Lead *
              </label>
              <select
                name="lead"
                value={form.lead}
                onChange={updateForm}
                className={inputClass}
                required
              >
                <option value="">Select a lead</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {getLeadName(lead)}
                    {lead.company ? ` — ${lead.company}` : ""}
                  </option>
                ))}
              </select>
              {leads.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  No leads were returned. Check your leads API endpoint.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Follow-up title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="e.g. Call lead about proposal"
                className={inputClass}
                maxLength={150}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Communication channel *
              </label>
              <select
                name="channel"
                value={form.channel}
                onChange={updateForm}
                className={inputClass}
                required
              >
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Priority
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={updateForm}
                  className={inputClass}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Due date and time
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={updateForm}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Assigned user ID (optional)
              </label>
              <input
                name="assignedTo"
                value={form.assignedTo}
                onChange={updateForm}
                placeholder="MongoDB User ObjectId"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to keep the follow-up unassigned.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                rows={3}
                maxLength={2000}
                placeholder="Add context or next steps..."
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={resetCreateForm}
                className={`${buttonClass} border border-slate-200 text-slate-700 hover:bg-slate-100`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
              >
                <FiPlus /> {saving ? "Creating..." : "Create follow-up"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Communication timeline modal */}
      {selected && (
        <Modal
          title="Communication timeline"
          onClose={() => setSelected(null)}
          wide
        >
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selected.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Lead: {getLeadName(selected.lead)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Due: {formatDate(selected.dueDate)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                      selected.status,
                    )}`}
                  >
                    {selected.status}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${priorityClass(
                      selected.priority,
                    )}`}
                  >
                    {selected.priority}
                  </span>
                </div>
              </div>

              {selected.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                  {selected.description}
                </p>
              )}
            </div>

            {/* Record a communication */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                <FiSend className="text-indigo-600" />
                Add communication
              </h3>

              <form
                onSubmit={addCommunication}
                className="space-y-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Channel
                    </label>
                    <select
                      value={communication.channel}
                      onChange={(event) =>
                        setCommunication((old) => ({
                          ...old,
                          channel: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      {CHANNELS.map((channel) => (
                        <option key={channel} value={channel}>
                          {channel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Direction
                    </label>
                    <select
                      value={communication.direction}
                      onChange={(event) =>
                        setCommunication((old) => ({
                          ...old,
                          direction: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="Outgoing">Outgoing</option>
                      <option value="Incoming">Incoming</option>
                      <option value="Internal">Internal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Subject (optional)
                  </label>
                  <input
                    value={communication.subject}
                    onChange={(event) =>
                      setCommunication((old) => ({
                        ...old,
                        subject: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Call summary / email subject"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Message / summary *
                  </label>
                  <textarea
                    rows={3}
                    value={communication.message}
                    onChange={(event) =>
                      setCommunication((old) => ({
                        ...old,
                        message: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="What was discussed or received?"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Outcome (optional)
                    </label>
                    <input
                      value={communication.outcome}
                      onChange={(event) =>
                        setCommunication((old) => ({
                          ...old,
                          outcome: event.target.value,
                        }))
                      }
                      className={inputClass}
                      placeholder="e.g. Asked for a callback"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Date and time
                    </label>
                    <input
                      type="datetime-local"
                      value={communication.communicatedAt}
                      onChange={(event) =>
                        setCommunication((old) => ({
                          ...old,
                          communicatedAt: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                  >
                    <FiSend /> {saving ? "Saving..." : "Add to timeline"}
                  </button>
                </div>
              </form>
            </section>

            {/* Timeline events */}
            <section>
              <h3 className="mb-4 font-bold text-slate-800">
                Activity history
              </h3>

              {[
                ...(selected.communications || []).map((item) => ({
                  ...item,
                  eventType: "communication",
                  eventDate: item.communicatedAt || item.createdAt,
                })),
                ...(selected.notes || []).map((item) => ({
                  ...item,
                  eventType: "note",
                  eventDate: item.createdAt,
                })),
              ].sort(
                (a, b) =>
                  new Date(b.eventDate || 0) - new Date(a.eventDate || 0),
              ).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No communication history yet. Add the first entry above.
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    ...(selected.communications || []).map((item) => ({
                      ...item,
                      eventType: "communication",
                      eventDate: item.communicatedAt || item.createdAt,
                    })),
                    ...(selected.notes || []).map((item) => ({
                      ...item,
                      eventType: "note",
                      eventDate: item.createdAt,
                    })),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.eventDate || 0) - new Date(a.eventDate || 0),
                    )
                    .map((item, index) => (
                      <div
                        key={item._id || `${item.eventType}-${index}`}
                        className="flex gap-3"
                      >
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              item.eventType === "note"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            {item.eventType === "note" ? (
                              <FiFileText />
                            ) : (
                              channelIcon(item.channel)
                            )}
                          </div>
                          {index !==
                            [
                              ...(selected.communications || []),
                              ...(selected.notes || []),
                            ].length -
                              1 && (
                            <div className="mt-1 h-full min-h-5 w-px bg-slate-200" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.eventType === "note"
                                  ? "Internal note"
                                  : `${item.channel} · ${item.direction || "Outgoing"}`}
                              </p>
                              {item.subject && (
                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  {item.subject}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatDate(item.eventDate)}
                            </span>
                          </div>

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                            {item.text || item.message}
                          </p>

                          {item.outcome && (
                            <p className="mt-2 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-800">
                              Outcome: {item.outcome}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-slate-400">
                            By: {getUserName(item.createdBy)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* Add note */}
            <section>
              <h3 className="mb-3 font-bold text-slate-800">
                Add internal note
              </h3>
              <form onSubmit={addNote} className="space-y-3">
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  className={inputClass}
                  placeholder="Add an internal note for your team..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !noteText.trim()}
                    className={`${buttonClass} bg-slate-800 text-white hover:bg-slate-900`}
                  >
                    <FiFileText /> {saving ? "Saving..." : "Save note"}
                  </button>
                </div>
              </form>
            </section>

            {/* Completion outcome */}
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 font-bold text-slate-800">
                Update follow-up status
              </h3>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Completion outcome
              </label>
              <textarea
                value={completionOutcome}
                onChange={(event) => setCompletionOutcome(event.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Result, decision, or next step..."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      changeStatus(selected._id, status, completionOutcome)
                    }
                    className={`${buttonClass} ${
                      selected.status === status
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {status === "Completed" && <FiCheckCircle />}
                    {status}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
