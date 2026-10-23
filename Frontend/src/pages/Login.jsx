import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiUsers,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const getDashboardPath = (role) => {
  const roleRoutes = {
    admin: "/admin/dashboard",
    employee: "/employee/dashboard",
    user: "/dashboard",
  };

  return roleRoutes[String(role || "").toLowerCase()] || "/login";
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  });

  const [rememberEmail, setRememberEmail] = useState(
    Boolean(localStorage.getItem("rememberedEmail")),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location.state?.registered) {
      toast.success("Registration successful! Please sign in.");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      form: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const email = form.email.trim().toLowerCase();

    if (!email) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || !validateForm()) return;

    if (!API_BASE_URL) {
      setErrors({
        form: "API configuration is missing. Check your VITE_BASE_URL.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL.replace(/\/$/, "")}/auth/login`,
        {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = response.data;

      if (!data?.success || !data?.token || !data?.user) {
        throw new Error(data?.message || "Unable to sign in.");
      }

      const user = data.user;
      const role = String(user.role || "")
        .trim()
        .toLowerCase();
      const dashboard = getDashboardPath(role);

      if (dashboard === "/login") {
        throw new Error("Your account role is not recognized.");
      }

      // Save the authenticated session.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      if (rememberEmail) {
        localStorage.setItem("rememberedEmail", form.email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Notify layouts listening for user changes.
      window.dispatchEvent(new Event("userUpdated"));

      toast.success(data.message || "Welcome back!");

      const requestedPath = location.state?.from?.pathname;
      const destination =
        requestedPath && requestedPath.startsWith("/")
          ? requestedPath
          : data.redirectTo || dashboard;

      // Avoid sending a user to a different role's dashboard.
      const safeDestination =
        destination === dashboard || destination.startsWith(`${dashboard}/`)
          ? destination
          : dashboard;

      navigate(safeDestination, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";

      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Link
        to="/"
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md sm:left-6 sm:top-6"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <Link to="/" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <FiShield size={25} />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-wide">ISHA DISHA</p>
              <p className="text-xs tracking-[0.25em] text-blue-200">
                BUSINESSHUB
              </p>
            </div>
          </Link>

          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-100">
              <FiCheckCircle />
              Your workspace, connected
            </span>

            <h1 className="mt-8 text-5xl font-bold leading-tight xl:text-6xl">
              Manage relationships.
              <span className="mt-2 block text-blue-300">
                Grow your business.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Access your leads, follow-ups, deals, and communications from one
              organized workspace.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <FiUsers className="mb-4 text-2xl text-blue-300" />
                <h3 className="font-semibold">Team collaboration</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Stay connected with your team and customers.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <FiShield className="mb-4 text-2xl text-blue-300" />
                <h3 className="font-semibold">Secure access</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Access the tools assigned to your account.
                </p>
              </div>
            </div>
          </div>

          <p className="relative text-sm text-slate-400">
            © {new Date().getFullYear()} ISHA DISHA. All rights reserved.
          </p>
        </section>

        {/* Login form */}
        <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-3 lg:hidden"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-700 text-white">
                <FiShield size={23} />
              </div>
              <div>
                <p className="font-extrabold tracking-wide text-slate-900">
                  ISHA DISHA
                </p>
                <p className="text-xs tracking-widest text-slate-500">
                  BUSINESSHUB
                </p>
              </div>
            </Link>

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">
                Welcome back
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your account details to continue to your workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {errors.form && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errors.form}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div
                  className={`flex items-center rounded-xl border bg-white transition focus-within:ring-4 ${
                    errors.email
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-100"
                  }`}
                >
                  <FiMail className="ml-4 shrink-0 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="w-full rounded-xl bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>

                {errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div
                  className={`flex items-center rounded-xl border bg-white transition focus-within:ring-4 ${
                    errors.password
                      ? "border-red-400 focus-within:ring-red-100"
                      : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-100"
                  }`}
                >
                  <FiLock className="ml-4 shrink-0 text-slate-400" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className="w-full rounded-xl bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(event) => setRememberEmail(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                Remember my email on this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <FiArrowRight />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-10 text-center text-xs leading-5 text-slate-400">
              By signing in, you agree to follow your organization's access and
              security policies.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
