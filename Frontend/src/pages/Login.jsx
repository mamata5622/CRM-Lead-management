import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showError = (message) => {
    setError(message);
    toast.error(message);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    // Correct email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      showError("Please enter your password.");
      return;
    }

    if (!API_BASE_URL) {
      showError("API URL is missing. Check your .env file.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user, message } = response.data || {};

      if (!token || !user || !user.role) {
        throw new Error("Login response is missing the token or user role.");
      }

      const role = String(user.role).trim().toLowerCase();

      const roleRoutes = {
        admin: "/admin/dashboard",
        employee: "/employee/dashboard",
        user: "/dashboard",
      };

      const destination = roleRoutes[role];

      if (!destination) {
        throw new Error(`Unrecognized account role: ${role}`);
      }

      // Save the authenticated user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Debug: check the role and destination in browser console
      console.log("Logged-in user:", user);
      console.log("User role:", role);
      console.log("Redirect destination:", destination);

      toast.success(message || "Login successful!");

      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Unable to log in. Please try again.";

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60";

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

            <h1 className="max-w-sm text-4xl font-bold leading-tight">
              Welcome back to your workspace.
            </h1>

            <p className="mt-5 max-w-sm leading-7 text-indigo-100">
              Sign in to manage your account and access your personalized
              dashboard.
            </p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="font-semibold">Simple and secure</p>
            <p className="mt-1 text-sm text-indigo-100">
              Sign in with your registered email and password.
            </p>
          </div>
        </div>

        {/* Login form */}
        <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
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
                WELCOME BACK
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your registered email and password to continue.
              </p>
            </div>

            {/* Inline error */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
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

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" size={18} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <FiArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
