
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCamera,
  FiSave,
  FiArrowLeft,
  FiShield,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const MyProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    profileImage: "",
    role: "employee",
  });

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Create this endpoint in your backend as described below.
        const { data } = await axios.get(
          `${API_BASE_URL}/employee/profile`,
          authConfig
        );

        const user = data.user || data;

        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          profileImage: user.profileImage || "",
          role: user.role || "employee",
        });
      } catch (error) {
        // Temporary fallback to the saved login details.
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        setProfile({
          name: storedUser.name || "",
          email: storedUser.email || "",
          phone: storedUser.phone || "",
          profileImage: storedUser.profileImage || "",
          role: storedUser.role || "employee",
        });

        toast.error(
          error.response?.data?.message ||
            "Could not load the latest profile from the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        profileImage: profile.profileImage.trim(),
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/employee/profile`,
        payload,
        authConfig
      );

      const updatedUser = data.user || {
        ...profile,
        ...payload,
      };

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      // Keep the browser's cached user details synchronized.
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          name: updatedUser.name || payload.name,
          phone: updatedUser.phone ?? payload.phone,
          profileImage:
            updatedUser.profileImage ?? payload.profileImage,
        })
      );

      toast.success(data.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update profile. Check your backend endpoint."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "E";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/employee/dashboard")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <FiArrowLeft />
          Back to dashboard
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Employee account
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Profile
          </h1>
          <p className="mt-2 text-slate-500">
            View and update your personal information.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Profile summary */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Employee profile"
                  className="h-28 w-28 rounded-full border-4 border-indigo-50 object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-700">
                  {initials}
                </div>
              )}

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {profile.name || "Employee"}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {profile.email}
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700">
                <FiShield />
                {profile.role}
              </span>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <FiPhone className="text-indigo-600" />
                {profile.phone || "Phone not added"}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Personal information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your contact information below.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    value={profile.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-500"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Contact your administrator if your email needs to change.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Phone number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleChange}
                    maxLength={20}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profileImage"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Profile image URL
                </label>
                <div className="relative">
                  <FiCamera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="profileImage"
                    name="profileImage"
                    type="url"
                    value={profile.profileImage}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Enter a publicly accessible image URL.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSave />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
