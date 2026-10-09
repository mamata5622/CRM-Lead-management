import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiUsers,
  FiTarget,
  FiDollarSign,
  FiCheckCircle,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMessageCircle,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiAlertCircle,
} from "react-icons/fi";

const API_URL = `${import.meta.env.VITE_BASE_URL}/admin/leads`;
const VERTICALS = [
  "Real Estate",
  "Manpower",
  "Logistics",
  "Vendor Supply",
  "Construction",
  "Borewell",
  "Security",
  "Consultancy",
];

const STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const SOURCES = [
  "Website",
  "Referral",
  "Social Media",
  "Cold Call",
  "Advertisement",
  "Walk-in",
  "Other",
];

const EMPTY_FORM = {
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
  overdue: false,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const statusColors = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-cyan-50 text-cyan-700",
  Qualified: "bg-violet-50 text-violet-700",
  Proposal: "bg-amber-50 text-amber-700",
  Negotiation: "bg-orange-50 text-orange-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-rose-50 text-rose-700",
};

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function currency(value) {
  const amount = Number(value) || 0;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(lead) {
  if (lead.overdue === true) return true;
  if (!lead.followUp || ["Won", "Lost"].includes(lead.status)) return false;

  const due = new Date(lead.followUp);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function Field({ label, required, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function StatCard({ label, value, description, Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [vertical, setVertical] = useState("All Verticals");
  const [status, setStatus] = useState("All Statuses");
  const [owner, setOwner] = useState("All Owners");
  const [followUpFilter, setFollowUpFilter] = useState("All");

  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // const request = useCallback(async (url, options = {}) => {
  //   const response = await fetch(url, options);
  //   const result = await response.json().catch(() => null);

  //   if (!response.ok || result?.success === false) {
  //     throw new Error(result?.message || `Request failed (${response.status})`);
  //   }

  //   return result;
  // }, []);

  const request = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json().catch(() => null);

    if (response.status === 401) {
      throw new Error(
        result?.message || "Session expired or invalid. Please log in again.",
      );
    }

    if (response.status === 403) {
      throw new Error(
        result?.message || "You do not have permission to perform this action.",
      );
    }

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || `Request failed (${response.status})`);
    }

    return result;
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request(API_URL);
      if (!Array.isArray(result?.data)) {
        throw new Error("Invalid API response. Expected { data: [] }.");
      }
      setLeads(result.data);
      setSelected([]);
    } catch (err) {
      setError(err.message || "Could not load leads. Check your backend.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const owners = useMemo(
    () => [...new Set(leads.map((lead) => lead.owner).filter(Boolean))].sort(),
    [leads],
  );

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      total: leads.length,
      newToday: leads.filter((lead) => {
        if (!lead.createdAt) return false;
        const created = new Date(lead.createdAt);
        return created >= today && created < tomorrow;
      }).length,
      qualified: leads.filter((lead) => lead.status === "Qualified").length,
      won: leads.filter((lead) => lead.status === "Won").length,
      overdue: leads.filter(isOverdue).length,
      pipeline: leads
        .filter((lead) => !["Won", "Lost"].includes(lead.status))
        .reduce((sum, lead) => sum + (Number(lead.value) || 0), 0),
    };
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const rows = leads.filter((lead) => {
      const matchesSearch =
        !q ||
        [
          lead.name,
          lead.company,
          lead.phone,
          lead.email,
          lead.location,
          lead.vertical,
          lead.source,
          lead.status,
          lead.owner,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(q),
        );

      const matchesVertical =
        vertical === "All Verticals" || lead.vertical === vertical;
      const matchesStatus = status === "All Statuses" || lead.status === status;
      const matchesOwner = owner === "All Owners" || lead.owner === owner;

      let matchesFollowUp = true;
      if (followUpFilter === "Overdue") matchesFollowUp = isOverdue(lead);
      if (followUpFilter === "Scheduled") {
        matchesFollowUp = Boolean(lead.followUp) && !isOverdue(lead);
      }
      if (followUpFilter === "Unscheduled") {
        matchesFollowUp = !lead.followUp;
      }

      return (
        matchesSearch &&
        matchesVertical &&
        matchesStatus &&
        matchesOwner &&
        matchesFollowUp
      );
    });

    rows.sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];

      if (["value", "id"].includes(sortField)) {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      } else if (["createdAt", "followUp"].includes(sortField)) {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = String(av || "").toLowerCase();
        bv = String(bv || "").toLowerCase();
      }

      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [
    leads,
    search,
    vertical,
    status,
    owner,
    followUpFilter,
    sortField,
    sortDirection,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
    setSelected([]);
  }

  function resetFilters() {
    setSearch("");
    setVertical("All Verticals");
    setStatus("All Statuses");
    setOwner("All Owners");
    setFollowUpFilter("All");
    setPage(1);
    setSelected([]);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
  }

  function openEdit(lead) {
    setEditing(lead);
    setForm({
      ...EMPTY_FORM,
      ...lead,
      value: lead.value ?? "",
      followUp: dateInput(lead.followUp),
      overdue: Boolean(lead.overdue),
    });
    setError("");
    setModalOpen(true);
  }

  function updateForm(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveLead(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      id:
        editing?.id ??
        Math.max(0, ...leads.map((lead) => Number(lead.id) || 0)) + 1,
      value: Number(form.value) || 0,
      followUp: form.followUp
        ? new Date(`${form.followUp}T12:00:00`).toISOString()
        : null,
      overdue: Boolean(form.overdue),
      initials: initials(form.name),
    };

    try {
      await request(
        editing
          ? `${API_URL}/${encodeURIComponent(editing._id)}`
          : `${API_URL}/create`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      setModalOpen(false);
      setNotice(
        editing ? "Lead updated successfully." : "Lead created successfully.",
      );
      await loadLeads();
    } catch (err) {
      setError(err.message || "Unable to save lead.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(lead) {
    const id = lead._id || lead.id;
    if (!id) {
      setError("This lead has no identifier.");
      return;
    }
    if (!window.confirm(`Delete "${lead.name}"? This cannot be undone.`))
      return;

    setError("");
    try {
      await request(`${API_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setLeads((prev) => prev.filter((item) => (item._id || item.id) !== id));
      setSelected((prev) => prev.filter((item) => item !== id));
      setNotice("Lead deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete lead.");
    }
  }

  async function deleteSelected() {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected leads?`)) return;

    setLoading(true);
    setError("");

    const results = await Promise.allSettled(
      selected.map((id) =>
        request(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" }),
      ),
    );

    const succeeded = selected.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failed = results.length - succeeded.length;

    setLeads((prev) =>
      prev.filter((lead) => !succeeded.includes(lead._id || lead.id)),
    );
    setSelected([]);
    setLoading(false);

    if (failed) {
      setError(
        `${succeeded.length} deleted; ${failed} failed. Refresh and check remaining leads.`,
      );
    } else {
      setNotice(`${succeeded.length} leads deleted successfully.`);
    }
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function exportCSV() {
    const columns = [
      ["ID", "id"],
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

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columns.map(([label]) => escapeCSV(label)).join(","),
      ...filtered.map((lead) =>
        columns
          .map(([label, key]) =>
            escapeCSV(key === "followUp" ? displayDate(lead[key]) : lead[key]),
          )
          .join(","),
      ),
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectPage = () => {
    const pageIds = visible.map((lead) => lead._id || lead.id);
    const allSelected =
      pageIds.length && pageIds.every((id) => selected.includes(id));

    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    );
  };

  const SortHeader = ({ field, children }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="font-semibold hover:text-indigo-600"
    >
      {children}{" "}
      {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : ""}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">Admin / Lead Management</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Admin Leads
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage leads, monitor opportunities, and follow up with clients.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadLeads}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
            >
              <FiDownload /> Export CSV
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FiPlus /> Add Lead
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span className="flex-1 break-words">{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <FiX />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
          >
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Leads"
            value={stats.total}
            description="All records"
            Icon={FiUsers}
            color="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label="New Today"
            value={stats.newToday}
            description="Created today"
            Icon={FiPlus}
            color="bg-sky-50 text-sky-600"
          />
          <StatCard
            label="Qualified"
            value={stats.qualified}
            description="Qualified opportunities"
            Icon={FiTarget}
            color="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Won Deals"
            value={stats.won}
            description="Converted leads"
            Icon={FiCheckCircle}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Open Pipeline"
            value={currency(stats.pipeline)}
            description={`${stats.overdue} overdue follow-up(s)`}
            Icon={FiDollarSign}
            color="bg-amber-50 text-amber-600"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">All Leads</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filtered.length} matching record(s)
                </p>
              </div>

              {selected.length > 0 && (
                <button
                  onClick={deleteSelected}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <FiTrash2 /> Delete selected ({selected.length})
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="relative sm:col-span-2 xl:col-span-2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => updateFilter(setSearch, e.target.value)}
                  placeholder="Search name, company, phone..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                value={vertical}
                onChange={(e) => updateFilter(setVertical, e.target.value)}
                className={inputClass}
              >
                <option>All Verticals</option>
                {VERTICALS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => updateFilter(setStatus, e.target.value)}
                className={inputClass}
              >
                <option>All Statuses</option>
                {STATUSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={owner}
                onChange={(e) => updateFilter(setOwner, e.target.value)}
                className={inputClass}
              >
                <option>All Owners</option>
                {owners.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <FiFilter className="text-slate-400" />
                {["All", "Overdue", "Scheduled", "Unscheduled"].map((item) => (
                  <button
                    key={item}
                    onClick={() => updateFilter(setFollowUpFilter, item)}
                    className={`rounded-lg px-3 py-2 font-medium ${
                      followUpFilter === item
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item === "All" ? "All Follow-ups" : item}
                  </button>
                ))}
              </div>
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <FiRefreshCw className="animate-spin text-indigo-600" size={28} />
              <p className="text-sm">Loading leads...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <FiUsers size={32} className="text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-900">
                No leads found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Add a lead or change your filters.
              </p>
              <button
                onClick={openCreate}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FiPlus className="mr-1 inline" /> Add Lead
              </button>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={
                            visible.length > 0 &&
                            visible.every((lead) =>
                              selected.includes(lead._id || lead.id),
                            )
                          }
                          onChange={selectPage}
                          aria-label="Select current page"
                        />
                      </th>
                      <th className="px-4 py-4">
                        <SortHeader field="name">Lead / Client</SortHeader>
                      </th>
                      <th className="px-4 py-4">Vertical</th>
                      <th className="px-4 py-4">Source</th>
                      <th className="px-4 py-4">
                        <SortHeader field="status">Status</SortHeader>
                      </th>
                      <th className="px-4 py-4">
                        <SortHeader field="value">Value</SortHeader>
                      </th>
                      <th className="px-4 py-4">
                        <SortHeader field="followUp">Next Follow-up</SortHeader>
                      </th>
                      <th className="px-4 py-4">Owner</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((lead) => {
                      const id = lead._id || lead.id;
                      const overdue = isOverdue(lead);

                      return (
                        <tr key={id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selected.includes(id)}
                              onChange={() =>
                                setSelected((prev) =>
                                  prev.includes(id)
                                    ? prev.filter((x) => x !== id)
                                    : [...prev, id],
                                )
                              }
                              aria-label={`Select ${lead.name}`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
                                {initials(lead.name) || "L"}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {lead.name || "Unnamed lead"}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {lead.company || "No company"}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {lead.phone}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              {lead.vertical || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {lead.source || "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[lead.status] || "bg-slate-100 text-slate-700"}`}
                            >
                              {lead.status || "New"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
                            {currency(lead.value)}
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className={`flex items-center gap-2 text-sm ${overdue ? "font-semibold text-rose-600" : "text-slate-600"}`}
                            >
                              <FiCalendar />
                              {displayDate(lead.followUp)}
                            </div>
                            {overdue && (
                              <p className="mt-1 text-xs text-rose-500">
                                Overdue
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {lead.owner || "Unassigned"}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {lead.phone && (
                                <>
                                  <a
                                    href={`tel:${lead.phone}`}
                                    title="Call lead"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                                  >
                                    <FiPhone size={16} />
                                  </a>
                                  <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href={`https://wa.me/${String(lead.phone)
                                      .replace(/\D/g, "")
                                      .replace(/^(\d{10})$/, "91$1")}`}
                                    title="WhatsApp lead"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-700"
                                  >
                                    <FiMessageCircle size={16} />
                                  </a>
                                </>
                              )}
                              <button
                                onClick={() => openEdit(lead)}
                                title="Edit lead"
                                className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteLead(lead)}
                                title="Delete lead"
                                className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filtered.length)} of{" "}
                    {filtered.length}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="px-2 text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-form-title"
            className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2
                  id="lead-form-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editing ? "Edit Lead" : "Create New Lead"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the lead details below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={saveLead} className="space-y-6 p-5 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}

              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Lead Name" required>
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateForm}
                      required
                      maxLength={120}
                      className={inputClass}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Company" required>
                    <input
                      name="company"
                      value={form.company}
                      onChange={updateForm}
                      required
                      maxLength={150}
                      className={inputClass}
                      placeholder="Company name"
                    />
                  </Field>
                  <Field label="Phone" required>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={updateForm}
                      required
                      maxLength={25}
                      className={inputClass}
                      placeholder="Phone number"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={updateForm}
                      maxLength={150}
                      className={inputClass}
                      placeholder="name@example.com"
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      name="location"
                      value={form.location}
                      onChange={updateForm}
                      className={inputClass}
                      placeholder="City / location"
                    />
                  </Field>
                  <Field label="Lead Owner">
                    <input
                      name="owner"
                      value={form.owner}
                      onChange={updateForm}
                      className={inputClass}
                      placeholder="Assigned person"
                    />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Lead Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Vertical" required>
                    <select
                      name="vertical"
                      value={form.vertical}
                      onChange={updateForm}
                      className={inputClass}
                    >
                      {VERTICALS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Source" required>
                    <select
                      name="source"
                      value={form.source}
                      onChange={updateForm}
                      className={inputClass}
                    >
                      {SOURCES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status" required>
                    <select
                      name="status"
                      value={form.status}
                      onChange={updateForm}
                      className={inputClass}
                    >
                      {STATUSES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Estimated Value (₹)">
                    <input
                      name="value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.value}
                      onChange={updateForm}
                      className={inputClass}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Next Follow-up">
                    <input
                      name="followUp"
                      type="date"
                      value={form.followUp}
                      onChange={updateForm}
                      className={inputClass}
                    />
                  </Field>
                  <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700">
                    <input
                      name="overdue"
                      type="checkbox"
                      checked={Boolean(form.overdue)}
                      onChange={updateForm}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Mark follow-up overdue
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? (
                    <FiRefreshCw className="animate-spin" />
                  ) : (
                    <FiCheckCircle />
                  )}
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Lead"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
