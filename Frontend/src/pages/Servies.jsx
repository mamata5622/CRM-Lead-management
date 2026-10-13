import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  FaBuilding,
  FaUsers,
  FaTruck,
  FaBoxes,
  FaTools,
  FaTint,
  FaShieldAlt,
  FaChartLine,
  FaArrowRight,
  FaCheckCircle,
  FaSearch,
  FaLayerGroup,
} from "react-icons/fa";

const services = [
  {
    name: "Real Estate",
    icon: FaBuilding,
    category: "Property",
    description:
      "Explore property-related services and discuss your real estate requirements with our team.",
    features: [
      "Property requirement discussions",
      "Real estate service coordination",
      "Project-specific enquiries",
    ],
  },
  {
    name: "Manpower",
    icon: FaUsers,
    category: "Workforce",
    description:
      "Discuss workforce requirements, staffing needs, and manpower coordination for your operations.",
    features: [
      "Workforce requirement planning",
      "Staffing enquiries",
      "Manpower coordination",
    ],
  },
  {
    name: "Logistics",
    icon: FaTruck,
    category: "Transport",
    description:
      "Explore logistics and transport-related requirements for your business and projects.",
    features: [
      "Transport enquiries",
      "Logistics requirement discussions",
      "Project coordination",
    ],
  },
  {
    name: "Vendor Supply",
    icon: FaBoxes,
    category: "Supply",
    description:
      "Discuss supply, sourcing, and procurement requirements for your organization.",
    features: [
      "Supply enquiries",
      "Vendor coordination",
      "Procurement discussions",
    ],
  },
  {
    name: "Construction",
    icon: FaTools,
    category: "Projects",
    description:
      "Share your construction and project requirements to explore suitable service options.",
    features: [
      "Construction enquiries",
      "Project requirement discussions",
      "Service coordination",
    ],
  },
  {
    name: "Borewell",
    icon: FaTint,
    category: "Water Solutions",
    description:
      "Contact our team to discuss borewell and water-related service requirements.",
    features: [
      "Borewell enquiries",
      "Site requirement discussions",
      "Water solution coordination",
    ],
  },
  {
    name: "Security",
    icon: FaShieldAlt,
    category: "Protection",
    description:
      "Discuss security-related requirements for your premises, projects, or operations.",
    features: [
      "Security requirement discussions",
      "Site-specific enquiries",
      "Service coordination",
    ],
  },
  {
    name: "Consultancy",
    icon: FaChartLine,
    category: "Advisory",
    description:
      "Share your business requirements to discuss potential consultancy and advisory services.",
    features: [
      "Business requirement discussions",
      "Project consultation enquiries",
      "Service planning",
    ],
  },
];

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
  }, [searchParams]);

  const categories = useMemo(
    () => [...new Set(services.map((service) => service.category))],
    [],
  );

  const filteredServices = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        !selectedCategory || service.name === selectedCategory;

      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchValue]);

  const chooseCategory = (category) => {
    setSelectedCategory(category);

    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchValue("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950" />
        <div className="absolute -right-20 top-0 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-10 -z-10 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-blue-300">
              <FaLayerGroup />
              Our Services
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Business solutions
              <span className="block text-blue-400">for diverse needs.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Explore our business verticals, find the category relevant to your
              requirements, and contact us to discuss your project.
            </p>

            <a
              href="#all-services"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Explore Services
              <FaArrowRight size={12} />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {services.slice(0, 4).map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  chooseCategory(name);
                  document
                    .getElementById("all-services")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:border-blue-400/50 hover:bg-white/10"
              >
                <Icon className="shrink-0 text-blue-300" size={19} />
                <span className="text-xs font-semibold text-white sm:text-sm">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Service listing */}
      <section
        id="all-services"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[2px] text-blue-600">
            Discover Our Expertise
          </p>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Find the right service
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Browse our service categories or search for the area related to your
            business needs.
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mt-9 max-w-xl">
          <label htmlFor="service-search" className="sr-only">
            Search services
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
            <FaSearch className="shrink-0 text-slate-400" />
            <input
              id="service-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search services..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => chooseCategory("")}
            className={[
              "rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm",
              !selectedCategory
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700",
            ].join(" ")}
          >
            All Services
          </button>

          {services.map(({ name }) => (
            <button
              key={name}
              type="button"
              onClick={() => chooseCategory(name)}
              className={[
                "rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm",
                selectedCategory === name
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700",
              ].join(" ")}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mt-9 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {filteredServices.length}
            </span>{" "}
            {filteredServices.length === 1 ? "service" : "services"}
          </p>

          {(selectedCategory || searchValue) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Cards */}
        {filteredServices.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map(
              ({ name, icon: Icon, category, description, features }) => (
                <article
                  key={name}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={22} />
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">
                      {category}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {name}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {description}
                  </p>

                  <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"
                      >
                        <FaCheckCircle className="mt-1 shrink-0 text-blue-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/contact?service=${encodeURIComponent(name)}`}
                    className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm font-bold text-blue-700 transition group-hover:text-blue-900"
                  >
                    Enquire about service
                    <FaArrowRight
                      size={13}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center">
            <FaSearch className="mx-auto text-3xl text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-800">
              No services found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try a different search or clear your filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Show all services
            </button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-slate-50 px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 sm:p-10 md:flex-row md:items-center md:justify-between lg:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Have a specific requirement?
            </h2>
            <p className="mt-3 text-sm leading-7 text-blue-100 sm:text-base">
              Tell us about your needs so we can discuss the appropriate next
              steps.
            </p>
          </div>

          <Link
            to="/contact"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
          >
            Contact Us
            <FaArrowRight size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
