import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaArrowRight,
  FaCheckCircle,
  FaPaperPlane,
  FaBuilding,
  FaUser,
  FaCommentDots,
} from "react-icons/fa";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  service: "",
  subject: "",
  message: "",
};

const serviceOptions = [
  "Real Estate",
  "Manpower",
  "Logistics",
  "Vendor Supply",
  "Construction",
  "Borewell",
  "Security",
  "Consultancy",
  "Other",
];

export default function Contact() {
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get("service") || "";

  const [form, setForm] = useState({
    ...initialForm,
    service: serviceOptions.includes(requestedService) ? requestedService : "",
  });

  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const service = searchParams.get("service") || "";

    setForm((previous) => ({
      ...previous,
      service: serviceOptions.includes(service) ? service : previous.service,
    }));
  }, [searchParams]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setFeedback("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (form.phone.trim() && !/^[+\d\s().-]{7,20}$/.test(form.phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Please enter an enquiry subject.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Please describe your requirements.";
    } else if (form.message.trim().length < 10) {
      nextErrors.message = "Please enter at least 10 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFeedback("");

    if (!validateForm()) return;

    const recipient = "info@ishadisha.com";

    const emailBody = [
      "New enquiry from the ISHA DISHA website",
      "",
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim() || "Not provided"}`,
      `Service: ${form.service || "Not specified"}`,
      `Subject: ${form.subject.trim()}`,
      "",
      "Message:",
      form.message.trim(),
    ].join("\n");

    const mailtoUrl =
      `mailto:${recipient}` +
      `?subject=${encodeURIComponent(form.subject.trim())}` +
      `&body=${encodeURIComponent(emailBody)}`;

    setFeedback(
      "Your email application should open with the enquiry details. Please send the email to complete your enquiry.",
    );

    window.location.href = mailtoUrl;
  };

  const inputClass = (field) =>
    [
      "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800",
      "outline-none transition placeholder:text-slate-400",
      "focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
      errors[field] ? "border-red-400" : "border-slate-200",
    ].join(" ");

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950" />
        <div className="absolute -right-20 -top-20 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-10 -z-10 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-blue-300">
              <FaCommentDots />
              Contact Us
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Let's discuss
              <span className="block text-blue-400">your requirements.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Have a question, project, or business enquiry? Share the details
              with us and take the first step toward discussing a suitable
              solution.
            </p>
          </div>
        </div>
      </section>

      {/* Main contact content */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          {/* Contact information */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
              Get in Touch
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              We'd love to hear from you
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Contact us about your service needs, business enquiries, or
              project requirements. Please use the form to provide enough detail
              for a useful conversation.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="mailto:info@ishadisha.com"
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                  <FaEnvelope size={19} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">Email Us</h3>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    info@ishadisha.com
                  </p>
                  <p className="mt-2 text-xs text-blue-700">Send us an email</p>
                </div>
              </a>

              <a
                href="tel:+910000000000"
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                  <FaPhoneAlt size={18} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">Call Us</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Contact our team
                  </p>
                  <p className="mt-2 text-xs text-blue-700">Call our team</p>
                </div>
              </a>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <FaMapMarkerAlt size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Our Location</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Add your official business address here.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <FaClock size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Business Hours</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Add your official working days and hours here.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white sm:p-7">
              <h3 className="text-lg font-bold">
                Looking for a particular service?
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Explore our service categories to identify the area relevant to
                your enquiry.
              </p>

              <Link
                to="/services"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300"
              >
                Explore services
                <FaArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <FaPaperPlane size={20} />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
                Send an enquiry
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete the fields below. Fields marked with * are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Name *
                  </label>

                  <div className="relative">
                    <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={updateField}
                      placeholder="Your full name"
                      aria-invalid={Boolean(errors.name)}
                      className={`${inputClass("name")} pl-11`}
                    />
                  </div>

                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address *
                  </label>

                  <div className="relative">
                    <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={updateField}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                      className={`${inputClass("email")} pl-11`}
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>

                  <div className="relative">
                    <FaPhoneAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={updateField}
                      placeholder="Your phone number"
                      aria-invalid={Boolean(errors.phone)}
                      className={`${inputClass("phone")} pl-11`}
                    />
                  </div>

                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Service */}
                <div>
                  <label
                    htmlFor="service"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Service of Interest
                  </label>

                  <div className="relative">
                    <FaBuilding className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      id="service"
                      name="service"
                      value={form.service}
                      onChange={updateField}
                      className={`${inputClass("service")} appearance-none pl-11`}
                    >
                      <option value="">Select a service</option>
                      {serviceOptions.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Subject *
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={updateField}
                    placeholder="What is your enquiry about?"
                    aria-invalid={Boolean(errors.subject)}
                    className={inputClass("subject")}
                  />

                  {errors.subject && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Your Message *
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={updateField}
                    placeholder="Describe your requirements..."
                    aria-invalid={Boolean(errors.message)}
                    className={`${inputClass("message")} resize-y`}
                  />

                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    {errors.message ? (
                      <p className="text-xs text-red-600">{errors.message}</p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Please provide at least 10 characters.
                      </p>
                    )}

                    <span className="shrink-0 text-xs text-slate-400">
                      {form.message.length} characters
                    </span>
                  </div>
                </div>
              </div>

              {feedback && (
                <div
                  role="status"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800"
                >
                  <FaCheckCircle className="mt-1 shrink-0" />
                  <p>{feedback}</p>
                </div>
              )}

              <button
                type="submit"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-auto"
              >
                Prepare Email Enquiry
                <FaArrowRight size={12} />
              </button>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Submitting opens your default email application. Your enquiry is
                not stored or sent to a server by this form.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Closing banner */}
      <section className="bg-slate-50 px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-9 text-center sm:px-10 sm:py-12">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Let's build something meaningful together
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Explore our business verticals and find the service that best
            matches your requirements.
          </p>

          <Link
            to="/services"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Explore Our Services
            <FaArrowRight size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
