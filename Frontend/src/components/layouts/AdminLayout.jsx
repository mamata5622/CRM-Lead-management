import React, { useEffect, useState } from "react";

// ======================================================
// API CONFIG
// ======================================================

const API_URL = `${import.meta.env.VITE_BASE_URL}/api/leads`;

// ======================================================
// EMPTY FORM
// ======================================================

const emptyLead = {
  id: "",
  name: "",
  company: "",
  phone: "",
  email: "",
  location: "",
  vertical: "",
  source: "",
  status: "New",
  value: "",
  followUp: "",
  owner: "",
  overdue: false,
  initials: "",
};

// ======================================================
// ADMIN LAYOUT
// ======================================================

export default function AdminLayout() {
  const [leads, setLeads] = useState([]);

  const [activePage, setActivePage] = useState("Dashboard");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingLead, setEditingLead] = useState(null);

  const [form, setForm] = useState(emptyLead);

  const [loading, setLoading] = useState(false);

  // ======================================================
  // GET ALL LEADS
  // ======================================================

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}`);

      const result = await response.json();

      if (result.success) {
        setLeads(result.data);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // FETCH ON PAGE LOAD
  // ======================================================

  useEffect(() => {
    fetchLeads();
  }, []);

  // ======================================================
  // HANDLE INPUT
  // ======================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ======================================================
  // OPEN ADD MODAL
  // ======================================================

  const openAddModal = () => {
    setEditingLead(null);

    setForm({
      ...emptyLead,
      id: getNextLeadId(),
    });

    setShowModal(true);
  };

  // ======================================================
  // GET NEXT ID
  // ======================================================

  const getNextLeadId = () => {
    if (!leads.length) {
      return 1;
    }

    const ids = leads
      .map((lead) => Number(lead.id))
      .filter((id) => !isNaN(id));

    return Math.max(...ids) + 1;
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
    setForm(emptyLead);
  };

  // ======================================================
  // CREATE / UPDATE LEAD
  // ======================================================

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const isEdit = Boolean(editingLead);

//       const url = isEdit
//         ? `${API_URL}/updateLead/${editingLead._id}`
//         : `${API_URL}/create`;

//       const method = isEdit ? "PUT" : "POST";

//       const payload = {
//         ...form,

//         id: Number(form.id),

//         value: Number(form.value),
//       };

//       const response = await fetch(url, {
//         method,

//         headers: {
//           "Content-Type": "application/json",
//         },

//         body: JSON.stringify(payload),
//       });

//       const result = await response.json();

//       if (!response.ok || !result.success) {
//         alert(result.message || "Something went wrong");
//         return;
//       }

//       alert(
//         isEdit
//           ? "Lead updated successfully"
//           : "Lead created successfully"
//       );

//       closeModal();

//       fetchLeads();
//     } catch (error) {
//       console.error("Submit error:", error);

//       alert("Something went wrong while saving the lead.");
//     }
//   };
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const isEdit = Boolean(editingLead);

    const url = isEdit
      ? `${API_URL}/${editingLead._id}`
      : `${API_URL}/create`;

    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...form,
      id: Number(form.id),
      value: Number(form.value),
    };

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Something went wrong");
      return;
    }

    alert(
      isEdit
        ? "Lead updated successfully"
        : "Lead created successfully"
    );

    closeModal();
    fetchLeads();

  } catch (error) {
    console.error("Submit error:", error);
    alert("Something went wrong while saving the lead.");
  }
};
  // ======================================================
  // EDIT LEAD
  // ======================================================

  const handleEdit = (lead) => {
    setEditingLead(lead);

    setForm({
      id: lead.id || "",

      name: lead.name || "",

      company: lead.company || "",

      phone: lead.phone || "",

      email: lead.email || "",

      location: lead.location || "",

      vertical: lead.vertical || "",

      source: lead.source || "",

      status: lead.status || "New",

      value: lead.value || "",

      followUp: lead.followUp
        ? new Date(lead.followUp).toISOString().split("T")[0]
        : "",

      owner: lead.owner || "",

      overdue: lead.overdue || false,

      initials: lead.initials || "",
    });

    setShowModal(true);
  };

  // ======================================================
  // DELETE LEAD
  // ======================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/delete/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Failed to delete lead");
        return;
      }

      alert("Lead deleted successfully");

      fetchLeads();
    } catch (error) {
      console.error("Delete error:", error);

      alert("Failed to delete lead.");
    }
  };

  // ======================================================
  // FILTER LEADS
  // ======================================================

  const filteredLeads = leads.filter((lead) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      lead.name?.toLowerCase().includes(searchValue) ||
      lead.company?.toLowerCase().includes(searchValue) ||
      lead.email?.toLowerCase().includes(searchValue) ||
      lead.phone?.toLowerCase().includes(searchValue) ||
      lead.location?.toLowerCase().includes(searchValue) ||
      lead.vertical?.toLowerCase().includes(searchValue) ||
      lead.owner?.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" ||
      lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ======================================================
  // STATISTICS
  // ======================================================

  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "Qualified"
  ).length;

  const wonLeads = leads.filter(
    (lead) => lead.status === "Won"
  ).length;

  const lostLeads = leads.filter(
    (lead) => lead.status === "Lost"
  ).length;

  const overdueLeads = leads.filter(
    (lead) => lead.overdue === true
  ).length;

  const totalValue = leads.reduce(
    (total, lead) =>
      total + Number(lead.value || 0),
    0
  );

  // ======================================================
  // STATUS COLOR
  // ======================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700";

      case "Contacted":
        return "bg-purple-100 text-purple-700";

      case "Qualified":
        return "bg-cyan-100 text-cyan-700";

      case "Proposal":
        return "bg-yellow-100 text-yellow-700";

      case "Negotiation":
        return "bg-orange-100 text-orange-700";

      case "Won":
        return "bg-green-100 text-green-700";

      case "Lost":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ======================================================
  // FORMAT CURRENCY
  // ======================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-950 text-white flex flex-col z-40">

        {/* LOGO */}

        <div className="px-6 py-6 border-b border-slate-800">

          <h1 className="text-2xl font-bold">
            Lead
            <span className="text-blue-500">
              Admin
            </span>
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Lead Management System
          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-6 space-y-2">

          {/* DASHBOARD */}

          <button
            onClick={() => setActivePage("Dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activePage === "Dashboard"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>📊</span>

            <span>Dashboard</span>
          </button>

          {/* LEADS */}

          <button
            onClick={() => setActivePage("Leads")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activePage === "Leads"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>👥</span>

            <span>Leads</span>
          </button>

          {/* ADD LEAD */}

          <button
            onClick={openAddModal}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          >
            <span>➕</span>

            <span>Add Lead</span>
          </button>

          {/* SETTINGS */}

          <button
            onClick={() => setActivePage("Settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activePage === "Settings"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>⚙️</span>

            <span>Settings</span>
          </button>

        </nav>

        {/* ADMIN */}

        <div className="p-5 border-t border-slate-800">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              A
            </div>

            <div>
              <p className="text-sm font-medium">
                Admin
              </p>

              <p className="text-xs text-slate-400">
                Administrator
              </p>
            </div>

          </div>

        </div>

      </aside>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="ml-64 min-h-screen">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="h-20 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-30">

          <div>

            <h2 className="text-xl font-semibold text-gray-800">
              {activePage}
            </h2>

            <p className="text-sm text-gray-500">
              Manage your leads and sales pipeline
            </p>

          </div>

          <div className="flex items-center gap-5">

            {/* SEARCH */}

            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">

              <span>🔍</span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search leads..."
                className="bg-transparent outline-none text-sm w-48"
              />

            </div>

            {/* NOTIFICATION */}

            <button className="relative text-xl">
              🔔

              {overdueLeads > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center">
                  {overdueLeads}
                </span>
              )}

            </button>

            {/* PROFILE */}

            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
              A
            </div>

          </div>

        </header>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <main className="p-8">

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          {activePage === "Dashboard" && (
            <>

              {/* STATISTICS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

                <StatCard
                  title="Total Leads"
                  value={totalLeads}
                  icon="👥"
                  description="All leads"
                />

                <StatCard
                  title="New Leads"
                  value={newLeads}
                  icon="🆕"
                  description="New enquiries"
                />

                <StatCard
                  title="Qualified"
                  value={qualifiedLeads}
                  icon="⭐"
                  description="Qualified leads"
                />

                <StatCard
                  title="Won"
                  value={wonLeads}
                  icon="🏆"
                  description="Successful leads"
                />

              </div>

              {/* SECOND ROW */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                <StatCard
                  title="Contacted"
                  value={contactedLeads}
                  icon="📞"
                  description="Contacted leads"
                />

                <StatCard
                  title="Lost"
                  value={lostLeads}
                  icon="❌"
                  description="Lost leads"
                />

                <StatCard
                  title="Overdue"
                  value={overdueLeads}
                  icon="⏰"
                  description="Follow-ups overdue"
                />

              </div>

              {/* PIPELINE VALUE */}

              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Total Pipeline Value
                    </p>

                    <h2 className="text-3xl font-bold text-gray-800 mt-2">
                      {formatCurrency(totalValue)}
                    </h2>

                  </div>

                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                    💰
                  </div>

                </div>

              </div>

              {/* LEADS TABLE */}

              <LeadTable
                leads={filteredLeads}
                loading={loading}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                getStatusClass={getStatusClass}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                openAddModal={openAddModal}
              />

            </>
          )}

          {/* ==================================================
              LEADS PAGE
          ================================================== */}

          {activePage === "Leads" && (
            <LeadTable
              leads={filteredLeads}
              loading={loading}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              getStatusClass={getStatusClass}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              openAddModal={openAddModal}
            />
          )}

          {/* ==================================================
              SETTINGS
          ================================================== */}

          {activePage === "Settings" && (
            <div className="bg-white rounded-xl shadow-sm p-8">

              <h2 className="text-xl font-semibold text-gray-800">
                Settings
              </h2>

              <p className="text-gray-500 mt-2">
                Admin settings can be added here.
              </p>

            </div>
          )}

        </main>

      </div>

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-xl font-semibold text-gray-800">
                  {editingLead
                    ? "Edit Lead"
                    : "Add New Lead"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingLead
                    ? "Update lead information"
                    : "Create a new lead"}
                </p>

              </div>

              <button
                onClick={closeModal}
                className="text-2xl text-gray-400 hover:text-gray-800"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <FormInput
                  label="Lead ID"
                  name="id"
                  type="number"
                  value={form.id}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Vertical"
                  name="vertical"
                  value={form.vertical}
                  onChange={handleChange}
                  placeholder="e.g. Real Estate"
                  required
                />

                <FormInput
                  label="Source"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="e.g. Website"
                  required
                />

                {/* STATUS */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">
                      New
                    </option>

                    <option value="Contacted">
                      Contacted
                    </option>

                    <option value="Qualified">
                      Qualified
                    </option>

                    <option value="Proposal">
                      Proposal
                    </option>

                    <option value="Negotiation">
                      Negotiation
                    </option>

                    <option value="Won">
                      Won
                    </option>

                    <option value="Lost">
                      Lost
                    </option>

                  </select>

                </div>

                <FormInput
                  label="Value"
                  name="value"
                  type="number"
                  value={form.value}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Follow Up"
                  name="followUp"
                  type="date"
                  value={form.followUp}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Owner"
                  name="owner"
                  value={form.owner}
                  onChange={handleChange}
                  required
                />

                <FormInput
                  label="Initials"
                  name="initials"
                  value={form.initials}
                  onChange={handleChange}
                  placeholder="e.g. AM"
                  required
                />

              </div>

              {/* OVERDUE */}

              <div className="mt-5">

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    name="overdue"
                    checked={form.overdue}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />

                  <span className="text-sm text-gray-700">
                    Mark this lead as overdue
                  </span>

                </label>

              </div>

              {/* ACTION BUTTONS */}

              <div className="flex justify-end gap-3 mt-8">

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingLead
                    ? "Update Lead"
                    : "Create Lead"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

// ======================================================
// STAT CARD COMPONENT
// ======================================================

function StatCard({
  title,
  value,
  icon,
  description,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3 className="text-2xl font-bold text-gray-800 mt-2">
            {value}
          </h3>

          <p className="text-xs text-gray-400 mt-1">
            {description}
          </p>

        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

// ======================================================
// FORM INPUT
// ======================================================

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

    </div>
  );
}

// ======================================================
// LEAD TABLE
// ======================================================

function LeadTable({
  leads,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  getStatusClass,
  formatCurrency,
  formatDate,
  handleEdit,
  handleDelete,
  openAddModal,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">

      {/* TABLE HEADER */}

      <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <h2 className="text-lg font-semibold text-gray-800">
            Lead Management
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            View and manage all leads
          </p>

        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          {/* SEARCH */}

          <div className="flex items-center border rounded-lg px-3 py-2">

            <span className="mr-2">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search..."
              className="outline-none text-sm w-48"
            />

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="border rounded-lg px-3 py-2 text-sm outline-none"
          >

            <option value="All">
              All Status
            </option>

            <option value="New">
              New
            </option>

            <option value="Contacted">
              Contacted
            </option>

            <option value="Qualified">
              Qualified
            </option>

            <option value="Proposal">
              Proposal
            </option>

            <option value="Negotiation">
              Negotiation
            </option>

            <option value="Won">
              Won
            </option>

            <option value="Lost">
              Lost
            </option>

          </select>

          {/* ADD */}

          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Lead
          </button>

        </div>

      </div>

      {/* TABLE */}

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-50">

            <tr>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                ID
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Lead
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Company
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Phone
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Location
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Vertical
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Source
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Status
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Value
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Follow Up
              </th>

              <th className="text-left px-5 py-4 font-semibold text-gray-600">
                Owner
              </th>

              <th className="text-center px-5 py-4 font-semibold text-gray-600">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr>

                <td
                  colSpan="12"
                  className="text-center py-12 text-gray-500"
                >
                  Loading leads...
                </td>

              </tr>
            ) : leads.length === 0 ? (
              <tr>

                <td
                  colSpan="12"
                  className="text-center py-12"
                >

                  <div className="text-4xl mb-3">
                    📭
                  </div>

                  <p className="text-gray-600 font-medium">
                    No leads found
                  </p>

                  <p className="text-gray-400 text-sm mt-1">
                    Try changing your search or filter.
                  </p>

                </td>

              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead._id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  {/* ID */}

                  <td className="px-5 py-4 font-medium text-gray-700">
                    #{lead.id}
                  </td>

                  {/* LEAD */}

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3 min-w-[210px]">

                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0">

                        {lead.initials ||
                          lead.name
                            ?.substring(0, 2)
                            .toUpperCase()}

                      </div>

                      <div>

                        <p className="font-medium text-gray-800">
                          {lead.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {lead.email}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* COMPANY */}

                  <td className="px-5 py-4 whitespace-nowrap">
                    {lead.company}
                  </td>

                  {/* PHONE */}

                  <td className="px-5 py-4 whitespace-nowrap">
                    {lead.phone}
                  </td>

                  {/* LOCATION */}

                  <td className="px-5 py-4 whitespace-nowrap">
                    {lead.location}
                  </td>

                  {/* VERTICAL */}

                  <td className="px-5 py-4 whitespace-nowrap">
                    {lead.vertical}
                  </td>

                  {/* SOURCE */}

                  <td className="px-5 py-4 whitespace-nowrap">
                    {lead.source}
                  </td>

                  {/* STATUS */}

                  <td className="px-5 py-4">

                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusClass(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>

                  </td>

                  {/* VALUE */}

                  <td className="px-5 py-4 font-medium whitespace-nowrap">
                    {formatCurrency(lead.value)}
                  </td>

                  {/* FOLLOW UP */}

                  <td className="px-5 py-4 whitespace-nowrap">

                    <p>
                      {formatDate(lead.followUp)}
                    </p>

                    {lead.overdue && (
                      <span className="text-xs text-red-500 font-medium">
                        Overdue
                      </span>
                    )}

                  </td>

                  {/* OWNER */}

                  <td className="px-5 py-4 whitespace-nowrap">
                    {lead.owner}
                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4">

                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() =>
                          handleEdit(lead)
                        }
                        className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(lead._id)
                        }
                        className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium"
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* TABLE FOOTER */}

      <div className="px-5 py-4 border-t text-sm text-gray-500">

        Showing{" "}
        <span className="font-medium text-gray-700">
          {leads.length}
        </span>{" "}
        lead{leads.length !== 1 ? "s" : ""}

      </div>

    </div>
  );
}