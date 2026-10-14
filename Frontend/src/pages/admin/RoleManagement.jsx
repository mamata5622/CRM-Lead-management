import React, { useCallback, useEffect, useState } from "react";

import axios from "axios";

import { toast } from "react-toastify";

import {
  FiShield,
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiUserCheck,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBriefcase,
  FiPlus,
  FiClipboard,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
} from "react-icons/fi";

const API_URL = `${import.meta.env.VITE_BASE_URL}/admin/users`;

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const ROLE_OPTIONS = [
  { value: "user", label: "User" },

  { value: "employee", label: "Employee" },

  { value: "admin", label: "Admin" },
];

const ROLE_STYLES = {
  user: "bg-slate-100 text-slate-700 ring-slate-200",

  employee: "bg-emerald-50 text-emerald-700 ring-emerald-200",

  admin: "bg-purple-50 text-purple-700 ring-purple-200",
};

const WORK_STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",

  "In Progress": "bg-blue-50 text-blue-700",

  Completed: "bg-emerald-50 text-emerald-700",

  Cancelled: "bg-red-50 text-red-700",
};

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const PRIORITY_STYLES = {
  Low: "bg-slate-100 text-slate-600",

  Medium: "bg-blue-50 text-blue-700",

  High: "bg-orange-50 text-orange-700",

  Urgent: "bg-red-50 text-red-700",
};

const PERMISSION_GROUPS = [
  {
    key: "leads",
    label: "Leads",
    actions: ["view", "create", "edit", "updateStatus", "delete"],
  },
  {
    key: "followUps",
    label: "Follow-ups",
    actions: ["view", "create", "edit", "complete", "delete"],
  },
  {
    key: "pipeline",
    label: "Deals Pipeline",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "callLogs",
    label: "Call Logs",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "communications",
    label: "Communications",
    actions: ["view", "create", "edit", "delete"],
  },
];

const makePermissionDraft = (permissions = {}) =>
  Object.fromEntries(
    PERMISSION_GROUPS.map(({ key, actions }) => [
      key,
      Object.fromEntries(
        actions.map((action) => [
          action,
          permissions?.[key]?.[action] === true,
        ]),
      ),
    ]),
  );

const formatPermissionLabel = (action) =>
  ({
    view: "View",
    create: "Create",
    edit: "Edit",
    updateStatus: "Update Status",
    complete: "Complete",
    delete: "Delete",
  })[action] || action;

const initialWorkForm = {
  employeeId: "",

  title: "",

  description: "",

  priority: "Medium",

  dueDate: "",
};

