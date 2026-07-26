import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineLightningBolt, HiOutlineUserGroup, HiOutlineTrendingUp,
  HiOutlineShieldCheck, HiOutlineCode, HiOutlineDocumentText,
  HiArrowRight, HiOutlineStar, HiOutlineChevronDown, HiOutlineCheckCircle,
  HiOutlineAdjustments, HiOutlineSparkles, HiOutlineTerminal,
} from "react-icons/hi";
import { RiRocketLine, RiTrophyLine } from "react-icons/ri";

const stats = [
  { label: "Hackathons Hosted", value: "500+", change: "+42% this semester" },
  { label: "Active Participants", value: "50,000+", change: "From 120+ colleges" },
  { label: "Projects Submitted", value: "12,400+", change: "Stored on Cloudinary" },
  { label: "Prize Money Managed", value: "$2.5M+", change: "Transparent scoring" },
];

const features = [
  {
    icon: HiOutlineLightningBolt,
    color: "from-zinc-800 to-zinc-900",
    border: "group-hover:border-zinc-500",
    iconColor: "text-white",
    title: "Instant Hackathon Studio",
    desc: "Launch your hackathon in under 2 minutes. Configure themes, registration deadlines, team limits, and custom evaluation criteria effortlessly.",
  },
  {
    icon: HiOutlineUserGroup,
    color: "from-zinc-800 to-zinc-900",
    border: "group-hover:border-zinc-500",
    iconColor: "text-zinc-200",
    title: "Seamless Team Management",
    desc: "Eliminate WhatsApp tracking. Participants invite members via secure ID links, manage roles, and handle leadership transfers cleanly.",
  },
  {
    icon: HiOutlineTrendingUp,
    color: "from-zinc-800 to-zinc-900",
    border: "group-hover:border-zinc-500",
    iconColor: "text-white",
    title: "Live Aggregated Leaderboard",
    desc: "Real-time leaderboard powered by MongoDB aggregation pipelines. Automatically calculates weighted average scores across multiple judges.",
  },
  {
    icon: HiOutlineShieldCheck,
    color: "from-zinc-800 to-zinc-900",
    border: "group-hover:border-zinc-500",
    iconColor: "text-zinc-300",
    title: "Enterprise RBAC Security",
    desc: "Strict separation between Admin, Organizer, Participant, and Judge roles. Backend JWT verification ensures data integrity at every route.",
  },
  {
    icon: HiOutlineCode,
    color: "from-zinc-800 to-zinc-900",
    border: "group-hover:border-zinc-500",
    iconColor: "text-white",
    title: "Structured Submissions",
    desc: "No more lost Google Drive links. Collect GitHub repos, live demo URLs, video pitch links, screenshots, and presentation PDFs in one vault.",
  },
  {
    icon: HiOutlineAdjustments,
    color: "from-zinc-800 to-zinc-900",
    border: "group-hover:border-zinc-500",
    iconColor: "text-zinc-200",
    title: "Multi-Criterion Judging Engine",
    desc: "Judges receive dedicated scoring interfaces with per-criterion range sliders (Innovation, Complexity, UI/UX, Scalability) and feedback inputs.",
  },
];

