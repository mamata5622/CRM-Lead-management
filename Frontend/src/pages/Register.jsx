import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiImage,
  FiArrowRight,
  FiArrowLeft,
  FiUserPlus,
  FiShield,
  FiCheck,
  FiX,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const initialForm = {
  name: "",
  phone: "",
  email: "",
  profileImage: "",
  password: "",
  confirmPassword: "",
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  const passwordRules = useMemo(
    () => [
      { label: "At least 8 characters", valid: formData.password.length >= 8 },
      {
        label: "One uppercase letter",
        valid: /[A-Z]/.test(formData.password),
      },
      {
        label: "One lowercase letter",
        valid: /[a-z]/.test(formData.password),
      },
      { label: "One number", valid: /[0-9]/.test(formData.password) },
      {
        label: "Maximum 72 UTF-8 bytes",
        valid: new TextEncoder().encode(formData.password).length <= 72,
      },
    ],
    [formData.password],
  );

  const passwordStrong = passwordRules.every((rule) => rule.valid);
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (name === "profileImage") setImagePreviewFailed(false);
  };

  const handleBlur = (event) => {
    setTouched((previous) => ({ ...previous, [event.target.name]: true }));
  };

  const getFieldError = (field) => {
    const value = formData[field];

    if (!touched[field]) return "";

    if (field === "name") {
      if (!value.trim()) return "Full name is required.";
      if (value.trim().length < 2) return "Enter at least 2 characters.";
      if (value.trim().length > 100)
        return "Name cannot exceed 100 characters.";
    }

    if (field === "phone" && value.trim()) {
      if (!/^\+?[0-9\s()-]{10,18}$/.test(value.trim())) {
        return "Enter a valid phone number.";
      }
    }

    if (field === "email") {
      if (!value.trim()) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return "Enter a valid email address.";
      }
    }

    if (field === "profileImage" && value.trim()) {
      try {
        const url = new URL(value.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          return "Use an HTTP or HTTPS image URL.";
        }
      } catch {
        return "Enter a valid image URL.";
      }
    }

    if (field === "password") {
      if (!value) return "Password is required.";
      if (value.length < 8) return "Use at least 8 characters.";
      if (new TextEncoder().encode(value).length > 72) {
        return "Password cannot exceed 72 UTF-8 bytes.";
      }
      if (
        !/[A-Z]/.test(value) ||
        !/[a-z]/.test(value) ||
        !/[0-9]/.test(value)
      ) {
        return "Include uppercase, lowercase, and a number.";
      }
    }

    if (field === "confirmPassword") {
      if (!value) return "Please confirm your password.";
      if (value !== formData.password) return "Passwords do not match.";
    }

    return "";
  };

  const validateForm = () => {
    const allTouched = Object.keys(initialForm).reduce(
      (result, field) => ({ ...result, [field]: true }),
      {},
    );
    setTouched(allTouched);

    const { name, phone, email, profileImage, password, confirmPassword } =
      formData;

    if (!name.trim() || name.trim().length < 2 || name.trim().length > 100) {
      toast.error("Please enter a valid full name.");
      return false;
    }

    if (phone.trim() && !/^\+?[0-9\s()-]{10,18}$/.test(phone.trim())) {
      toast.error("Please enter a valid phone number.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (profileImage.trim()) {
      try {
        const url = new URL(profileImage.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          toast.error("Profile image URL must use HTTP or HTTPS.");
          return false;
        }
      } catch {
        toast.error("Please enter a valid profile image URL.");
        return false;
      }
    }

    if (!passwordStrong) {
      toast.error("Please meet all password requirements.");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || !validateForm()) return;

    if (!API_BASE_URL) {
      toast.error("API URL is not configured. Check your frontend .env file.");
      return;
    }

    setLoading(true);

    try {
      const baseURL = API_BASE_URL.replace(/\/+$/, "");
      const response = await axios.post(`${baseURL}/auth/register`, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim().toLowerCase(),
        profileImage: formData.profileImage.trim() || null,
        password: formData.password,
      });

      const data = response.data;
      const message = data.message || "Registration successful.";

      // Standard registration controller returns a user but no token.
      // Only create a local session if the backend explicitly returns a token.
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("userUpdated"));

        const role = String(data.user.role || "user").toLowerCase();
        const destinations = {
          admin: "/admin/dashboard",
          employee: "/employee/dashboard",
          user: "/dashboard",
        };

        toast.success(message);
        navigate(destinations[role] || "/dashboard", { replace: true });
      } else {
        toast.success(message);
        navigate("/login", {
          replace: true,
          state: { registered: true },
        });
      }
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (status === 409
          ? "An account with this email already exists."
          : "Registration failed. Please try again.");

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50";
  const iconClass =
    "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

  const renderError = (field) => {
    const error = getFieldError(field);
    return error ? (
      <p className="mt-1.5 text-xs text-rose-600" role="alert">
        {error}
      </p>
    ) : null;
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md sm:left-6 sm:top-6"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 p-10 text-white lg:flex xl:p-14">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <FiUserPlus size={23} />
            </div>
            <h1 className="mt-8 text-3xl font-bold tracking-tight xl:text-4xl">
              ISHA DISHA
            </h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-indigo-200">
              Command Center
            </p>

            <div className="mt-12 max-w-md">
              <h2 className="text-3xl font-semibold leading-tight xl:text-4xl">
                Build better connections. Grow your business.
              </h2>
              <p className="mt-5 text-base leading-7 text-indigo-100">
                Create your account to manage leads, organize follow-ups, and
                keep your business relationships moving forward.
              </p>
            </div>

            <div className="mt-10 space-y-5">
              {[
                "Organize customer relationships",
                "Track leads and follow-up activities",
                "Keep business information in one place",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                    <FiCheck size={14} />
                  </span>
                  <span className="text-sm text-indigo-50">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-indigo-200">
            <FiShield size={15} />
            <span>Secure account registration</span>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <FiUserPlus size={23} />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900">
                ISHA DISHA
              </h1>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Command Center
              </p>
            </div>

            <header>
              <p className="text-sm font-semibold text-indigo-600">
                GET STARTED
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Create account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your details below to create your account.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Full name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className={iconClass} size={17} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass}
                    maxLength={100}
                    required
                    aria-invalid={Boolean(getFieldError("name"))}
                  />
                </div>
                {renderError("name")}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Phone number{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <FiPhone className={iconClass} size={17} />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass}
                    maxLength={18}
                    aria-invalid={Boolean(getFieldError("phone"))}
                  />
                </div>
                {renderError("phone")}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className={iconClass} size={17} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass}
                    maxLength={254}
                    required
                    aria-invalid={Boolean(getFieldError("email"))}
                  />
                </div>
                {renderError("email")}
              </div>

              <div>
                <label
                  htmlFor="profileImage"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Profile image URL{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <FiImage className={iconClass} size={17} />
                  <input
                    id="profileImage"
                    name="profileImage"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.profileImage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass}
                    aria-invalid={Boolean(getFieldError("profileImage"))}
                  />
                </div>
                {renderError("profileImage")}
                {formData.profileImage.trim() &&
                  !getFieldError("profileImage") && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      {imagePreviewFailed ? (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                          <FiImage size={18} />
                        </div>
                      ) : (
                        <img
                          src={formData.profileImage.trim()}
                          alt="Profile preview"
                          referrerPolicy="no-referrer"
                          className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                          onError={() => setImagePreviewFailed(true)}
                        />
                      )}
                      <span className="text-xs text-slate-500">
                        {imagePreviewFailed
                          ? "Image preview unavailable"
                          : "Profile image preview"}
                      </span>
                    </div>
                  )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className={iconClass} size={17} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} pr-12`}
                    minLength={8}
                    maxLength={72}
                    required
                    aria-invalid={Boolean(getFieldError("password"))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-600">
                      Password requirements
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {passwordRules.map((rule) => (
                        <div
                          key={rule.label}
                          className={`flex items-center gap-2 text-xs ${
                            rule.valid ? "text-emerald-700" : "text-slate-500"
                          }`}
                        >
                          {rule.valid ? (
                            <FiCheck size={13} />
                          ) : (
                            <FiX size={13} />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {renderError("password")}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Confirm password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className={iconClass} size={17} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputClass} pr-12`}
                    minLength={8}
                    maxLength={72}
                    required
                    aria-invalid={Boolean(getFieldError("confirmPassword"))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && passwordsMatch && (
                  <p className="mt-1.5 text-xs text-emerald-600">
                    Passwords match.
                  </p>
                )}
                {renderError("confirmPassword")}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account <FiArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                ALREADY REGISTERED?
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 transition hover:text-indigo-800"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              Public registration creates a standard user account. Contact an
              administrator if you need employee or admin access.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Register;
