import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI } from "../../services/apiServices";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineTrash, HiOutlineSearch, HiOutlineExternalLink,
  HiOutlineCog, HiOutlineFilter,
} from "react-icons/hi";

const statusColors = {
  draft:               "badge-gray",
  upcoming:            "badge-primary",
  registration_open:   "badge-success",
  registration_closed: "badge-warning",
  ongoing:             "badge-primary",
  completed:           "badge-gray",
  cancelled:           "badge-danger",
};

const AdminHackathonsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      // Use admin endpoint to see ALL hackathons including drafts
      const params = { page, limit: 20, sort: "-createdAt" };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await hackathonAPI.getAllAdmin(params);
      const d   = res.data.data;
      setHackathons(d.hackathons);
      setTotal(d.total);
      setPages(d.pages);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load hackathons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchHackathons, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, page]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this hackathon? This cannot be undone.")) return;
    try {
      await hackathonAPI.delete(id);
      toast.success("Hackathon deleted");
      fetchHackathons();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">All Hackathons</h1>
            <p className="text-slate-500 text-sm">{total} total (including drafts)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search hackathons..."
              className="input-field pl-9"
            />
          </div>
          <div className="relative">
            <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field pl-9 w-48"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="registration_open">Registration Open</option>
              <option value="registration_closed">Registration Closed</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organizer</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>
                    ))
                  : hackathons.map(h => (
                      <tr key={h._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            {h.bannerImage && (
                              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={h.bannerImage} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-200 text-sm line-clamp-1">{h.title}</p>
                              <p className="text-xs text-slate-500">{h.theme}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-400 text-sm">{h.organizer?.name || "—"}</td>
                        <td>
                          <span className={`badge ${statusColors[h.status] || "badge-gray"} capitalize text-[10px]`}>
                            {h.status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="text-slate-500 text-sm capitalize">{h.mode}</td>
                        <td className="text-slate-500 text-xs">
                          {h.startDate ? format(new Date(h.startDate), "MMM d, yyyy") : "—"}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {/* Public preview */}
                            <Link
                              to={`/hackathons/${h._id}`}
                              target="_blank"
                              className="btn-ghost btn-sm text-zinc-400"
                              title="View public page"
                            >
                              <HiOutlineExternalLink />
                            </Link>
                            {/* Manage (via organizer manage page — admin can view it) */}
                            <Link
                              to={`/organizer/hackathons/${h._id}/manage`}
                              className="btn-ghost btn-sm text-indigo-400"
                              title="Manage hackathon"
                            >
                              <HiOutlineCog />
                            </Link>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(h._id)}
                              className="btn-ghost btn-sm text-red-400"
                              title="Delete hackathon"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
          {!loading && hackathons.length === 0 && (
            <div className="empty-state py-10"><p>No hackathons found</p></div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Prev</button>
            <span className="flex items-center text-sm text-slate-400">Page {page} of {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary btn-sm">Next</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminHackathonsPage;