const roleShowcase = {
  participant: {
    title: "Build & Compete",
    badge: "Participant Suite",
    desc: "Register for ongoing hackathons, form dream teams, upload project assets, and monitor live leaderboard standings in real time.",
    perks: [
      "Discover online, offline, and hybrid hackathons",
      "One-click team creation & member invite system",
      "Upload GitHub repo, live demo link, and Cloudinary media",
      "Real-time feedback from official judges",
    ],
    preview: {
      teamName: "Neural Hackers",
      status: "Approved & Submitted",
      project: "Hacklytics AI Agent",
      tech: ["React", "Express", "MongoDB", "Cloudinary"],
      score: "94.5 / 100",
    },
  },
  organizer: {
    title: "Organize & Manage",
    badge: "Organizer Studio",
    desc: "Create hackathons with multi-step wizards, manage team registrations, assign certified judges, and publish final winners.",
    perks: [
      "Set custom judging criteria & weightages",
      "Approve or reject team applications with email alerts",
      "Assign judges to specific submissions",
      "Automated winner declaration & result publishing",
    ],
    preview: {
      title: "National AI Buildathon 2026",
      registered: "128 Teams",
      submissions: "94 Projects",
      status: "Judging In Progress",
      action: "Assign Judges",
    },
  },
  judge: {
    title: "Review & Score",
    badge: "Judge Panel",
    desc: "Access a distilled evaluation interface designed to speed up project review with criteria sliders and structured feedback.",
    perks: [
      "Clean queue of assigned projects",
      "Per-criterion sliders (Innovation, Technical Complexity, UI/UX)",
      "Direct links to GitHub repositories & live demos",
      "Progress tracking for completed vs pending reviews",
    ],
    preview: {
      evaluating: "Project #42 — CodeForge AI",
      criteria: [
        { name: "Innovation", score: "19 / 20" },
        { name: "Technical Complexity", score: "24 / 25" },
        { name: "UI & Presentation", score: "18 / 20" },
      ],
      total: "61 / 65 pts",
    },
  },
  admin: {
    title: "Oversee & Control",
    badge: "Platform Admin",
    desc: "Full system governance. Track global analytics, manage users, block malicious accounts, and monitor platform metrics.",
    perks: [
      "Platform-wide activity & user analytics",
      "User role management & instant block/unblock",
      "Full oversight of all active & archived hackathons",
      "Database health & API route auditing",
    ],
    preview: {
      users: "52,410 Total Users",
      hackathons: "512 Hackathons",
      status: "System Normal (99.9% Uptime)",
      analytics: "Recharts Visualizations",
    },
  },
};

