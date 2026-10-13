
import React from "react";
import { Link } from "react-router";
import {
  FaBuilding,
  FaUsers,
  FaTruck,
  FaBoxes,
  FaTools,
  FaTint,
  FaShieldAlt,
  FaChartLine,
  FaCheckCircle,
  FaArrowRight,
  FaHandshake,
  FaBullseye,
  FaEye,
  FaStar,
} from "react-icons/fa";

const services = [
  { name: "Real Estate", icon: FaBuilding },
  { name: "Manpower", icon: FaUsers },
  { name: "Logistics", icon: FaTruck },
  { name: "Vendor Supply", icon: FaBoxes },
  { name: "Construction", icon: FaTools },
  { name: "Borewell", icon: FaTint },
  { name: "Security", icon: FaShieldAlt },
  { name: "Consultancy", icon: FaChartLine },
];

const values = [
  {
    icon: FaHandshake,
    title: "Trust & Integrity",
    description:
      "We believe in transparent communication, responsible service, and building lasting professional relationships.",
  },
  {
    icon: FaBullseye,
    title: "Customer Focus",
    description:
      "We work to understand each client's needs and provide practical solutions aligned with their goals.",
  },
  {
    icon: FaStar,
    title: "Quality & Reliability",
    description:
      "We aim to deliver consistent service, dependable coordination, and attention to detail.",
  },
];

export default function About() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative isolate bg-slate-950">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950" />
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 -z-10 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-blue-300">
              About ISHA DISHA
            </span>

            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Connecting Businesses.
              <span className="block text-blue-400">
                Creating Possibilities.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              ISHA DISHA brings diverse business services together to help
              clients explore opportunities, coordinate resources, and find
              practical solutions for their business needs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Explore Our Services
                <FaArrowRight size={12} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Contact Our Team
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-8">
              <div className="grid grid-cols-2 gap-4">
                {services.map(({ name, icon: Icon }) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-blue-400/50 hover:bg-white/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                      <Icon size={20} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">
                      {name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-blue-600 p-5">
                <p className="text-lg font-bold text-white">
                  Multiple services. One destination.
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Explore our business verticals and find a solution that
                  fits your requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
            Who We Are
          </p>

          <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            A versatile partner for your business needs
          </h2>

          <p className="mt-6 leading-8 text-slate-600">
            ISHA DISHA is presented as a multi-service business platform
            covering areas such as real estate, manpower, logistics, vendor
            supply, construction, borewell services, security, and
            consultancy.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Our goal is to make it easier for clients to discover relevant
            services, communicate their requirements, and connect with the
            right team for the next step.
          </p>

          <ul className="mt-7 space-y-4">
            {[
              "A range of business service categories",
              "Clear communication and requirement gathering",
              "A focus on dependable client relationships",
              "Solutions tailored to individual project needs",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <FaCheckCircle className="mt-1 shrink-0 text-blue-600" />
                <span className="text-sm leading-6 text-slate-700">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 sm:p-10">
            <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <FaBullseye size={24} />
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900">
                Our Purpose
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                To help customers navigate different business service
                requirements through a straightforward, professional, and
                customer-focused experience.
              </p>

              <div className="my-7 border-t border-slate-100" />

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <FaEye size={19} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Our Vision</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    To build lasting relationships by making business
                    services easier to discover and access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
              What Guides Us
            </p>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              The values behind our work
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Our approach is built around understanding client needs,
              communicating clearly, and working toward dependable outcomes.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Service overview */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
              What We Offer
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Our business verticals
            </h2>
          </div>

          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
          >
            View all services
            <FaArrowRight size={12} />
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {services.map(({ name, icon: Icon }) => (
            <Link
              key={name}
              to={`/services?category=${encodeURIComponent(name)}`}
              className="group rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
            >
              <Icon className="text-2xl text-blue-600 transition group-hover:scale-110" />
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                {name}
              </h3>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                Learn more <FaArrowRight size={10} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="px-5 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Have a project or business requirement?
              </h2>
              <p className="mt-3 leading-7 text-blue-100">
                Tell us what you need. Our contact page is the starting point
                for discussing your requirements.
              </p>
            </div>

            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Get in Touch
              <FaArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
