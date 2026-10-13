
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

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
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

      setUsers(data.users || []);
      setPagination(
        data.pagination || { total: 0, totalPages: 1 }
      );

      setPendingRoles(
        Object.fromEntries(
          (data.users || []).map((user) => [
            user._id,
            user.role || "user",
          ])
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load users. Please check your login."
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user) => {
    const newRole = pendingRoles[user._id];

    if (!newRole || newRole === user.role) return;

    if (user.role === "admin" || newRole === "admin") {
      toast.warning(
        "Admin role changes are disabled here for security."
      );
      setPendingRoles((previous) => ({
        ...previous,
        [user._id]: user.role,
      }));
      return;
    }

    const confirmed = window.confirm(
      `Change ${user.name || user.email}'s role from "${user.role}" to "${newRole}"?`
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
        getAuthConfig()
      );

      toast.success(data.message || "User role updated.");

      // Refresh the list because changing a role may remove
      // the user from the currently selected role filter.
      await fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update user role."
      );

      setPendingRoles((previous) => ({
        ...previous,
        [user._id]: user.role,
      }));
    } finally {
      setUpdatingId("");
    }
  };

  const totalEmployees = users.filter(
    (user) => user.role === "employee"
  ).length;

  const totalRegularUsers = users.filter(
    (user) => user.role === "user"
  ).length;

  const totalAdmins = users.filter(
    (user) => user.role === "admin"
  ).length;

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
              Manage users, employees, and access roles.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards: counts represent the current result page */}
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

      {/* Search and role filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All roles</option>
            <option value="user">Regular users</option>
            <option value="employee">Employees</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* User table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-800">
              Registered Users
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination.total} matching account
              {pagination.total === 1 ? "" : "s"}
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Only administrators can update roles.
          </span>
        </div>

        <div className="overflow-x-auto">
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
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center"
                  >
                    <FiUsers
                      size={30}
                      className="mx-auto mb-3 text-slate-300"
                    />
                    <p className="font-medium text-slate-700">
                      No users found
                    </p>
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
                            <option
                              key={option.value}
                              value={option.value}
                            >
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
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString()
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

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Page {page} of {Math.max(1, pagination.totalPages)}
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
              disabled={
                page >= Math.max(1, pagination.totalPages) ||
                loading
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
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
        <div className={`rounded-lg p-2.5 ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-800">
        {count}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        On the current result page
      </p>
    </div>
  );
};

export default RoleManagement;
