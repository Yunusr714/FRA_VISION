import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useNavigate } from "react-router-dom";

// Carousel images (replace or add your own as needed)
const carouselImages = [
  {
    src: "https://realmafricasafaris.com/wp-content/uploads/2019/01/Meet-the-Batwa-Tribe-of-Bwindi.jpg",
    alt: "Indigenous community near forest landscape",
  },
  {
    src: "https://images.pexels.com/photos/167684/pexels-photo-167684.jpeg?auto=compress&w=1600&q=80",
    alt: "Dense forest canopy",
  },
  {
    src: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&w=1600&q=80",
    alt: "Tribal community gathering outdoors",
  },
];

export default function Index() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-green-100 text-slate-800 font-sans">
      {/* Header */}
      <header className="px-8 py-4 flex justify-between items-center bg-white/85 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center">
            <img
              src="/emblem.png"
              alt="Emblem"
              className="object-contain w-11 h-11"
              loading="lazy"
            />
          </div>
          <div>
            <span className="block font-bold text-xl text-emerald-700">
              FRA Atlas Dashboard
            </span>
            <span className="block text-xs text-gray-500">
              Ministry of Tribal Affairs
            </span>
          </div>
        </div>
        <nav className="flex items-center gap-7 text-sm md:text-base">
          <a
            href="#top"
            className="text-green-700 font-semibold hover:underline"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-green-700 font-semibold hover:underline"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-green-700 font-semibold hover:underline"
          >
            About
          </a>
          <a
            href="#footer"
            className="text-green-700 font-semibold hover:underline"
          >
            Help
          </a>
        </nav>
      </header>

      {/* Hero Section with Carousel as Background */}
      <section
        id="top"
        className="relative w-full min-h-[640px] flex items-center justify-center"
      >
        {/* Carousel as BG */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Carousel
            showThumbs={false}
            showStatus={false}
            infiniteLoop
            autoPlay
            interval={4200}
            transitionTime={900}
            showArrows={false}
            showIndicators={false}
            swipeable
            emulateTouch
            className="w-full h-full"
            renderItem={(item, props) => (
              <div {...props} className="w-full h-full">
                <img
                  src={item.props.src}
                  alt={item.props.alt}
                  className="object-cover w-full h-[640px] brightness-[0.55]"
                  loading="lazy"
                  style={{ width: "100vw", height: "640px" }}
                />
              </div>
            )}
          >
            {carouselImages.map((img, i) => (
              <img key={i} src={img.src} alt={img.alt} />
            ))}
          </Carousel>
          {/* Overlay (fixed invalid color classes from previous version) */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-emerald-950/30 to-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center pt-10 pb-16 md:pt-20 md:pb-24 px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-6 drop-shadow-xl leading-tight max-w-4xl">
            Empowering Forest Rights with Digital Innovation
          </h1>
          <p className="text-lg md:text-xl text-center text-emerald-100/95 drop-shadow max-w-2xl mx-auto mb-9 font-medium leading-relaxed">
            FRA Atlas provides transparent, efficient, and secure forest rights
            management for tribal communities across India.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-emerald-700 hover:to-green-700 text-white px-10 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-emerald-400/25 transition focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/help")}
              className="bg-white/75 hover:bg-white border border-emerald-200 text-emerald-700 px-10 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-emerald-300/30 transition backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-white via-emerald-50 to-green-100"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-emerald-800 mb-4">
            Key Features
          </h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-14">
            A unified digital ecosystem for forest rights recognition,
            monitoring, and transparent governance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "3D Forest Mapping",
                desc: "Interactive 3D geospatial layers integrating satellite, drone & cadastral data.",
                icon: (
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <path d="M12 2 2 7l10 5 10-5-10-5Z" fill="#10b981" />
                    <path
                      d="m2 12 10 5 10-5"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <path
                      d="m2 17 10 5 10-5"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  </svg>
                ),
              },
              {
                title: "Blockchain Security",
                desc: "Immutable claim ledger and tamper-evident audit trails.",
                icon: (
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="5"
                      fill="#059669"
                    />
                    <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" />
                  </svg>
                ),
              },
              {
                title: "Real-Time Analytics",
                desc: "Dashboards tracking claim progress, demographic coverage & conservation metrics.",
                icon: (
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="3"
                      fill="#34d399"
                    />
                    <path
                      d="M8 16V8m4 8v-5m4 5v-2"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
              },
              {
                title: "Role-Based Access",
                desc: "Multi-level approvals for districts, states, committees & community actors.",
                icon: (
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="10" r="4" fill="#34d399" />
                    <path
                      d="M4 20c0-2.2 3.6-4 8-4s8 1.8 8 4"
                      stroke="#059669"
                      strokeWidth="2"
                    />
                  </svg>
                ),
              },
              {
                title: "Field Mobility",
                desc: "Offline-ready data capture & geo-tagged evidence collection.",
                icon: (
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <rect
                      x="6"
                      y="2"
                      width="12"
                      height="20"
                      rx="3"
                      fill="#10b981"
                    />
                    <circle cx="12" cy="18" r="1.5" fill="#fff" />
                  </svg>
                ),
              },
              {
                title: "Conservation Monitoring",
                desc: "Encroachment alerts, biodiversity layers & forest health indices.",
                icon: (
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M12 21c-5-4-7-7.5-7-10.5C5 7.2 7.7 4.5 11 4.5c1.2 0 2.3.4 3.2 1 .9-.6 2-1 3.2-1 3.3 0 6 2.7 6 6 0 3-2 6.5-7 10.5h-4Z"
                      fill="#059669"
                    />
                  </svg>
                ),
              },
            ].map((f, i) => {
              const routeMap: Record<string, string> = {
                "3D Forest Mapping": "/atlas",
                "Blockchain Security": "/dashboard",
                "Real-Time Analytics": "/reports",
                "Role-Based Access": "/dashboard",
                "Field Mobility": "/tasks",
                "Conservation Monitoring": "/planning",
              };
              const target = routeMap[f.title];
              return (
                <div
                  key={i}
                  role={target ? "button" : undefined}
                  tabIndex={target ? 0 : undefined}
                  onClick={() => target && navigate(target)}
                  onKeyDown={(e) => {
                    if (target && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      navigate(target);
                    }
                  }}
                  className="bg-white/90 rounded-xl p-7 shadow-lg flex flex-col items-center text-center transition hover:scale-[1.035] hover:shadow-emerald-300/30 border border-emerald-100"
                >
                  <div className="mb-4">{f.icon}</div>
                  <div className="font-bold text-lg text-emerald-700 mb-2">
                    {f.title}
                  </div>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section
        id="about"
        className="relative py-24 bg-white/70 backdrop-blur-sm border-t border-emerald-100"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-100 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            {/* Left: Narrative */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-6">
                About FRA Atlas
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                FRA Atlas is a digital platform accelerating the recognition of
                forest rights under India&apos;s Forest Rights Act (FRA). It
                brings together authenticated spatial layers, claim lifecycle
                management, blockchain-backed transparency, and inclusive data
                access for government bodies, civil society, and tribal
                communities.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                By integrating geospatial intelligence with workflow automation,
                the platform reduces bottlenecks, improves accuracy, and
                increases accountability at every administrative level. Custom
                analytics empower decision-makers to identify gaps, monitor
                progress, and strengthen conservation outcomes while
                safeguarding livelihoods.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 mt-8">
                {[
                  { label: "Districts Connected", value: "500+" },
                  { label: "Communities Supported", value: "12k+" },
                  { label: "Avg. Approval Speed-Up", value: "4.2x" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-emerald-600/90 text-white rounded-xl px-4 py-6 text-center shadow-md"
                  >
                    <div className="text-2xl font-extrabold tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-emerald-100/90 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mission / Timeline / Pillars */}
            <div className="space-y-10">
              <div className="bg-white/90 shadow-lg rounded-2xl p-8 border border-emerald-100">
                <h3 className="text-xl font-semibold text-emerald-700 mb-4">
                  Mission & Principles
                </h3>
                <ul className="space-y-3 text-gray-700 text-sm leading-relaxed">
                  <li>
                    <span className="font-semibold text-emerald-700">
                      Inclusion:
                    </span>{" "}
                    Empower tribal communities through accessible tools &
                    multilingual interfaces.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-700">
                      Transparency:
                    </span>{" "}
                    Blockchain-secured claim and evidence ledger for
                    verifiability.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-700">
                      Sustainability:
                    </span>{" "}
                    Harmonize rights recognition with conservation priorities.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-700">
                      Data Ethics:
                    </span>{" "}
                    Privacy-first architecture with granular permission layers.
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl p-8 shadow-lg text-white">
                <h3 className="text-xl font-semibold mb-4">Roadmap Snapshot</h3>
                <ol className="space-y-3 text-sm leading-relaxed">
                  <li className="flex gap-3">
                    <span className="font-bold">Q1:</span>
                    Expanded satellite mosaic integration & automated boundary
                    conflict detection.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">Q2:</span>
                    Mobile field survey offline mode + voice-assisted claims
                    entry.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">Q3:</span>
                    AI-driven prioritization for pending claim clusters.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">Q4:</span>
                    Predictive encroachment heatmaps & biodiversity overlays.
                  </li>
                </ol>
              </div>

              <div className="bg-white/90 shadow-lg rounded-2xl p-6 border border-emerald-100">
                <h3 className="text-lg font-semibold text-emerald-700 mb-3">
                  Stakeholder Engagement
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  FRA Atlas is co-evolving with inputs from district officials,
                  Gram Sabhas, forest officers, legal researchers, and policy
                  experts—ensuring it remains grounded, interoperable, and
                  outcomes-focused.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-600 to-green-500 rounded-3xl shadow-xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Forest Rights?
          </h2>
          <p className="mb-8 text-lg leading-relaxed max-w-3xl mx-auto">
            Join administrators, researchers, and communities using FRA Atlas to
            accelerate recognition while safeguarding ecological integrity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-white text-emerald-700 font-semibold px-10 py-3 rounded-lg shadow hover:bg-emerald-50 transition focus-visible:ring-2 focus-visible:ring-white"
            >
              Access Dashboard
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-emerald-800/30 border border-white/25 hover:bg-emerald-700/40 text-white font-semibold px-10 py-3 rounded-lg shadow transition focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer"
        className="bg-emerald-950 text-emerald-50 pt-16 pb-10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),rgba(6,78,59,0))]" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 mb-14">
            {/* Column 1 */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/emblem.png"
                  alt="Emblem"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <div className="font-bold text-lg tracking-tight">
                    FRA Atlas
                  </div>
                  <div className="text-xs uppercase tracking-wide text-emerald-200">
                    Ministry of Tribal Affairs
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-emerald-200 mb-5 max-w-sm">
                A secure, data-driven platform enabling rightful recognition of
                forest resource access and stewardship while supporting
                biodiversity conservation and community resilience.
              </p>
              <div className="flex gap-3">
                {[
                  { label: "X", href: "#" },
                  { label: "YT", href: "#" },
                  { label: "IN", href: "#" },
                  { label: "FB", href: "#" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="w-9 h-9 rounded-md bg-emerald-800/50 hover:bg-emerald-600 flex items-center justify-center text-xs font-semibold tracking-wide transition"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="font-semibold text-emerald-200 mb-4 tracking-wide">
                Platform
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Data Layers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    API Access
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="font-semibold text-emerald-200 mb-4 tracking-wide">
                Resources
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    User Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Training Modules
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Reports & Insights
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="font-semibold text-emerald-200 mb-4 tracking-wide">
                Contact
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-emerald-300">Support:</span>{" "}
                  support@fra-atlas.gov.in
                </li>
                <li>
                  <span className="text-emerald-300">Helpdesk:</span>{" "}
                  1800-000-000
                </li>
                <li>New Delhi, India</li>
                <li>
                  <a href="#" className="underline hover:text-white">
                    Submit Feedback
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5 (Newsletter) */}
            <div>
              <h4 className="font-semibold text-emerald-200 mb-4 tracking-wide">
                Stay Updated
              </h4>
              <p className="text-sm text-emerald-200 mb-4">
                Get updates on releases, features & training workshops.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // handle subscribe
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="w-full px-4 py-2 rounded-md bg-emerald-800/40 border border-emerald-700 placeholder-emerald-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-500 text-white font-semibold py-2 rounded-md text-sm shadow focus-visible:ring-2 focus-visible:ring-white/70 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Lower Bar */}
          <div className="border-t border-emerald-800/60 pt-6 flex flex-col lg:flex-row gap-4 items-center justify-between text-[11px] md:text-xs text-emerald-300">
            <div>
              © {new Date().getFullYear()} Ministry of Tribal Affairs,
              Government of India. All rights reserved.
            </div>
            <div className="flex gap-4 flex-wrap">
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
              <span className="opacity-40">|</span>
              <a href="#" className="hover:text-white">
                Terms of Use
              </a>
              <span className="opacity-40">|</span>
              <a href="#" className="hover:text-white">
                Data Policy
              </a>
              <span className="opacity-40">|</span>
              <a href="#" className="hover:text-white">
                RTI Compliance
              </a>
            </div>
            <div className="text-[10px] md:text-[11px] opacity-70">
              v1.0.0-beta • Secure Build
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
