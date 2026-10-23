
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiCheckCircle,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [method, setMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [stage, setStage] = useState("request");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedIdentifier =
    method === "email"
      ? identifier.trim().toLowerCase()
      : identifier.trim();

  const handleMethodChange = (nextMethod) => {
    setMethod(nextMethod);
    setIdentifier("");
    setOtp("");
    setResetToken("");
    setPassword("");
    setConfirmPassword("");
    setStage("request");
    setError("");
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");

    if (!API_BASE_URL) {
      setError("API URL is missing. Check your frontend .env file.");
      return;
    }

    if (!normalizedIdentifier) {
      setError(
        method === "email"
          ? "Enter your email address."
          : "Enter your mobile number."
      );
      return;
    }

    if (
      method === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)
    ) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method,
          identifier: normalizedIdentifier,
        }
      );

      toast.success(response.data?.message || "If an account matches, recovery instructions will be sent.");

      if (method === "email") {
        setStage("emailSent");
      } else {
        setStage("otp");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to process your request. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the six-digit code sent to your phone.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify-reset-otp`,
        {
          phone: normalizedIdentifier,
          otp: otp.trim(),
        }
      );

      if (!response.data?.resetToken) {
        throw new Error("The server did not return reset authorization.");
      }

      setResetToken(response.data.resetToken);
      setStage("newPassword");
      toast.success("Phone number verified.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to verify the code.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload =
        method === "email"
          ? {
              token: window.location.pathname.split("/").pop(),
              password,
              confirmPassword,
            }
          : {
              resetToken,
              password,
              confirmPassword,
            };

      const response = await axios.post(
        `${API_BASE_URL}/auth/reset-password`,
        payload
      );

      setStage("complete");
      toast.success(response.data?.message || "Password reset successfully.");

      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to reset your password. Request a new recovery code or link.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordFields = () => (
    <>
      <div>
        <label
          htmlFor="new-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          New password
        </label>

        <div className="relative">
          <FiLock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="At least 8 characters"
            className={`${inputClass} pl-11 pr-12`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            disabled={loading}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Confirm password
        </label>

        <div className="relative">
          <FiLock
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="Re-enter your password"
            className={`${inputClass} pl-11 pr-12`}
          />
          <button
            type="button"
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            disabled={loading}
          >
            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <FiArrowLeft size={17} />
          Back to login
        </Link>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          {stage === "complete" || stage === "emailSent" ? (
            <FiCheckCircle size={27} />
          ) : method === "email" ? (
            <FiMail size={27} />
          ) : (
            <FiPhone size={27} />
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {stage === "emailSent"
            ? "Check your email"
            : stage === "otp"
              ? "Verify your phone"
              : stage === "newPassword"
                ? "Create a new password"
                : stage === "complete"
                  ? "Password updated"
                  : "Forgot password?"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {stage === "emailSent"
            ? "If an account matches your email, a reset link will arrive shortly. Check your spam folder too."
            : stage === "otp"
              ? "Enter the six-digit verification code sent to your mobile number. It expires in five minutes."
              : stage === "newPassword"
                ? "Choose a new password for your account."
                : stage === "complete"
                  ? "Your password has been changed. Redirecting to login..."
                  : "Choose how you want to recover your account."}
        </p>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {stage === "request" && (
          <form onSubmit={handleRequest} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Recover using
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleMethodChange("email")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    method === "email"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FiMail size={17} />
                  Email
                </button>

                <button
                  type="button"
                  onClick={() => handleMethodChange("phone")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    method === "phone"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FiPhone size={17} />
                  Mobile
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {method === "email" ? "Email address" : "Mobile number"}
              </label>

              <input
                id="identifier"
                type={method === "email" ? "email" : "tel"}
                autoComplete={method === "email" ? "email" : "tel"}
                inputMode={method === "email" ? "email" : "tel"}
                required
                maxLength={254}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                placeholder={
                  method === "email"
                    ? "you@example.com"
                    : "+91 9876543210"
                }
                className={inputClass}
              />

              {method === "phone" && (
                <p className="mt-2 text-xs text-slate-500">
                  Enter the same mobile number registered on your account.
                  Indian 10-digit numbers are accepted.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  Sending...
                </>
              ) : method === "email" ? (
                "Send reset link"
              ) : (
                "Send verification code"
              )}
            </button>
          </form>
        )}

        {stage === "otp" && (
          <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Six-digit verification code
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={loading}
                placeholder="123456"
                className={`${inputClass} text-center text-xl tracking-[0.35em]`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  Verifying...
                </>
              ) : (
                "Verify code"
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOtp("");
                setError("");
                setStage("request");
              }}
              className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Request another code
            </button>
          </form>
        )}

        {stage === "newPassword" && (
          <form
            onSubmit={handleResetPassword}
            className="mt-7 space-y-5"
          >
            {renderPasswordFields()}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  Updating...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        )}

        {(stage === "emailSent" || stage === "complete") && (
          <Link
            to="/login"
            className="mt-7 block w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Go to login
          </Link>
        )}

        <p className="mt-7 text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
