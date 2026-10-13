import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FiSettings,
  FiBell,
  FiLock,
  FiUser,
  FiMail,
  FiShield,
  FiSave,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiMonitor,
  FiCheckCircle,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const DEFAULT_PREFERENCES = {
  emailNotifications: true,
  followUpReminders: true,
  taskNotifications: true,
  announcementNotifications: true,
  weeklySummary: false,
};

const Settings = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("preferences");
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "employee",
  });

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const loadSettings = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      let storedUser = {};

      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        storedUser = {};
      }

      setUser({
        name: storedUser.name || "",
        email: storedUser.email || "",
        role: storedUser.role || "employee",
      });

      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/employee/settings`,
          authConfig,
        );

        const settings = data.settings || data.preferences || {};

        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...settings,
        });

        if (data.user) {
          setUser((previous) => ({
            ...previous,
            ...data.user,
          }));
        }
      } catch (error) {
        // Keep defaults if settings have not been implemented yet.
        if (error.response?.status !== 404) {
          toast.error(
            error.response?.data?.message || "Unable to load saved settings.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [navigate, token]);

  const handlePreferenceChange = (name) => {
    setPreferences((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setSavingPreferences(true);

    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/employee/settings`,
        { preferences },
        authConfig,
      );

      if (data.settings || data.preferences) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...(data.settings || data.preferences),
        });
      }

      toast.success(data.message || "Notification preferences saved.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to save settings. Check the backend endpoint.",
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("Your new password must differ from the current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/employee/settings/password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        authConfig,
      );

      toast.success(data.message || "Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to change password. Check your current password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const tabs = [
    { id: "preferences", label: "Preferences", icon: FiBell },
    { id: "security", label: "Security", icon: FiLock },
    { id: "account", label: "Account", icon: FiUser },
  ];

  const preferenceItems = [
    {
      key: "emailNotifications",
      title: "Email notifications",
      description: "Receive important updates through email.",
    },
    {
      key: "followUpReminders",
      title: "Follow-up reminders",
      description: "Get notified about upcoming and overdue follow-ups.",
    },
    {
      key: "taskNotifications",
      title: "Task notifications",
      description: "Receive updates about assigned tasks and deadlines.",
    },
    {
      key: "announcementNotifications",
      title: "Company announcements",
      description: "Stay informed about internal announcements.",
    },
    {
      key: "weeklySummary",
      title: "Weekly activity summary",
      description: "Receive a weekly overview of your activity.",
    },
  ];

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <button
          type="button"
          onClick={() => navigate("/employee/dashboard")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <FiArrowLeft />
          Back to dashboard
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <FiSettings size={27} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Employee workspace
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your preferences and account security.
            </p>
          </div>
        </div>

        {/* Account summary */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <FiUser size={22} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                {user.name || "Employee"}
              </h2>
              <p className="mt-1 break-all text-sm text-slate-500">
                {user.email || "No email available"}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold capitalize text-emerald-700">
            <FiShield />
            {user.role}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Settings menu
            </p>

            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            {activeTab === "preferences" && (
              <form
                onSubmit={savePreferences}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5 sm:p-7">
                  <div className="flex items-center gap-3">
                    <FiBell className="text-indigo-600" size={22} />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Notification preferences
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Choose the notifications you want to receive.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 px-5 sm:px-7">
                  {preferenceItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-5 py-5"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(preferences[item.key])}
                        aria-label={item.title}
                        onClick={() => handlePreferenceChange(item.key)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          preferences[item.key]
                            ? "bg-indigo-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            preferences[item.key] ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t border-slate-100 p-5 sm:px-7">
                  <button
                    type="submit"
                    disabled={savingPreferences}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <FiSave />
                    {savingPreferences ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form
                onSubmit={changePassword}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5 sm:p-7">
                  <div className="flex items-center gap-3">
                    <FiLock className="text-indigo-600" size={22} />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Password and security
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Change your password to help protect your account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  {[
                    {
                      name: "currentPassword",
                      label: "Current password",
                      placeholder: "Enter current password",
                      field: "current",
                    },
                    {
                      name: "newPassword",
                      label: "New password",
                      placeholder: "At least 8 characters",
                      field: "new",
                    },
                    {
                      name: "confirmPassword",
                      label: "Confirm new password",
                      placeholder: "Re-enter new password",
                      field: "confirm",
                    },
                  ].map((item) => (
                    <div key={item.name}>
                      <label
                        htmlFor={item.name}
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        {item.label}
                      </label>

                      <div className="relative">
                        <input
                          id={item.name}
                          name={item.name}
                          type={showPasswords[item.field] ? "text" : "password"}
                          value={passwordForm[item.name]}
                          onChange={handlePasswordChange}
                          autoComplete="current-password"
                          required
                          minLength={
                            item.name === "currentPassword" ? undefined : 8
                          }
                          className={`${inputClass} pr-12`}
                          placeholder={item.placeholder}
                        />

                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(item.field)}
                          aria-label={
                            showPasswords[item.field]
                              ? "Hide password"
                              : "Show password"
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPasswords[item.field] ? (
                            <FiEyeOff size={18} />
                          ) : (
                            <FiEye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    Use a unique password with at least 8 characters. Never
                    share your password with anyone.
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 p-5 sm:px-7">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <FiLock />
                    {changingPassword ? "Updating..." : "Change password"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "account" && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-7">
                  <div className="flex items-center gap-3">
                    <FiMonitor className="text-indigo-600" size={22} />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Account information
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Details associated with your employee account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-500">
                      Full name
                    </label>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <FiUser className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">
                        {user.name || "Not available"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-500">
                      Email address
                    </label>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <FiMail className="text-slate-400" />
                      <span className="break-all text-sm font-medium text-slate-800">
                        {user.email || "Not available"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-500">
                      Account role
                    </label>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <FiShield className="text-slate-400" />
                      <span className="text-sm font-medium capitalize text-slate-800">
                        {user.role || "employee"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <FiCheckCircle
                      className="mt-0.5 shrink-0 text-emerald-600"
                      size={19}
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-800">
                        Account security
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-emerald-700">
                        Your account is authenticated using your current login
                        session. Contact your administrator if your role or
                        account details need to change.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
