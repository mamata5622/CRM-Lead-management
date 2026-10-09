
import React, { useState } from "react";
import axios from "axios";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiLoader,
  FiImage,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    profileImage: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim().toLowerCase();
    const profileImage = formData.profileImage.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (profileImage) {
      try {
        const url = new URL(profileImage);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        setError("Please enter a valid profile image URL.");
        return;
      }
    }

    if (!API_BASE_URL) {
      setError("API URL is missing. Please check your .env file.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          name,
          phone: phone || null,
          email,
          profileImage: profileImage || null,
          password,
        }
      );

      const message =
        response.data?.message || "Registration successful!";

      // If your backend returns a token, sign the user in.
      if (response.data?.token && response.data?.user) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        const user = response.data.user;
        const destination =
          response.data.redirectTo ||
          (user.role === "admin"
            ? "/admin/dashboard"
            : "/dashboard");

        navigate(destination, {
          replace: true,
          state: { loginMessage: message },
        });
      } else {
        // Otherwise, redirect to login after registration.
        navigate("/login", {
          replace: true,
          state: { registrationMessage: message },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-2">

        {/* Left panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-indigo-600 p-10 text-white lg:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-indigo-500/70" />

          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-indigo-600">
                B
              </div>
              <span className="text-xl font-bold tracking-wide">
                BusinessHub
              </span>
            </div>

            <p className="mb-3 text-sm font-semibold tracking-widest text-indigo-200">
              GET STARTED TODAY
            </p>

            <h1 className="max-w-sm text-4xl font-bold leading-tight">
              Build your future with BusinessHub.
            </h1>

            <p className="mt-5 max-w-sm leading-7 text-indigo-100">
              Create your account to manage your business,
              connect with opportunities, and access your
              personalized workspace.
            </p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="font-semibold">Simple and secure</p>
            <p className="mt-1 text-sm text-indigo-100">
              Join BusinessHub and get started with your
              personalized business dashboard.
            </p>
          </div>
        </div>

        {/* Register form */}
        <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">

            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                B
              </div>
              <span className="text-lg font-bold text-slate-800">
                BusinessHub
              </span>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-indigo-600">
                CREATE YOUR ACCOUNT
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Join BusinessHub
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your details below to create your account.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <FiAlertCircle
                  className="mt-0.5 shrink-0"
                  size={18}
                />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full name */}
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full name
                </label>

                <div className="relative">
                  <FiUser
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>

                <div className="relative">
                  <FiMail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <FiPhone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Profile image */}
              <div>
                <label
                  htmlFor="profileImage"
                  className={labelClass}
                >
                  Profile image URL
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <FiImage
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="profileImage"
                    name="profileImage"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.profileImage}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>

                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                    minLength={8}
                    required
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={labelClass}
                >
                  Confirm password
                </label>

                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                    minLength={8}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password visibility */}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) =>
                    setShowPassword(e.target.checked)
                  }
                  className="h-4 w-4 accent-indigo-600"
                  disabled={loading}
                />
                Show passwords
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <FiLoader
                      className="animate-spin"
                      size={18}
                    />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <FiArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              By creating an account, you agree to your
              applicable terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;