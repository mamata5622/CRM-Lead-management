
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiUser,
  FiLock,
  FiBell,
  FiShield,
  FiSave,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiSettings,
  FiMail,
  FiPhone,
} from "react-icons/fi";

const API_URL = `${import.meta.env.VITE_BASE_URL}`;

const defaultPreferences = {
  emailNotifications: true,
  taskNotifications: true,
  followUpReminders: true,
  compactView: false,
};

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    let savedPreferences = defaultPreferences;

    try {
      const stored = localStorage.getItem("adminSettingsPreferences");

      if (stored) {
        savedPreferences = {
          ...defaultPreferences,
          ...JSON.parse(stored),
        };
      }
    } catch {
      toast.error("Could not load saved preferences.");
    }

    setPreferences(savedPreferences);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);

    try {
      // This endpoint must be implemented in your backend.
      const { data } = await axios.get(
        `${API_URL}/admin/settings/profile`,
        getAuthConfig()
      );

      const user = data.user || data.profile || {};

      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load admin profile. Check your settings API route."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPassword((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePreferenceChange = (key) => {
    setPreferences((previous) => {
      const updated = {
        ...previous,
        [key]: !previous[key],
      };

      try {
        localStorage.setItem(
          "adminSettingsPreferences",
          JSON.stringify(updated)
        );
      } catch {
        toast.error("Could not save preferences.");
      }

      return updated;
    });

    toast.success("Preference updated.");
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (!profile.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    setSaving(true);

    try {
      const { data } = await axios.patch(
        `${API_URL}/admin/settings/profile`,
        {
          name: profile.name.trim(),
          email: profile.email.trim().toLowerCase(),
          phone: profile.phone.trim(),
        },
        getAuthConfig()
      );

      const updatedUser = data.user || data.profile;

      if (updatedUser) {
        setProfile({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
        });

        // Keep the cached login user consistent if it exists.
        try {
          const storedUser = localStorage.getItem("user");

          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);

            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsedUser,
                ...updatedUser,
              })
            );
          }
        } catch {
          // The profile update itself may already have succeeded.
        }
      }

      toast.success(data.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (
      !password.currentPassword ||
      !password.newPassword ||
      !password.confirmPassword
    ) {
      toast.error("Please complete all password fields.");
      return;
    }

    if (password.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (password.currentPassword === password.newPassword) {
      toast.error("Choose a password different from your current one.");
      return;
    }

    setSaving(true);

    try {
      const { data } = await axios.patch(
        `${API_URL}/admin/settings/password`,
        {
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        },
        getAuthConfig()
      );

      toast.success(data.message || "Password changed successfully.");

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiLock },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "account", label: "Account", icon: FiShield },
  ];

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const renderPasswordField = (
    label,
    name,
    visibleKey,
    placeholder
  ) => (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPasswords[visibleKey] ? "text" : "password"}
          value={password[name]}
          onChange={handlePasswordChange}
          placeholder={placeholder}
          autoComplete={
            name === "currentPassword"
              ? "current-password"
              : "new-password"
          }
          required
          minLength={8}
          className={`${inputClass} pr-12`}
        />

        <button
          type="button"
          onClick={() =>
            setShowPasswords((previous) => ({
              ...previous,
              [visibleKey]: !previous[visibleKey],
            }))
          }
          aria-label={
            showPasswords[visibleKey]
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
        >
          {showPasswords[visibleKey] ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );

  const preferenceItems = [
    {
      key: "emailNotifications",
      title: "Email notifications",
      description: "Receive important account updates by email.",
    },
    {
      key: "taskNotifications",
      title: "Work assignment updates",
      description: "Stay informed about employee task activity.",
    },
    {
      key: "followUpReminders",
      title: "Follow-up reminders",
      description: "Keep track of upcoming CRM follow-ups.",
    },
    {
      key: "compactView",
      title: "Compact display",
      description: "Use a more compact layout where supported.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Heading */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Admin Settings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your profile, security, and preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh Profile
          </button>
        </div>

        {/* Main settings layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <FiSettings className="text-xl" />
              </div>

              <div className="min-w-0">
                <p className="font-bold text-slate-900">
                  Settings
                </p>
                <p className="text-xs text-slate-500">
                  Admin workspace
                </p>
              </div>
            </div>

            <nav className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="shrink-0 text-lg" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Settings content */}
          <main className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {activeTab === "profile" && (
              <form onSubmit={saveProfile}>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-bold text-slate-900">
                    Profile Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update your admin account details.
                  </p>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  {loading ? (
                    <p className="text-sm text-slate-500">
                      Loading profile...
                    </p>
                  ) : (
                    <>
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Full Name
                        </label>

                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="name"
                            name="name"
                            value={profile.name}
                            onChange={handleProfileChange}
                            required
                            maxLength={100}
                            className={`${inputClass} pl-11`}
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Email Address
                        </label>

                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            required
                            maxLength={254}
                            className={`${inputClass} pl-11`}
                            placeholder="admin@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Phone Number
                        </label>

                        <div className="relative">
                          <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={profile.phone}
                            onChange={handleProfileChange}
                            maxLength={20}
                            className={`${inputClass} pl-11`}
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end border-t border-slate-100 p-5 sm:px-7">
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <FiSave />
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={changePassword}>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-bold text-slate-900">
                    Security Settings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Change your password to help protect your account.
                  </p>
                </div>

                <div className="space-y-5 p-5 sm:p-7">
                  {renderPasswordField(
                    "Current Password",
                    "currentPassword",
                    "current",
                    "Enter current password"
                  )}

                  {renderPasswordField(
                    "New Password",
                    "newPassword",
                    "new",
                    "Enter new password (minimum 8 characters)"
                  )}

                  {renderPasswordField(
                    "Confirm New Password",
                    "confirmPassword",
                    "confirm",
                    "Re-enter new password"
                  )}

                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Use a unique password of at least 8 characters.
                    The server must verify your current password
                    before changing it.
                  </p>
                </div>

                <div className="flex justify-end border-t border-slate-100 p-5 sm:px-7">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <FiLock />
                    {saving ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "notifications" && (
              <>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-bold text-slate-900">
                    Preferences
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose which preferences you want enabled.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 px-5 sm:px-7">
                  {preferenceItems
                    .filter((item) => item.key !== "compactView")
                    .map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-4 py-5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={preferences[item.key]}
                          onClick={() =>
                            handlePreferenceChange(item.key)
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            preferences[item.key]
                              ? "bg-indigo-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              preferences[item.key]
                                ? "left-6"
                                : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}

            {activeTab === "account" && (
              <>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                  <h2 className="text-lg font-bold text-slate-900">
                    Account Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your account details.
                  </p>
                </div>

                <div className="space-y-4 p-5 sm:p-7">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <FiShield className="mt-1 text-xl text-emerald-600" />

                    <div>
                      <p className="font-semibold text-slate-900">
                        Administrator Access
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Your account should have the admin role to access
                        protected admin endpoints.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <FiBell className="mt-1 text-xl text-indigo-600" />

                    <div>
                      <p className="font-semibold text-slate-900">
                        Local Preferences
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Notification preferences on this page are stored
                        in this browser. They do not automatically send
                        emails or notifications.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Compact Display
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Preference saved in this browser.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={preferences.compactView}
                      onClick={() =>
                        handlePreferenceChange("compactView")
                      }
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        preferences.compactView
                          ? "bg-indigo-600"
                          : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          preferences.compactView
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