const RoleManagement = () => {
  // User and role management

  const [users, setUsers] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,

    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState("");

  const [pendingRoles, setPendingRoles] = useState({});

  // Employee module permissions
  const [permissionEmployeeId, setPermissionEmployeeId] = useState("");
  const [permissionDraft, setPermissionDraft] = useState(makePermissionDraft());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const selectedPermissionEmployee = employees.find(
    (employee) => employee._id === permissionEmployeeId,
  );

  // Work assignment management

  const [assignments, setAssignments] = useState([]);

  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [assigning, setAssigning] = useState(false);

  const [updatingAssignmentId, setUpdatingAssignmentId] = useState("");

  const [workForm, setWorkForm] = useState(initialWorkForm);

  const [workFilters, setWorkFilters] = useState({
    employeeId: "",

    status: "",
  });

  // Fetch users

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await axios.get(API_URL, {
        ...getAuthConfig(),

        params: {
          search: search.trim(),

          role: roleFilter,

          page,

          limit: 10,
        },
      });

      const fetchedUsers = data.users || [];

      setUsers(fetchedUsers);

      setPagination(data.pagination || { total: 0, totalPages: 1 });

      setPendingRoles(
        Object.fromEntries(
          fetchedUsers.map((user) => [user._id, user.role || "user"]),
        ),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load users. Please check your login.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  // Fetch employees for the assignment dropdown

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/employees`, {
        ...getAuthConfig(),

        params: { page: 1, limit: 100 },
      });

      setEmployees(data.employees || []);

      if (!workForm.employeeId && data.employees?.length) {
        setWorkForm((previous) => ({
          ...previous,

          employeeId: data.employees[0]._id,
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load employees.");
    }
  }, [workForm.employeeId]);

  // Fetch assigned work

  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);

    try {
      const params = {
        page: 1,

        limit: 100,
      };

      if (workFilters.employeeId) {
        params.employeeId = workFilters.employeeId;
      }

      if (workFilters.status) {
        params.status = workFilters.status;
      }

      const { data } = await axios.get(
        `${API_URL}/work-assignments`,

        {
          ...getAuthConfig(),

          params,
        },
      );

      setAssignments(
        data.assignments || data.workAssignments || data.data || [],
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load work assignments.",
      );
    } finally {
      setAssignmentsLoading(false);
    }
  }, [workFilters.employeeId, workFilters.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Change user role

  const handleRoleChange = async (user) => {
    const newRole = pendingRoles[user._id];

    if (!newRole || newRole === user.role) return;

    if (user.role === "admin" || newRole === "admin") {
      toast.warning("Admin role changes are disabled here for security.");

      setPendingRoles((previous) => ({
        ...previous,

        [user._id]: user.role,
      }));

      return;
    }

    const confirmed = window.confirm(
      `Change ${user.name || user.email}'s role from "${user.role}" to "${newRole}"?`,
    );

    if (!confirmed) {
      setPendingRoles((previous) => ({
        ...previous,

        [user._id]: user.role,
      }));

      return;
    }

    setUpdatingId(user._id);

    try {
      const { data } = await axios.patch(
        `${API_URL}/${user._id}/role`,

        { role: newRole },

        getAuthConfig(),
      );

      toast.success(data.message || "User role updated.");

      await fetchUsers();

      await fetchEmployees();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update user role.",
      );

      setPendingRoles((previous) => ({
        ...previous,

        [user._id]: user.role,
      }));
    } finally {
      setUpdatingId("");
    }
  };

  // Create work assignment

  const handleAssignWork = async (event) => {
    event.preventDefault();

    if (!workForm.employeeId) {
      toast.error("Please select an employee.");

      return;
    }

    if (!workForm.title.trim()) {
      toast.error("Work title is required.");

      return;
    }

    if (!workForm.dueDate) {
      toast.error("Please select a due date.");

      return;
    }

    setAssigning(true);

    try {
      const payload = {
        employeeId: workForm.employeeId,

        title: workForm.title.trim(),

        description: workForm.description.trim(),

        priority: workForm.priority,

        dueDate: new Date(workForm.dueDate).toISOString(),
      };

      const { data } = await axios.post(
        `${API_URL}/assign-work`,

        payload,

        getAuthConfig(),
      );

      toast.success(data.message || "Work assigned successfully.");

      setWorkForm((previous) => ({
        ...initialWorkForm,

        employeeId: previous.employeeId,
      }));

      await fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to assign work.");
    } finally {
      setAssigning(false);
    }
  };

  // Update assignment status

  const handleWorkStatusChange = async (assignment, newStatus) => {
    const assignmentId = assignment._id;

    if (!assignmentId || !newStatus) {
      toast.error("Invalid work assignment.");

      return;
    }

    if (newStatus === assignment.status) return;

    setUpdatingAssignmentId(assignmentId);

    try {
      const { data } = await axios.patch(
        `${API_URL}/work-assignments/${assignmentId}/status`,

        { status: newStatus },

        getAuthConfig(),
      );

      toast.success(data.message || "Work status updated.");

      await fetchAssignments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update work status.",
      );
    } finally {
      setUpdatingAssignmentId("");
    }
  };

  const selectPermissionEmployee = (employeeId) => {
    setPermissionEmployeeId(employeeId);
    const employee = employees.find((item) => item._id === employeeId);
    setPermissionDraft(makePermissionDraft(employee?.permissions || {}));
  };

  const togglePermission = (module, action, enabled) => {
    setPermissionDraft((previous) => ({
      ...previous,
      [module]: { ...previous[module], [action]: enabled },
    }));
  };

  const togglePermissionModule = (group, enabled) => {
    setPermissionDraft((previous) => ({
      ...previous,
      [group.key]: Object.fromEntries(
        group.actions.map((action) => [action, enabled]),
      ),
    }));
  };

  const saveEmployeePermissions = async () => {
    if (!permissionEmployeeId) {
      toast.error("Please select an employee.");
      return;
    }
    setSavingPermissions(true);
    try {
      const { data } = await axios.patch(
        `${API_URL}/${permissionEmployeeId}/permissions`,
        { permissions: permissionDraft },
        getAuthConfig(),
      );
      toast.success(
        data.message || "Employee permissions updated successfully.",
      );
      await fetchEmployees();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update employee permissions.",
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  const totalEmployees = users.filter(
    (user) => user.role === "employee",
  ).length;

  const totalRegularUsers = users.filter((user) => user.role === "user").length;

  const totalAdmins = users.filter((user) => user.role === "admin").length;

  const completedCount = assignments.filter(
    (assignment) => assignment.status === "Completed",
  ).length;

  const pendingCount = assignments.filter(
    (assignment) => assignment.status === "Pending",
  ).length;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page heading */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
            <FiShield size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Role Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage users, employee roles, and assigned work.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchUsers();

            fetchEmployees();

            fetchAssignments();
          }}
          disabled={loading || assignmentsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
        >
          <FiRefreshCw
            className={loading || assignmentsLoading ? "animate-spin" : ""}
          />
          Refresh All
        </button>
      </div>

      {/* User summary cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Regular Users"
          count={totalRegularUsers}
          icon={<FiUsers size={20} />}
          color="slate"
        />

        <SummaryCard
          title="Employees"
          count={totalEmployees}
          icon={<FiUserCheck size={20} />}
          color="emerald"
        />

        <SummaryCard
          title="Admins"
          count={totalAdmins}
          icon={<FiShield size={20} />}
          color="purple"
        />
      </div>

      {/* User search and filter */}

      <section
        id="user-management"
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            User & Role Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search registered accounts and change eligible user roles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <FiSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);

                setPage(1);
              }}
              placeholder="Search users by name or email..."
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);

              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All roles</option>

            <option value="user">Regular users</option>

            <option value="employee">Employees</option>

            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">User</th>

                <th className="px-5 py-4">Contact</th>

                <th className="px-5 py-4">Current Role</th>

                <th className="px-5 py-4">Change Role</th>

                <th className="px-5 py-4">Account</th>

                <th className="px-5 py-4">Joined</th>

                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <FiUsers
                      size={30}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-medium text-slate-700">No users found</p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try another search or role filter.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isProtected = user.role === "admin";

                  const isUpdating = updatingId === user._id;

                  const selectedRole =
                    pendingRoles[user._id] || user.role || "user";

                  return (
                    <tr
                      key={user._id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700">
                            {(user.name || user.email || "U")

                              .charAt(0)

                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {user.name || "Unnamed user"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID: {user._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <FiMail className="shrink-0 text-slate-400" />

                          {user.email || "—"}
                        </p>

                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <FiPhone className="shrink-0 text-slate-400" />

                          {user.phone || "Not provided"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                            ROLE_STYLES[user.role] || ROLE_STYLES.user
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={selectedRole}
                          disabled={isProtected || isUpdating}
                          onChange={(event) =>
                            setPendingRoles((previous) => ({
                              ...previous,

                              [user._id]: event.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        {isProtected && (
                          <p className="mt-1 text-xs text-slate-400">
                            Protected account
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <FiCalendar className="text-slate-400" />

                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleRoleChange(user)}
                          disabled={
                            isProtected ||
                            isUpdating ||
                            selectedRole === user.role
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {isUpdating ? "Saving..." : "Save Role"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            {pagination.total} matching accounts · Page {page} of{" "}
            {Math.max(1, pagination.totalPages)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              <FiChevronLeft />
              Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= Math.max(1, pagination.totalPages) || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* Employee module permissions */}
      <section
        id="employee-permissions"
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Employee Module Permissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose which modules and actions each employee can access.
            </p>
          </div>
          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            Access Control
          </span>
        </div>

        <div className="max-w-xl">
          <label
            htmlFor="permissionEmployee"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Select Employee
          </label>
          <select
            id="permissionEmployee"
            value={permissionEmployeeId}
            onChange={(event) => selectPermissionEmployee(event.target.value)}
            className={inputClass}
          >
            <option value="">Choose an employee</option>
            {employees
              .filter((employee) => employee.role === "employee")
              .map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name || employee.email}
                  {employee.email ? ` (${employee.email})` : ""}
                </option>
              ))}
          </select>
        </div>

        {!permissionEmployeeId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <FiShield size={30} className="mx-auto mb-3 text-indigo-500" />
            <p className="font-semibold text-slate-800">No employee selected</p>
            <p className="mt-1 text-sm text-slate-500">
              Choose an employee above to configure permissions.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                {(selectedPermissionEmployee?.name || "E")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {selectedPermissionEmployee?.name || "Employee"}
                </p>
                <p className="break-all text-sm text-slate-600">
                  {selectedPermissionEmployee?.email || ""}
                </p>
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-indigo-700 sm:ml-auto">
                {selectedPermissionEmployee?.role || "employee"}
              </span>
            </div>

            <div className="space-y-4">
              {PERMISSION_GROUPS.map((group) => {
                const enabledCount = group.actions.filter(
                  (action) => permissionDraft[group.key]?.[action] === true,
                ).length;
                return (
                  <div
                    key={group.key}
                    className="overflow-hidden rounded-xl border border-slate-200"
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {group.label}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {enabledCount} of {group.actions.length} permissions
                          enabled
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePermissionModule(group, true)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Enable all
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePermissionModule(group, false)}
                          className="text-xs font-semibold text-slate-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.actions.map((action) => (
                        <label
                          key={action}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/50"
                        >
                          <input
                            type="checkbox"
                            checked={
                              permissionDraft[group.key]?.[action] === true
                            }
                            onChange={(event) =>
                              togglePermission(
                                group.key,
                                action,
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {formatPermissionLabel(action)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Changes apply to{" "}
                <span className="font-semibold text-slate-700">
                  {selectedPermissionEmployee?.name || "the selected employee"}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={saveEmployeePermissions}
                disabled={savingPermissions}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPermissions ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Work assignment form */}

      <section
        id="assign-work"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
            <FiPlus size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Assign Work to Employee
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create and assign a task directly from role management.
            </p>
          </div>
        </div>

        <form onSubmit={handleAssignWork} className="space-y-5 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="workEmployee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Select Employee *
              </label>

              <select
                id="workEmployee"
                value={workForm.employeeId}
                onChange={(event) =>
                  setWorkForm((previous) => ({
                    ...previous,

                    employeeId: event.target.value,
                  }))
                }
                required
                className={inputClass}
              >
                <option value="">Choose an employee</option>

                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name || employee.email}

                    {employee.email && employee.name
                      ? ` (${employee.email})`
                      : ""}
                  </option>
                ))}
              </select>

              {employees.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No employees found. Promote a regular user to employee first.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="workTitle"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Work Title *
              </label>

              <input
                id="workTitle"
                value={workForm.title}
                onChange={(event) =>
                  setWorkForm((previous) => ({
                    ...previous,

                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Contact new real estate leads"
                required
                maxLength={200}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="workPriority"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Priority
              </label>

              <select
                id="workPriority"
                value={workForm.priority}
                onChange={(event) =>
                  setWorkForm((previous) => ({
                    ...previous,

                    priority: event.target.value,
                  }))
                }
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
              <label
                htmlFor="workDueDate"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Due Date *
              </label>

              <input
                id="workDueDate"
                type="date"
                value={workForm.dueDate}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(event) =>
                  setWorkForm((previous) => ({
                    ...previous,

                    dueDate: event.target.value,
                  }))
                }
                required
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="workDescription"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="workDescription"
                value={workForm.description}
                onChange={(event) =>
                  setWorkForm((previous) => ({
                    ...previous,

                    description: event.target.value,
                  }))
                }
                placeholder="Describe the task, requirements, and expected outcome..."
                rows={4}
                maxLength={5000}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={assigning || employees.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPlus />

              {assigning ? "Assigning Work..." : "Assign Work"}
            </button>
          </div>
        </form>
      </section>

      {/* Assignment summary */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Displayed Assignments"
          count={assignments.length}
          icon={<FiClipboard size={20} />}
          color="slate"
        />

        <SummaryCard
          title="Pending Work"
          count={pendingCount}
          icon={<FiClock size={20} />}
          color="purple"
        />

        <SummaryCard
          title="Completed Work"
          count={completedCount}
          icon={<FiCheckCircle size={20} />}
          color="emerald"
        />
      </div>

      {/* View and update assignments */}

      <section
        id="assigned-work"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FiBriefcase className="text-indigo-600" />
              Assigned Work
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review employee tasks and update their progress.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAssignments}
            disabled={assignmentsLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={assignmentsLoading ? "animate-spin" : ""} />
            Refresh Work
          </button>
        </div>

        {/* Assignment filters */}

        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="filterEmployee"
              className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <FiFilter />
              Filter by employee
            </label>

            <select
              id="filterEmployee"
              value={workFilters.employeeId}
              onChange={(event) =>
                setWorkFilters((previous) => ({
                  ...previous,

                  employeeId: event.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="">All employees</option>

              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name || employee.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filterWorkStatus"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Filter by status
            </label>

            <select
              id="filterWorkStatus"
              value={workFilters.status}
              onChange={(event) =>
                setWorkFilters((previous) => ({
                  ...previous,

                  status: event.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="">All statuses</option>

              {WORK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {assignmentsLoading ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Loading assigned work...
          </div>
        ) : assignments.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FiClipboard size={34} className="mx-auto mb-3 text-slate-300" />

            <p className="font-semibold text-slate-700">
              No work assignments found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Assign work above or change your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Task</th>

                  <th className="px-5 py-4">Employee</th>

                  <th className="px-5 py-4">Priority</th>

                  <th className="px-5 py-4">Due Date</th>

                  <th className="px-5 py-4">Current Status</th>

                  <th className="px-5 py-4">Update Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => {
                  const employee =
                    assignment.employee &&
                    typeof assignment.employee === "object"
                      ? assignment.employee
                      : null;

                  const status = assignment.status || "Pending";

                  const isUpdating = updatingAssignmentId === assignment._id;

                  const dueDate = assignment.dueDate
                    ? new Date(assignment.dueDate)
                    : null;

                  const isOverdue =
                    dueDate &&
                    !Number.isNaN(dueDate.getTime()) &&
                    dueDate < new Date() &&
                    !["Completed", "Cancelled"].includes(status);

                  return (
                    <tr
                      key={assignment._id}
                      className="align-top transition hover:bg-slate-50/70"
                    >
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {assignment.title || "Untitled task"}
                        </p>

                        <p className="mt-1 whitespace-normal break-words text-sm text-slate-500">
                          {assignment.description || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {employee?.name || "Employee"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {employee?.email || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            PRIORITY_STYLES[assignment.priority] ||
                            PRIORITY_STYLES.Medium
                          }`}
                        >
                          {assignment.priority || "Medium"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p
                          className={`text-sm font-medium ${
                            isOverdue ? "text-red-600" : "text-slate-600"
                          }`}
                        >
                          {dueDate && !Number.isNaN(dueDate.getTime())
                            ? dueDate.toLocaleDateString()
                            : "—"}
                        </p>

                        {isOverdue && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            Overdue
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                            STATUS_STYLES[status] || STATUS_STYLES.Pending
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          aria-label={`Update status for ${assignment.title}`}
                          value={status}
                          disabled={isUpdating}
                          onChange={(event) =>
                            handleWorkStatusChange(
                              assignment,

                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                        >
                          {WORK_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        {isUpdating && (
                          <p className="mt-1 text-xs text-slate-400">
                            Updating...
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing up to 100 assignments per filter selection.
        </div>
      </section>
    </div>
  );
};

const SummaryCard = ({ title, count, icon, color }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-700",

    emerald: "bg-emerald-50 text-emerald-700",

    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className={`rounded-lg p-2.5 ${colors[color]}`}>{icon}</div>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-800">{count}</p>
    </div>
  );
};

export default RoleManagement;
