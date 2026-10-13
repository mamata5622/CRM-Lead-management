import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FiHelpCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiMessageCircle,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
  FiX,
} from "react-icons/fi";

const initialForm = {
  subject: "",
  category: "Technical Issue",
  priority: "Medium",
  description: "",
};

const statusStyles = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
};

const priorityStyles = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700",
};

const HelpSupport = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState(initialForm);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchTickets = useCallback(async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/emp/support-tickets`,
        authConfig,
      );

      setTickets(data.tickets || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load support tickets.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.subject.trim().length < 3) {
      toast.error("Subject must contain at least 3 characters.");
      return;
    }

    if (form.description.trim().length < 10) {
      toast.error("Please describe your issue in at least 10 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/emp/support-tickets`,
        {
          ...form,
          subject: form.subject.trim(),
          description: form.description.trim(),
        },
        authConfig,
      );

      toast.success(data.message || "Support ticket submitted.");
      setForm(initialForm);
      setShowForm(false);
      await fetchTickets();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to submit your support request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      String(ticket.ticketNumber || "")
        .toLowerCase()
        .includes(searchText) ||
      String(ticket.subject || "")
        .toLowerCase()
        .includes(searchText) ||
      String(ticket.category || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const countByStatus = (status) =>
    tickets.filter((ticket) => ticket.status === status).length;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/employee/dashboard")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <FiArrowLeft />
          Back to dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Employee services
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Help & Support
            </h1>
            <p className="mt-2 text-slate-500">
              Raise a request and track its progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchTickets}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FiPlus />
              New ticket
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total tickets",
              value: tickets.length,
              icon: FiHelpCircle,
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "Open",
              value: countByStatus("Open"),
              icon: FiAlertCircle,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "In progress",
              value: countByStatus("In Progress"),
              icon: FiClock,
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "Resolved",
              value: countByStatus("Resolved"),
              icon: FiCheckCircle,
              color: "bg-emerald-50 text-emerald-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}
                  >
                    <Icon size={21} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Ticket list */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                My support tickets
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Requests submitted from your employee account.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tickets..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="All">All statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FiMessageCircle className="mx-auto text-4xl text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-800">
                No support tickets found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Create a ticket if you need help from the support team.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create a ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket._id || ticket.ticketNumber}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FiMessageCircle size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {ticket.subject}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusStyles[ticket.status] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {ticket.status || "Open"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Ticket: {ticket.ticketNumber || ticket._id || "—"}
                        </p>

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {ticket.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>Created {formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          priorityStyles[ticket.priority] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ticket.priority || "Medium"} priority
                      </span>

                      {ticket.updatedAt && (
                        <span className="text-xs text-slate-400">
                          Updated {formatDate(ticket.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {ticket.adminReply && (
                    <div className="ml-0 mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 sm:ml-14">
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                        Support response
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {ticket.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New ticket modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowForm(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ticket-form-title"
              className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="ticket-form-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    Create support ticket
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Describe the problem so the team can help you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleFormChange}
                    required
                    minLength={3}
                    maxLength={150}
                    placeholder="Briefly describe your issue"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option>Technical Issue</option>
                      <option>Account Access</option>
                      <option>CRM / Leads</option>
                      <option>Follow-ups</option>
                      <option>HR / Attendance</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="priority"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={form.priority}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={5}
                    placeholder="Explain what happened, what you expected, and any steps to reproduce it..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.description.length}/3000
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;
