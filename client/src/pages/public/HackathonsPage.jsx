import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { hackathonAPI } from "../../services/apiServices";
import { format } from "date-fns";
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlineCalendar,
  HiOutlineLocationMarker, HiOutlineUsers, HiOutlineCurrencyDollar,
  HiOutlineX,
} from "react-icons/hi";

const statusColors = {
  upcoming: "badge-info",
  registration_open: "badge-success",
  registration_closed: "badge-warning",
  ongoing: "badge-primary",
  completed: "badge-gray",
  draft: "badge-gray",
};

const statusLabels = {
  upcoming: "Upcoming",
  registration_open: "Registration Open",
  registration_closed: "Reg. Closed",
  ongoing: "Ongoing",
  completed: "Completed",
  draft: "Draft",
};

const HackathonCard = ({ hackathon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card group cursor-pointer overflow-hidden p-0 flex flex-col"
  >
    {/* Banner */}
    <div className="relative h-44 bg-gradient-to-br from-indigo-900/60 to-violet-900/60 overflow-hidden">
      {hackathon.bannerImage || hackathon.banner ? (
        <img
          src={hackathon.bannerImage || hackathon.banner}
          alt={hackathon.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-4xl opacity-30">🏆</div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
      <div className="absolute top-3 left-3">
        <span className={`badge ${statusColors[hackathon.status] || "badge-gray"}`}>
          {statusLabels[hackathon.status] || hackathon.status}
        </span>
      </div>
      <div className="absolute top-3 right-3">
        <span className="badge badge-gray capitalize">{hackathon.mode}</span>
      </div>
    </div>

    {/* Content */}
    <div className="p-5 flex flex-col flex-1">
      <h3 className="font-bold text-slate-100 mb-1 text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-1">
        {hackathon.title}
      </h3>
      <p className="text-xs text-indigo-400 font-medium mb-2">{hackathon.theme}</p>
      <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{hackathon.description}</p>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <HiOutlineCalendar />
          {format(new Date(hackathon.startDate), "MMM d")} — {format(new Date(hackathon.endDate), "MMM d, yyyy")}
        </div>
        {hackathon.venue && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HiOutlineLocationMarker />
            {hackathon.venue}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <HiOutlineUsers />
            Up to {hackathon.maxTeamSize} members
          </div>
          {hackathon.prizePool && (
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <HiOutlineCurrencyDollar />
              {hackathon.prizePool}
            </div>
          )}
        </div>
      </div>

      <div className="btn-primary btn-sm mt-4 justify-center">
        View Details
      </div>
    </div>
  </motion.div>
);

const HackathonsPage = () => {
  const { isAuthenticated } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ mode: "", status: "", registrationOpen: "" });

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (filters.mode) params.mode = filters.mode;
      if (filters.status) params.status = filters.status;
      if (filters.registrationOpen !== "") params.registrationOpen = filters.registrationOpen;

      const res = await hackathonAPI.getAll(params);
      const d = res.data.data;
      setHackathons(d.hackathons);
      setTotal(d.total);
      setPages(d.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    const t = setTimeout(fetchHackathons, 300);
    return () => clearTimeout(t);
  }, [fetchHackathons]);

  const clearFilters = () => {
    setSearch("");
    setFilters({ mode: "", status: "", registrationOpen: "" });
    setPage(1);
  };

  const hasFilters = search || filters.mode || filters.status || filters.registrationOpen !== "";

  const pageContent = (
    <div className={isAuthenticated ? "max-w-7xl mx-auto space-y-6" : "pt-24 pb-16 px-4 max-w-7xl mx-auto"}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-100">
          Browse <span className="gradient-text">Hackathons</span>
        </h1>
        <p className="text-slate-400 mt-1">{total} hackathons available</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search hackathons by title, theme or description..."
            className="input-field pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <HiOutlineX />
            </button>
          )}
        </div>

        <select
          value={filters.mode}
          onChange={(e) => { setFilters(f => ({ ...f, mode: e.target.value })); setPage(1); }}
          className="input-field md:w-36"
        >
          <option value="">All Modes</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          className="input-field md:w-44"
        >
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="registration_open">Registration Open</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.registrationOpen}
          onChange={(e) => { setFilters(f => ({ ...f, registrationOpen: e.target.value })); setPage(1); }}
          className="input-field md:w-44"
        >
          <option value="">Registration</option>
          <option value="true">Open Now</option>
          <option value="false">Closed</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost btn-sm text-slate-400 flex items-center gap-1">
            <HiOutlineX /> Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="spinner" />
        </div>
      ) : hackathons.length === 0 ? (
        <div className="empty-state py-20 card">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-slate-300 font-semibold">No hackathons found</p>
          <p className="text-slate-500 text-sm mt-1">Try resetting your filters or search query</p>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary btn-sm mt-4">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((h) => (
            <Link key={h._id} to={`/hackathons/${h._id}`}>
              <HackathonCard hackathon={h} />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                page === p ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-secondary btn-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  if (isAuthenticated) {
    return <DashboardLayout>{pageContent}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      {pageContent}
    </div>
  );
};

export default HackathonsPage;
