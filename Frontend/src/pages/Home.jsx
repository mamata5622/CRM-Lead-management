import React from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
  FaBuilding,
  FaUsers,
  FaTruck,
  FaTools,
  FaHardHat,
  FaWater,
  FaShieldAlt,
  FaHandshake,
  FaCheckCircle,
  FaPhoneAlt,
  FaLightbulb,
  FaChartLine,
} from "react-icons/fa";

const services = [
  {
    title: "Real Estate",
    description:
      "Property-related solutions designed around your business and investment requirements.",
    icon: <FaBuilding />,
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Manpower Services",
    description:
      "Workforce support to help businesses meet their staffing and operational needs.",
    icon: <FaUsers />,
    color: "bg-purple-100 text-purple-700",
  },
  {
    title: "Logistics",
    description:
      "Practical logistics and coordination support for smooth business operations.",
    icon: <FaTruck />,
    color: "bg-orange-100 text-orange-700",
  },
  {
    title: "Vendor Supply",
    description:
      "Supply and sourcing support to help keep your projects and operations moving.",
    icon: <FaHandshake />,
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Construction",
    description:
      "Construction-related support for projects, infrastructure, and development.",
    icon: <FaHardHat />,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    title: "Borewell Services",
    description:
      "Borewell-related solutions based on your site and project requirements.",
    icon: <FaWater />,
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    title: "Security Services",
    description:
      "Security support to help businesses protect their premises and operations.",
    icon: <FaShieldAlt />,
    color: "bg-red-100 text-red-700",
  },
  {
    title: "Business Consultancy",
    description:
      "Business guidance and practical support tailored to your requirements.",
    icon: <FaLightbulb />,
    color: "bg-indigo-100 text-indigo-700",
  },
];

const highlights = [
  {
    icon: <FaCheckCircle />,
    title: "Customer-Focused",
    description:
      "We aim to understand your requirements and provide suitable solutions.",
  },
  {
    icon: <FaHandshake />,
    title: "Reliable Partnerships",
    description:
      "We value clear communication and long-term professional relationships.",
  },
  {
    icon: <FaChartLine />,
    title: "Multiple Solutions",
    description:
      "Access a range of business services through one point of contact.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative isolate bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white">
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-indigo-400 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Welcome to ISHA DISHA
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your Trusted Partner for{" "}
              <span className="text-blue-300">Business Solutions</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              From real estate and manpower to logistics, construction, vendor
              supply, security, and consultancy, explore business services
              designed to support your requirements.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-500 px-7 py-4 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-400"
              >
                Explore Our Services
                <FaArrowRight />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Contact Us
                <FaPhoneAlt />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                Multiple Service Categories
              </span>
              <span className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                Customer-Focused Approach
              </span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-3xl bg-blue-400/20 blur-2xl" />

            <div className="relative rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md sm:p-7">
              <div className="rounded-2xl bg-white p-6 text-gray-800 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      ISHA DISHA
                    </p>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                      Solutions That Connect
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700">
                    <FaBuilding />
                  </div>
                </div>

                <p className="mt-4 leading-7 text-gray-600">
                  Explore services for your projects, workforce, supply needs,
                  and business operations.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  {services.slice(0, 4).map((service) => (
                    <div
                      key={service.title}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${service.color}`}
                      >
                        {service.icon}
                      </div>
                      <p className="mt-3 text-sm font-semibold">
                        {service.title}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  to="/services"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  View All Services <FaArrowRight />
                </Link>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-gray-100 bg-white p-4 text-gray-800 shadow-xl sm:block md:-left-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl text-green-700">
                  <FaHandshake />
                </div>
                <div>
                  <p className="font-bold">Building Connections</p>
                  <p className="text-sm text-gray-500">
                    One requirement at a time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-5 py-20 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              What We Offer
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Our Business Services
            </h2>

            <p className="mt-5 leading-7 text-gray-600">
              Discover our range of service categories and find the support that
              best matches your needs.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition group-hover:scale-105 ${service.color}`}
                >
                  {service.icon}
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {service.title}
                </h3>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-gray-600">
                  {service.description}
                </p>

                <Link
                  to={`/contact?service=${encodeURIComponent(service.title)}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3"
                >
                  Enquire Now <FaArrowRight />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-7 py-3.5 font-semibold text-gray-800 transition hover:border-blue-600 hover:text-blue-700"
            >
              View All Services <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-50 px-5 py-20 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-700 p-8 text-white sm:p-12">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                  <FaBuilding className="text-3xl text-blue-200" />
                  <p className="mt-4 font-semibold">Business Solutions</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                  <FaUsers className="text-3xl text-blue-200" />
                  <p className="mt-4 font-semibold">Workforce Support</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                  <FaTruck className="text-3xl text-blue-200" />
                  <p className="mt-4 font-semibold">Logistics Support</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                  <FaTools className="text-3xl text-blue-200" />
                  <p className="mt-4 font-semibold">Project Services</p>
                </div>
              </div>

              <p className="mt-8 text-center text-xl font-bold sm:text-2xl">
                Different Needs. Connected Solutions.
              </p>
            </div>
          </div>

          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              About ISHA DISHA
            </span>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
              A Practical Approach to Your Business Needs
            </h2>

            <p className="mt-5 leading-8 text-gray-600">
              ISHA DISHA brings together multiple business service categories to
              make it easier for customers to explore solutions for their
              different requirements.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              Our approach focuses on understanding each enquiry, maintaining
              clear communication, and identifying suitable service options
              based on the customer's needs.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "A range of service categories",
                "A customer-focused approach",
                "Direct enquiry and communication",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <FaCheckCircle className="mt-1 shrink-0 text-lg text-green-600" />
                  <span className="font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <Link
              to="/about"
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-blue-700 px-7 py-4 font-semibold text-white transition hover:bg-blue-800"
            >
              Learn More About Us <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="px-5 py-20 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              Why Choose Us
            </span>

            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Focused on Your Requirements
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-100 p-7 text-center transition hover:-translate-y-1 hover:shadow-lg sm:p-9"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-5 pb-20 sm:px-8 md:pb-24 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Have a Project or Business Requirement?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
            Tell us what you need. Contact ISHA DISHA to discuss your
            requirements and explore the available service options.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 font-bold text-blue-800 transition hover:bg-blue-50"
            >
              Get in Touch <FaArrowRight />
            </Link>

            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/40 px-7 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
