import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
} from "react-icons/fi";

const API_URL = `${import.meta.env.VITE_BASE_URL}/admin/leads`;

const statuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const sources = [
  "Website",
  "Referral",
  "Social Media",
  "Cold Call",
  "Advertisement",
  "Walk-in",
  "Other",
];

const verticals = [
  "Real Estate",
  "Manpower",
  "Logistics",
  "Vendor Supply",
  "Construction",
  "Borewell",
  "Security",
  "Consultancy",
];

const emptyForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  location: "",
  vertical: "Real Estate",
  source: "Website",
  status: "New",
  value: "",
  followUp: "",
  owner: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60";

const statusStyles = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-cyan-100 text-cyan-700",
  Qualified: "bg-indigo-100 text-indigo-700",
  Proposal: "bg-purple-100 text-purple-700",
  Negotiation: "bg-amber-100 text-amber-700",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};

const getHeaders = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("adminToken");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const errorMessage = (error) => {
  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have admin permission.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong."
  );
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateLabel = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const dateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const extractLeads = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.leads)) return data.leads;
  if (Array.isArray(data?.data?.leads)) return data.data.leads;
  return null;
};

const exportCSV = (leads) => {
  if (!leads.length) {
    toast.info("No leads available to export.");
    return;
  }

  const columns = [
    ["Name", "name"],
    ["Company", "company"],
    ["Phone", "phone"],
    ["Email", "email"],
    ["Location", "location"],
    ["Vertical", "vertical"],
    ["Source", "source"],
    ["Status", "status"],
    ["Value", "value"],
    ["Follow-up", "followUp"],
    ["Owner", "owner"],
  ];

  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    columns.map(([label]) => escape(label)).join(","),
    ...leads.map((lead) =>
      columns
        .map(([label, key]) =>
          escape(key === "followUp" ? dateLabel(lead[key]) : lead[key]),
        )
        .join(","),
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `admin-leads-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  toast.success("CSV exported successfully.");
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryCard({ label, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">Live API data</p>
    </div>
  );
}

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [verticalFilter, setVerticalFilter] = useState("All");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const loadLeads = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(API_URL, {
        headers: getHeaders(),
      });

      const result = extractLeads(response.data);

      if (!result) {
        throw new Error("The leads API returned an unexpected response.");
      }

      setLeads(result);
    } catch (error) {
      toast.error(errorMessage(error));
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = leads.filter((lead) => {
      const searchable = [
        lead.name,
        lead.company,
        lead.phone,
        lead.email,
        lead.location,
        lead.owner,
        lead.vertical,
        lead.source,
        lead.status,
      ];

      const matchesSearch =
        !term ||
        searchable.some((item) =>
          String(item ?? "")
            .toLowerCase()
            .includes(term),
        );

      return (
        matchesSearch &&
        (statusFilter === "All" || lead.status === statusFilter) &&
        (sourceFilter === "All" || lead.source === sourceFilter) &&
        (verticalFilter === "All" || lead.vertical === verticalFilter)
      );
    });

    return result.sort((a, b) => {
      const first = a[sortBy] ?? "";
      const second = b[sortBy] ?? "";
      let comparison;

      if (sortBy === "value") {
        comparison = Number(first) - Number(second);
      } else if (sortBy === "followUp" || sortBy === "createdAt") {
        comparison =
          (first ? new Date(first).getTime() : 0) -
          (second ? new Date(second).getTime() : 0);
      } else {
        comparison = String(first).localeCompare(String(second), undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    leads,
    search,
    statusFilter,
    sourceFilter,
    verticalFilter,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const pageLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalValue = leads.reduce(
    (sum, lead) => sum + Number(lead.value || 0),
    0,
  );

  const newCount = leads.filter((lead) => lead.status === "New").length;
  const qualifiedCount = leads.filter(
    (lead) => lead.status === "Qualified",
  ).length;

  const openCreate = () => {
    setEditingLead(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name || "",
      company: lead.company || "",
      phone: lead.phone || "",
      email: lead.email || "",
      location: lead.location || "",
      vertical: lead.vertical || "Real Estate",
      source: lead.source || "Website",
      status: lead.status || "New",
      value: lead.value ?? "",
      followUp: dateInput(lead.followUp),
      owner:
        typeof lead.owner === "string" ? lead.owner : lead.owner?.name || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingLead(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!form.name.trim()) {
      toast.error("Lead name is required.");
      return;
    }

    if (!form.phone.trim() && !form.email.trim()) {
      toast.error("Enter a phone number or email address.");
      return;
    }

    if (
      form.value !== "" &&
      (!Number.isFinite(Number(form.value)) || Number(form.value) < 0)
    ) {
      toast.error("Enter a valid non-negative lead value.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      location: form.location.trim(),
      owner: form.owner.trim(),
      value: Number(form.value || 0),
      followUp: form.followUp || null,
    };

    setSaving(true);

    try {
      if (editingLead?._id) {
        await axios.put(`${API_URL}/${editingLead._id}`, payload, {
          headers: getHeaders(),
        });
        toast.success("Lead updated successfully.");
      } else {
        await axios.post(`${API_URL}/create`, payload, {
          headers: getHeaders(),
        });
        toast.success("Lead created successfully.");
      }

      setShowModal(false);
      setEditingLead(null);
      setForm({ ...emptyForm });
      setPage(1);

      await loadLeads();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!lead?._id || deletingId) return;

    if (!window.confirm(`Delete lead "${lead.name}"?`)) return;

    setDeletingId(lead._id);

    try {
      await axios.delete(`${API_URL}/${lead._id}`, {
        headers: getHeaders(),
      });

      setLeads((previous) => previous.filter((item) => item._id !== lead._id));

      toast.success("Lead deleted successfully.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }

    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All");
    setVerticalFilter("All");
    setPage(1);
  };

  const SortButton = ({ field, children }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 font-semibold hover:text-indigo-600"
    >
      {children}
      {sortBy === field && (
        <span className="text-indigo-600">
          {sortOrder === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => exportCSV(filteredLeads)}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100"
          >
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <FiPlus /> Add Lead
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Leads" value={leads.length} />
          <SummaryCard
            label="New Leads"
            value={newCount}
            color="text-blue-600"
          />
          <SummaryCard
            label="Qualified Leads"
            value={qualifiedCount}
            color="text-indigo-600"
          />
          <SummaryCard
            label="Total Lead Value"
            value={money(totalValue)}
            color="text-emerald-600"
          />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, company, phone, email..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              className={inputClass}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">All statuses</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              className={inputClass}
              value={sourceFilter}
              onChange={(event) => {
                setSourceFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">All sources</option>
              {sources.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              className={inputClass}
              value={verticalFilter}
              onChange={(event) => {
                setVerticalFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">All verticals</option>
              {verticals.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing <strong>{filteredLeads.length}</strong> of{" "}
              <strong>{leads.length}</strong> leads · Filtered value:{" "}
              <strong>
                {money(
                  filteredLeads.reduce(
                    (sum, lead) => sum + Number(lead.value || 0),
                    0,
                  ),
                )}
              </strong>
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Lead Directory</h2>
              <p className="mt-1 text-xs text-slate-500">
                View and manage your lead records.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {filteredLeads.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              Loading leads...
            </div>
          ) : pageLeads.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
              <FiUsers className="mb-3 text-3xl text-slate-400" />
              <h3 className="font-semibold text-slate-800">No leads found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Change your filters or create a new lead.
              </p>
              <button
                onClick={openCreate}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <FiPlus className="mr-1 inline" /> Add Lead
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">
                        <SortButton field="name">Lead</SortButton>
                      </th>
                      <th className="px-5 py-4">Contact</th>
                      <th className="px-5 py-4">
                        <SortButton field="vertical">Vertical</SortButton>
                      </th>
                      <th className="px-5 py-4">Source</th>
                      <th className="px-5 py-4">
                        <SortButton field="status">Status</SortButton>
                      </th>
                      <th className="px-5 py-4">
                        <SortButton field="value">Value</SortButton>
                      </th>
                      <th className="px-5 py-4">
                        <SortButton field="followUp">Follow-up</SortButton>
                      </th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                              {lead.initials ||
                                (lead.name || "?")
                                  .split(/\s+/)
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {lead.name || "Unnamed lead"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {lead.company || "No company"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p>{lead.phone || "—"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {lead.email || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p>{lead.vertical || "—"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {lead.location || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs">
                            {lead.source || "Other"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[lead.status] || "bg-slate-100 text-slate-700"}`}
                          >
                            {lead.status || "New"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {money(lead.value)}
                        </td>
                        <td className="px-5 py-4">
                          {dateLabel(lead.followUp)}
                          {lead.overdue && (
                            <p className="mt-1 text-xs font-semibold text-rose-600">
                              Overdue
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {typeof lead.owner === "string"
                            ? lead.owner || "Unassigned"
                            : lead.owner?.name || "Unassigned"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title="Edit lead"
                              onClick={() => openEdit(lead)}
                              className="rounded-lg border p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              type="button"
                              title="Delete lead"
                              disabled={deletingId === lead._id}
                              onClick={() => handleDelete(lead)}
                              className="rounded-lg border p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            >
                              {deletingId === lead._id ? "…" : <FiTrash2 />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
                <p className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages} · {filteredLeads.length}{" "}
                  leads
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPage((previous) => Math.max(1, previous - 1))
                    }
                    className="rounded-lg border p-2 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="px-2 text-sm font-semibold">
                    {currentPage}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((previous) => Math.min(totalPages, previous + 1))
                    }
                    className="rounded-lg border p-2 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingLead ? "Edit Lead" : "Add New Lead"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the lead details below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 hover:bg-slate-100"
                  aria-label="Close modal"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-7">
                  <Field label="Lead Name">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Full name"
                      required
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Company name"
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Phone number"
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="name@example.com"
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="City or location"
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Owner">
                    <input
                      name="owner"
                      value={form.owner}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Assigned person"
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Vertical">
                    <select
                      name="vertical"
                      value={form.vertical}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={saving}
                    >
                      {verticals.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Source">
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={saving}
                    >
                      {sources.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={saving}
                    >
                      {statuses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Estimated Value (₹)">
                    <input
                      name="value"
                      type="number"
                      min="0"
                      step="any"
                      value={form.value}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="0"
                      disabled={saving}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Next Follow-up Date">
                      <input
                        name="followUp"
                        type="date"
                        value={form.followUp}
                        onChange={handleChange}
                        className={inputClass}
                        disabled={saving}
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-slate-500 sm:col-span-2">
                    At least one contact method — phone or email — is required.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-white" />
                    )}
                    {saving
                      ? "Saving..."
                      : editingLead
                        ? "Update Lead"
                        : "Create Lead"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