const faqs = [
  {
    q: "How does Hacklytics compute final leaderboard rankings?",
    a: "Hacklytics uses a MongoDB aggregation pipeline to compute the arithmetic average of total scores assigned across all judges who reviewed a specific submission. This ensures fairness even when multiple judges evaluate the same team.",
  },
  {
    q: "Can team leaders transfer leadership or remove inactive members?",
    a: "Yes! Team leaders can transfer leadership to any accepted team member or remove inactive members before the registration deadline directly from their Participant Dashboard.",
  },
  {
    q: "How does role-based access control (RBAC) work?",
    a: "Backend routes enforce role authorization using JWT middleware. Users are assigned one of four strict roles (Admin, Organizer, Participant, Judge), and the API rejects any unauthorized request with HTTP 403 Forbidden.",
  },
  {
    q: "Where are uploaded presentation PDFs and screenshots stored?",
    a: "Files are processed through Multer and uploaded directly to Cloudinary's cloud storage. Secure CDN URLs are persisted in MongoDB schemas for fast, reliable access during judging.",
  },
];

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeRole, setActiveRole] = useState("participant");
  const [activeFaq, setActiveFaq] = useState(null);

  const roleDashboards = {
    admin: "/admin",
    organizer: "/organizer",
    participant: "/participant",
    judge: "/judge",
  };
  const userDashboard = roleDashboards[user?.role] || "/participant";

  const currentRole = roleShowcase[activeRole];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-white/20 selection:text-white">
      <Navbar />

      {/* =========================================================
         1. HERO SECTION (Vercel / Linear Theme)
         ========================================================= */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Ambient Silver Spotlights */}
        <div className="blob w-[550px] h-[550px] bg-white/10 -top-20 left-1/2 -translate-x-1/2" />
        <div className="blob w-[400px] h-[400px] bg-zinc-400/8 top-40 -left-20" style={{ animationDelay: "3s" }} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column — Text & CTAs */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 text-left"
            >
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider mb-6 shadow-inner">
                <HiOutlineSparkles className="text-white text-sm animate-pulse" />
                Production MERN Hackathon Platform
              </div>

              {/* Headline (Compact & Refined) */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2] mb-4 text-white">
                Run Hackathons with <br className="hidden sm:inline" />
                <span className="gradient-text-glow">Monochrome SaaS Precision.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed mb-8">
                Replace Google Forms, WhatsApp groups, and spreadsheets with a single, high-contrast platform built for Participants, Organizers, Judges, and Admins.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10">
                {isAuthenticated ? (
                  <Link to={userDashboard} className="btn-primary text-sm px-7 py-3 justify-center font-bold">
                    <RiRocketLine className="text-base" /> Go to Dashboard <HiArrowRight />
                  </Link>
                ) : (
                  <Link to="/signup" className="btn-primary text-sm px-7 py-3 justify-center font-bold">
                    <RiRocketLine className="text-base" /> Get Started Free
                  </Link>
                )}
                <Link to="/hackathons" className="btn-secondary text-sm px-7 py-3 justify-center">
                  Browse Hackathons <HiArrowRight />
                </Link>
              </div>

              {/* Feature Highlights */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-zinc-800/80 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="text-white text-base" />
                  <span>Free for Colleges</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="text-white text-base" />
                  <span>Role-Based RBAC</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="text-white text-base" />
                  <span>Live Leaderboards</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column — Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2.5 shadow-2xl shadow-black group overflow-hidden">
                <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                  <img
                    src="/hackathon_hero.jpg"
                    alt="Hackathon Arena & Workstation"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating Overlay Badge */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Live Hackathon Arena</p>
                      <p className="text-[11px] text-zinc-400">500+ Developers Competing</p>
                    </div>
                    <span className="badge badge-success text-[10px]">Real-Time</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
         3. LIVE STATS STRIP
         ========================================================= */}
      <section className="border-y border-zinc-800 bg-[#0a0a0c] py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight gradient-text">{s.value}</p>
              <p className="text-sm font-semibold text-zinc-300 mt-1">{s.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.change}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
         4. BENTO GRID FEATURES
         ========================================================= */}
      <section className="py-14 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="section-tag mx-auto mb-4">Core Platform Features</div>
          <h2 className="section-title">Built for Modern Hackathons</h2>
          <p className="section-subtitle mx-auto">
            Everything your college needs to run world-class hackathons without relying on third-party forms or spreadsheets.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`card group relative overflow-hidden ${f.border}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} border border-zinc-700 flex items-center justify-center mb-5`}>
                <f.icon className={`text-2xl ${f.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-zinc-200 transition-colors">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================
         5. ROLE-BASED INTERACTIVE SHOWCASE
         ========================================================= */}
      <section className="py-24 px-4 sm:px-6 bg-[#0a0a0c] border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-tag mx-auto mb-4">Tailored Workflows</div>
            <h2 className="section-title">4 Roles. 1 Platform.</h2>
            <p className="section-subtitle mx-auto">
              Select a role to see how Hacklytics streamlines tasks for every stakeholder.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {Object.keys(roleShowcase).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                  activeRole === r
                    ? "bg-white text-black shadow-lg border border-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Active Role Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid lg:grid-cols-2 gap-8 items-center"
            >
              {/* Left details */}
              <div className="space-y-6">
                <div>
                  <span className="badge badge-primary mb-3">{currentRole.badge}</span>
                  <h3 className="text-3xl font-extrabold text-white">{currentRole.title}</h3>
                  <p className="text-zinc-400 mt-2 text-base leading-relaxed">{currentRole.desc}</p>
                </div>

                <div className="space-y-3">
                  {currentRole.perks.map((p) => (
                    <div key={p} className="flex items-center gap-3">
                      <HiOutlineCheckCircle className="text-white text-xl flex-shrink-0" />
                      <span className="text-zinc-200 text-sm font-medium">{p}</span>
                    </div>
                  ))}
                </div>

                <Link to="/signup" className="btn-primary inline-flex">
                  Test {currentRole.badge} <HiArrowRight />
                </Link>
              </div>

              {/* Right interactive preview mock */}
              <div className="card-glass border-zinc-700 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-mono text-zinc-400">ROLE DEMO PREVIEW</span>
                  <span className="badge badge-primary">ACTIVE ROUTE</span>
                </div>

                {activeRole === "participant" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-400">Team Name:</span><strong className="text-white">{currentRole.preview.teamName}</strong></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Project:</span><strong className="text-zinc-200">{currentRole.preview.project}</strong></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Status:</span><span className="badge badge-success">{currentRole.preview.status}</span></div>
                    <div className="flex gap-1.5 flex-wrap pt-2">
                      {currentRole.preview.tech.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                    </div>
                  </div>
                )}

                {activeRole === "organizer" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-400">Hackathon:</span><strong className="text-white">{currentRole.preview.title}</strong></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Registrations:</span><strong className="text-zinc-200">{currentRole.preview.registered}</strong></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Submissions:</span><strong className="text-zinc-300">{currentRole.preview.submissions}</strong></div>
                  </div>
                )}

                {activeRole === "judge" && (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold text-zinc-200">{currentRole.preview.evaluating}</p>
                    {currentRole.preview.criteria.map(c => (
                      <div key={c.name} className="flex justify-between text-xs border-b border-zinc-800 pb-1">
                        <span className="text-zinc-400">{c.name}</span>
                        <strong className="text-white">{c.score}</strong>
                      </div>
                    ))}
                    <div className="flex justify-between text-base font-bold pt-2">
                      <span className="text-zinc-200">Total Awarded:</span>
                      <span className="gradient-text">{currentRole.preview.total}</span>
                    </div>
                  </div>
                )}

                {activeRole === "admin" && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-400">Platform Users:</span><strong className="text-white">{currentRole.preview.users}</strong></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Total Hackathons:</span><strong className="text-zinc-200">{currentRole.preview.hackathons}</strong></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Health:</span><span className="badge badge-success">{currentRole.preview.status}</span></div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* =========================================================
         6. COMBINED FAQ (LEFT) + CTA (RIGHT) PERFECTLY ALIGNED
         ========================================================= */}
      <section className="py-14 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Section Header at top */}
        <div className="mb-6">
          <div className="section-tag mb-2">Questions & Answers</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        {/* 2-Column Grid starting at the exact same Y position */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column — 4 FAQ Boxes */}
          <div className="lg:col-span-7 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-0 overflow-hidden border-zinc-800">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left px-5 py-3.5 flex items-center justify-between font-semibold text-xs sm:text-sm text-zinc-200 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <HiOutlineChevronDown className={`text-base flex-shrink-0 transition-transform ${activeFaq === i ? "rotate-180 text-white" : "text-zinc-500"}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3 bg-zinc-950/60">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Column — CTA Box aligned perfectly with the 4 FAQ boxes */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="card-glass py-6 px-6 text-center relative overflow-hidden border-zinc-800 flex-1 flex flex-col justify-center items-center">
              <div className="blob w-40 h-40 bg-white/10 -top-8 -left-8" />
              <div className="blob w-40 h-40 bg-zinc-400/8 -bottom-8 -right-8" />

              <div className="relative z-10 w-full">
                <RiTrophyLine className="text-2.5xl text-white mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white tracking-tight mb-1.5">
                  Ready to Experience Hacklytics?
                </h3>
                <p className="text-zinc-400 text-xs max-w-xs mx-auto mb-5 leading-relaxed">
                  Build your team, launch a hackathon, or start judging projects today.
                </p>
                <div className="flex flex-col gap-2.5">
                  {isAuthenticated ? (
                    <Link to={userDashboard} className="btn-primary text-xs py-2.5 justify-center w-full font-bold">
                      Go to Dashboard <HiArrowRight />
                    </Link>
                  ) : (
                    <Link to="/signup" className="btn-primary text-xs py-2.5 justify-center w-full font-bold">
                      Create Your Free Account <HiArrowRight />
                    </Link>
                  )}
                  <Link to="/hackathons" className="btn-secondary text-xs py-2.5 justify-center w-full">
                    Explore Active Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
         8. FOOTER
         ========================================================= */}
      <footer className="border-t border-zinc-800 bg-[#050505] py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <RiRocketLine className="text-black text-base font-bold" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Hack<span className="text-zinc-400">lytics</span>
            </span>
          </div>

          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Hacklytics MERN Capstone. Production SaaS Architecture.
          </p>

          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <Link to="/hackathons" className="hover:text-white transition-colors">Hackathons</Link>
            <Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
