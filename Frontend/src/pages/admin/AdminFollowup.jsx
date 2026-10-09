import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle, FiCalendar, FiCheckCircle, FiClock, FiEdit2, FiHistory,
  FiMail, FiMessageCircle, FiPhone, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiUsers, FiX
} from "react-icons/fi";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
const FOLLOW_UPS_URL = `${API_BASE_URL}/admin/follow-ups`;
const LEADS_URL = `${API_BASE_URL}/admin/leads`;
const TYPES = ["Call", "Email", "Meeting", "WhatsApp", "Other"];
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const EMPTY_FORM = { leadId: "", scheduledAt: "", type: "Call", notes: "" };
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function toLocalDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function prettyDate(value) {
  if (!value) return "Not scheduled";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Invalid date" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function nameOf(lead) { return lead?.name || lead?.fullName || "Unknown lead"; }
function overdue(item) { return item.status === "Scheduled" && new Date(item.scheduledAt).getTime() < Date.now(); }
function ActivityIcon({ type }) {
  if (type === "Email") return <FiMail />;
  if (type === "WhatsApp") return <FiMessageCircle />;
  if (type === "Meeting") return <FiUsers />;
  return <FiPhone />;
}

export default function AdminFollowUps() {
  const [items, setItems] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [completeItem, setCompleteItem] = useState(null);
  const [completion, setCompletion] = useState({ outcome: "", nextFollowUpAt: "", updateLeadStatus: "" });
  const [historyLead, setHistoryLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const request = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Login token not found. Please log in again.");
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const result = await response.json().catch(() => null);
    if (response.status === 401) throw new Error(result?.message || "Session expired. Please log in again.");
    if (response.status === 403) throw new Error(result?.message || "Admin access is required.");
    if (!response.ok || result?.success === false) throw new Error(result?.message || `Request failed (${response.status})`);
    return result;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [followResult, leadResult] = await Promise.all([request(FOLLOW_UPS_URL), request(LEADS_URL)]);
      setItems(Array.isArray(followResult.data) ? followResult.data : []);
      setLeads(Array.isArray(leadResult.data) ? leadResult.data : Array.isArray(leadResult.leads) ? leadResult.leads : []);
    } catch (e) { setError(e.message || "Unable to load follow-ups."); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(timer); }, [notice]);

  const stats = useMemo(() => {
    const scheduled = items.filter((x) => x.status === "Scheduled");
    return {
      today: scheduled.filter((x) => new Date(x.scheduledAt).toDateString() === new Date().toDateString()).length,
      upcoming: scheduled.filter((x) => !overdue(x)).length,
      overdue: scheduled.filter(overdue).length,
      completed: items.filter((x) => x.status === "Completed").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const lead = item.lead || {};
      const isToday = item.status === "Scheduled" && new Date(item.scheduledAt).toDateString() === new Date().toDateString();
      const matchFilter = filter === "All" || (filter === "Today" && isToday) || (filter === "Upcoming" && item.status === "Scheduled" && !overdue(item)) || (filter === "Overdue" && overdue(item)) || (filter === "Completed" && item.status === "Completed");
      const matchSearch = !q || [nameOf(lead), lead.company, lead.phone, lead.email, item.notes, item.outcome, item.type].some((v) => String(v || "").toLowerCase().includes(q));
      return matchFilter && matchSearch;
    }).sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (b.status === "Completed" && a.status !== "Completed") return -1;
      return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    });
  }, [items, filter, search]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, scheduledAt: toLocalDateTime(Date.now() + 60 * 60 * 1000) });
    setError(""); setModalOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({ leadId: item.lead?._id || item.lead || "", scheduledAt: toLocalDateTime(item.scheduledAt), type: item.type || "Call", notes: item.notes || "" });
    setError(""); setModalOpen(true);
  }
  function updateForm(e) { setForm((old) => ({ ...old, [e.target.name]: e.target.value })); }

  async function saveFollowUp(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { scheduledAt: new Date(form.scheduledAt).toISOString(), type: form.type, notes: form.notes };
      let url = FOLLOW_UPS_URL; let method = "POST";
      if (editing) { url = `${FOLLOW_UPS_URL}/${editing._id}`; method = "PATCH"; }
      else payload.leadId = form.leadId;
      await request(url, { method, body: JSON.stringify(payload) });
      setModalOpen(false); setNotice(editing ? "Follow-up updated." : "Follow-up scheduled."); await loadData();
    } catch (e2) { setError(e2.message || "Unable to save follow-up."); }
    finally { setSaving(false); }
  }

  async function completeFollowUp(e) {
    e.preventDefault(); if (!completeItem) return; setSaving(true); setError("");
    try {
      await request(`${FOLLOW_UPS_URL}/${completeItem._id}/complete`, {
        method: "POST",
        body: JSON.stringify({ outcome: completion.outcome, nextFollowUpAt: completion.nextFollowUpAt ? new Date(completion.nextFollowUpAt).toISOString() : null, updateLeadStatus: completion.updateLeadStatus || undefined }),
      });
      setCompleteItem(null); setCompletion({ outcome: "", nextFollowUpAt: "", updateLeadStatus: "" }); setNotice("Follow-up marked completed."); await loadData();
    } catch (e2) { setError(e2.message || "Unable to complete follow-up."); }
    finally { setSaving(false); }
  }

  async function deleteFollowUp(item) {
    if (!window.confirm("Delete this scheduled follow-up? Completed history is protected.")) return;
    setError("");
    try { await request(`${FOLLOW_UPS_URL}/${item._id}`, { method: "DELETE" }); setNotice("Follow-up deleted."); await loadData(); }
    catch (e) { setError(e.message || "Unable to delete follow-up."); }
  }

  async function openHistory(lead) {
    if (!lead?._id) { setError("Lead database ID is missing."); return; }
    setHistoryLead(lead); setHistory([]); setHistoryLoading(true);
    try { const result = await request(`${FOLLOW_UPS_URL}/lead/${lead._id}/history`); setHistory(Array.isArray(result.data) ? result.data : []); }
    catch (e) { setError(e.message || "Unable to load history."); }
    finally { setHistoryLoading(false); }
  }

  const statCards = [
    ["Today's follow-ups", stats.today, FiCalendar, "bg-sky-50 text-sky-700"],
    ["Upcoming", stats.upcoming, FiClock, "bg-indigo-50 text-indigo-700"],
    ["Overdue", stats.overdue, FiAlertCircle, "bg-rose-50 text-rose-700"],
    ["Completed", stats.completed, FiCheckCircle, "bg-emerald-50 text-emerald-700"],
  ];

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm text-slate-500">Admin / CRM / Follow-ups</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Follow-up Center</h1><p className="mt-2 text-sm text-slate-500">Schedule activities, track outcomes, and keep a complete lead history.</p></div>
        <div className="flex gap-2"><button onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"><FiRefreshCw className={loading ? "animate-spin" : ""}/> Refresh</button><button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><FiPlus/> Schedule follow-up</button></div>
      </header>
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><FiAlertCircle className="mt-0.5 shrink-0"/><span className="flex-1 break-words">{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><FiX/></button></div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div><div className={`rounded-xl p-3 ${color}`}><Icon size={22}/></div></div></div>)}</section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div><h2 className="text-lg font-bold text-slate-900">Follow-up activity</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} matching record(s)</p></div><div className="relative w-full lg:max-w-sm"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className={`${inputClass} pl-10`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lead, company, notes..."/></div></div><div className="mt-4 flex flex-wrap gap-2">{["All", "Today", "Upcoming", "Overdue", "Completed"].map((v) => <button key={v} onClick={() => setFilter(v)} className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === v ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{v}</button>)}</div></div>
        {loading ? <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500"><FiRefreshCw className="animate-spin"/> Loading follow-ups...</div> : filtered.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center"><FiCalendar size={34} className="text-slate-300"/><h3 className="mt-3 font-semibold text-slate-900">No follow-ups found</h3><p className="mt-1 text-sm text-slate-500">Schedule a follow-up or choose another filter.</p><button onClick={openCreate} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><FiPlus className="mr-1 inline"/> Schedule follow-up</button></div> : <div className="divide-y divide-slate-100">{filtered.map((item) => {
          const lead = item.lead || {}; const late = overdue(item);
          const badge = item.status === "Completed" ? "bg-emerald-50 text-emerald-700" : item.status === "Cancelled" ? "bg-slate-100 text-slate-600" : late ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700";
          return <article key={item._id} className="p-4 transition hover:bg-slate-50 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex min-w-0 gap-3"><div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${late ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}><ActivityIcon type={item.type}/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{nameOf(lead)}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{late ? "Overdue" : item.status}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.type}</span></div><p className="mt-1 text-sm text-slate-600">{lead.company || "No company"}{lead.phone ? ` · ${lead.phone}` : ""}{lead.email ? ` · ${lead.email}` : ""}</p><p className={`mt-2 flex items-center gap-2 text-sm ${late ? "font-semibold text-rose-700" : "text-slate-600"}`}><FiCalendar/>{prettyDate(item.scheduledAt)}</p>{item.notes && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p>}{item.status === "Completed" && item.outcome && <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><strong>Outcome:</strong> {item.outcome}</p>}{item.completedAt && <p className="mt-2 text-xs text-slate-400">Completed {prettyDate(item.completedAt)}</p>}</div></div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">{lead.phone && <a href={`tel:${lead.phone}`} title="Call lead" className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-emerald-50"><FiPhone/></a>}{lead.email && <a href={`mailto:${lead.email}`} title="Email lead" className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-sky-50"><FiMail/></a>}{item.status === "Scheduled" && <><button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"><FiEdit2/> Edit</button><button onClick={() => { setCompleteItem(item); setCompletion({ outcome: "", nextFollowUpAt: "", updateLeadStatus: lead.status || "" }); setError(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><FiCheckCircle/> Complete</button><button onClick={() => deleteFollowUp(item)} title="Delete scheduled follow-up" className="rounded-lg border border-slate-200 p-2.5 text-rose-600 hover:bg-rose-50"><FiTrash2/></button></>}{lead._id && <button onClick={() => openHistory(lead)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"><FiHistory/> History</button>}</div></div></article>;
        })}</div>}
      </section>
    </div>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"><section role="dialog" aria-modal="true" className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-bold text-slate-900">{editing ? "Edit follow-up" : "Schedule follow-up"}</h2><p className="mt-1 text-sm text-slate-500">Activities are stored in the lead's follow-up history.</p></div><button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg p-2 hover:bg-slate-100"><FiX/></button></div><form onSubmit={saveFollowUp} className="space-y-4 p-5">{error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}{!editing && <label className="block text-sm font-medium text-slate-700">Lead *<select name="leadId" required value={form.leadId} onChange={updateForm} className={`${inputClass} mt-1.5`}><option value="">Select a lead</option>{leads.map((lead) => <option key={lead._id} value={lead._id}>{nameOf(lead)}{lead.company ? ` — ${lead.company}` : ""}</option>)}</select></label>}<div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Date and time *<input type="datetime-local" required name="scheduledAt" value={form.scheduledAt} onChange={updateForm} className={`${inputClass} mt-1.5`}/></label><label className="block text-sm font-medium text-slate-700">Activity type<select name="type" value={form.type} onChange={updateForm} className={`${inputClass} mt-1.5`}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label></div><label className="block text-sm font-medium text-slate-700">Notes<textarea rows={4} maxLength={5000} name="notes" value={form.notes} onChange={updateForm} className={`${inputClass} mt-1.5`} placeholder="Agenda, discussion points, or context..."/></label><div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <FiRefreshCw className="animate-spin"/> : <FiCalendar/>}{saving ? "Saving..." : editing ? "Save changes" : "Schedule follow-up"}</button></div></form></section></div>}

    {completeItem && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"><section role="dialog" aria-modal="true" className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-bold text-slate-900">Complete follow-up</h2><p className="mt-1 text-sm text-slate-500">{nameOf(completeItem.lead)} · {prettyDate(completeItem.scheduledAt)}</p></div><button onClick={() => setCompleteItem(null)} className="rounded-lg p-2 hover:bg-slate-100"><FiX/></button></div><form onSubmit={completeFollowUp} className="space-y-4 p-5"><label className="block text-sm font-medium text-slate-700">Outcome / call notes<textarea rows={4} maxLength={3000} value={completion.outcome} onChange={(e) => setCompletion((p) => ({ ...p, outcome: e.target.value }))} className={`${inputClass} mt-1.5`} placeholder="What happened? What did the client say?"/></label><label className="block text-sm font-medium text-slate-700">Update lead status (optional)<select value={completion.updateLeadStatus} onChange={(e) => setCompletion((p) => ({ ...p, updateLeadStatus: e.target.value }))} className={`${inputClass} mt-1.5`}><option value="">Keep current status</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Schedule next follow-up (optional)<input type="datetime-local" value={completion.nextFollowUpAt} onChange={(e) => setCompletion((p) => ({ ...p, nextFollowUpAt: e.target.value }))} className={`${inputClass} mt-1.5`}/></label><div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setCompleteItem(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <FiRefreshCw className="animate-spin"/> : <FiCheckCircle/>}{saving ? "Saving..." : "Mark completed"}</button></div></form></section></div>}

    {historyLead && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"><section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="text-lg font-bold text-slate-900">Follow-up history</h2><p className="mt-1 text-sm text-slate-500">{nameOf(historyLead)}{historyLead.company ? ` · ${historyLead.company}` : ""}</p></div><button onClick={() => setHistoryLead(null)} className="rounded-lg p-2 hover:bg-slate-100"><FiX/></button></div><div className="space-y-4 p-5">{historyLoading ? <p className="text-sm text-slate-500">Loading history...</p> : history.length === 0 ? <p className="text-sm text-slate-500">No follow-up history yet.</p> : history.map((item) => <div key={item._id} className="border-l-2 border-indigo-200 pl-4"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{item.type}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{item.status}</span></div><p className="mt-1 text-xs text-slate-500">Scheduled {prettyDate(item.scheduledAt)}{item.completedAt ? ` · Completed ${prettyDate(item.completedAt)}` : ""}</p>{item.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.notes}</p>}{item.outcome && <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-800"><strong>Outcome:</strong> {item.outcome}</p>}</div>)}</div></section></div>}
  </main>;
}
