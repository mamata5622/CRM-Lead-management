import React, { useState, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router";

import {
  FaBars,
  FaTimes,
  FaHome,
  FaBuilding,
  FaUsers,
  FaTruck,
  FaTools,
  FaTint,
  FaShieldAlt,
  FaBoxes,
  FaChartLine,
  FaChevronDown,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowRight,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const services = [
  {
    name: "Real Estate",
    description: "Property and real estate solutions",
    icon: FaBuilding,
  },
  {
    name: "Manpower",
    description: "Workforce and staffing services",
    icon: FaUsers,
  },
  {
    name: "Logistics",
    description: "Transport and logistics solutions",
    icon: FaTruck,
  },
  {
    name: "Vendor Supply",
    description: "Reliable supply and procurement",
    icon: FaBoxes,
  },
  {
    name: "Construction",
    description: "Construction and project services",
    icon: FaTools,
  },
  {
    name: "Borewell",
    description: "Borewell and water solutions",
    icon: FaTint,
  },
  {
    name: "Security",
    description: "Security and protection services",
    icon: FaShieldAlt,
  },
  {
    name: "Consultancy",
    description: "Professional consulting services",
    icon: FaChartLine,
  },
];

const publicLinks = [
  { name: "Home", path: "/", icon: FaHome },
  { name: "About Us", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const location = useLocation();

  // Close menus whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [location.pathname, location.search]);

  // Close menus using the Escape key.
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setServicesOpen(false);
        setMobileServicesOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const navLinkClass = ({ isActive }) =>
    [
      "flex items-center gap-2 rounded-lg px-3 py-2.5",
      "text-sm font-medium transition duration-200",
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700",
    ].join(" ");

  const handleServiceClick = (serviceName) => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);

    // Update this destination if your public service page uses another route.
    window.location.href = `/services?category=${encodeURIComponent(serviceName)}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      {/* Top information bar */}
      <div className="hidden bg-slate-950 text-slate-300 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2.5 text-xs lg:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href="mailto:info@ishadisha.com"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <FaEnvelope className="text-blue-400" />
              info@ishadisha.com
            </a>

            <a
              href="tel:+910000000000"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <FaPhoneAlt className="text-blue-400" />
              Contact our team
            </a>
          </div>

          <p className="text-slate-400">
            Your trusted business solutions partner
          </p>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            to="/"
            aria-label="ISHA DISHA home"
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-extrabold text-white shadow-md shadow-blue-200">
              ID
            </div>

            <div>
              <span className="block text-base font-extrabold tracking-wide text-slate-900 sm:text-lg">
                ISHA DISHA
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold tracking-[2px] text-slate-500 sm:text-[10px]">
                BUSINESS SOLUTIONS
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {publicLinks.map(({ name, path }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={navLinkClass}
              >
                {name}
              </NavLink>
            ))}

            {/* Services dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setServicesOpen((previous) => !previous)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setServicesOpen(false);
                  }
                }}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                className={[
                  "flex items-center gap-2 rounded-lg px-3 py-2.5",
                  "text-sm font-medium transition hover:bg-slate-50",
                  location.pathname.startsWith("/services")
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-blue-700",
                ].join(" ")}
              >
                Services
                <FaChevronDown
                  className={`text-[10px] transition-transform ${
                    servicesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {servicesOpen && (
                <div className="absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-300/40">
                    <div className="mb-2 px-3 py-2">
                      <p className="text-xs font-bold uppercase tracking-[1.5px] text-slate-400">
                        Our Business Verticals
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      {services.map(({ name, description, icon: Icon }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleServiceClick(name)}
                          className="flex items-start gap-3 rounded-xl p-3 text-left transition hover:bg-blue-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <Icon size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {name}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <Link
                      to="/services"
                      onClick={() => setServicesOpen(false)}
                      className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      Explore all services
                      <FaArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 hover:shadow-lg"
            >
              Get Started
              <FaArrowRight size={12} />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close mobile menu"
              className="fixed inset-0 top-[76px] z-40 bg-slate-950/30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-76px)] overflow-y-auto border-t border-slate-100 bg-white shadow-xl lg:hidden">
              <nav
                aria-label="Mobile navigation"
                className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6"
              >
                {publicLinks.map(({ name, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-4 py-3",
                        "text-sm font-medium transition",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")
                    }
                  >
                    {Icon && <Icon className="text-blue-600" />}
                    {name}
                  </NavLink>
                ))}

                {/* Mobile services accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileServicesOpen((previous) => !previous)
                    }
                    aria-expanded={mobileServicesOpen}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-3">
                      <FaBuilding className="text-blue-600" />
                      Services
                    </span>

                    <FaChevronDown
                      className={`text-xs transition-transform ${
                        mobileServicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileServicesOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-100 pl-3">
                      {services.map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleServiceClick(name)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Icon className="text-blue-500" />
                          {name}
                        </button>
                      ))}

                      <Link
                        to="/services"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        View all services
                      </Link>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Register
                    <FaArrowRight size={11} />
                  </Link>
                </div>

                <div className="space-y-3 border-t border-slate-100 py-4 text-xs text-slate-500">
                  <a
                    href="mailto:info@ishadisha.com"
                    className="flex items-center gap-3"
                  >
                    <FaEnvelope className="text-blue-600" />
                    info@ishadisha.com
                  </a>

                  <a
                    href="tel:+910000000000"
                    className="flex items-center gap-3"
                  >
                    <FaPhoneAlt className="text-blue-600" />
                    Contact our team
                  </a>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Public page content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8 lg:py-16">
          {/* Company information */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white">
                ID
              </div>
              <div>
                <p className="font-extrabold tracking-wide text-white">
                  ISHA DISHA
                </p>
                <p className="mt-1 text-[10px] tracking-[2px] text-slate-400">
                  BUSINESS SOLUTIONS
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Connecting people, services, and business opportunities through
              dependable and professional solutions.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 transition hover:bg-blue-600 hover:text-white"
              >
                <FaFacebookF size={14} />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 transition hover:bg-blue-600 hover:text-white"
              >
                <FaInstagram size={14} />
              </a>

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 transition hover:bg-blue-600 hover:text-white"
              >
                <FaLinkedinIn size={14} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold text-white">Quick Links</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link to="/" className="transition hover:text-blue-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-blue-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="transition hover:text-blue-400">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition hover:text-blue-400">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold text-white">Our Services</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {services.slice(0, 5).map(({ name }) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => handleServiceClick(name)}
                    className="text-left transition hover:text-blue-400"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact information */}
          <div>
            <h3 className="text-sm font-bold text-white">Contact Us</h3>

            <div className="mt-5 space-y-4 text-sm">
              <a
                href="mailto:info@ishadisha.com"
                className="flex items-start gap-3 transition hover:text-blue-400"
              >
                <FaEnvelope className="mt-1 shrink-0 text-blue-400" />
                <span className="break-all">info@ishadisha.com</span>
              </a>

              <a
                href="tel:+910000000000"
                className="flex items-start gap-3 transition hover:text-blue-400"
              >
                <FaPhoneAlt className="mt-1 shrink-0 text-blue-400" />
                <span>Contact our team</span>
              </a>

              <div className="flex items-start gap-3 text-slate-400">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-blue-400" />
                <span>Update with your official business address.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-center text-xs text-slate-500 sm:px-6 md:flex-row md:text-left lg:px-8">
            <p>© {new Date().getFullYear()} ISHA DISHA. All rights reserved.</p>

            <div className="flex items-center gap-5">
              <Link
                to="/privacy-policy"
                className="transition hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition hover:text-white">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
