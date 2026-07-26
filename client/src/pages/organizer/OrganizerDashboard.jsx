import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, registrationAPI, submissionAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";
import {
  HiOutlineCollection, HiOutlineClipboardList, HiOutlineDocumentText,
  HiOutlinePlus, HiArrowRight, HiOutlineUserGroup, HiOutlineExternalLink,
} from "react-icons/hi";
import { RiTrophyLine } from "react-icons/ri";

const statusColor = {
  draft:               "badge-gray",
  upcoming:            "badge-primary",
  registration_open:   "badge-success",
  registration_closed: "badge-warning",
  ongoing:             "badge-primary",
  completed:           "badge-gray",
};

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [totalRegs, setTotalRegs] = useState(0);
  const [totalSubs, setTotalSubs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hackathonAPI.getMy()
      .then(async (r) => {
        const list = r.data.data.hackathons || [];
        setHackathons(list);

        if (list.length > 0) {
          const [regResults, subResults] = await Promise.allSettled([
            Promise.all(list.map(h => registrationAPI.getByHackathon(h._id))),
            Promise.all(list.map(h => submissionAPI.getByHackathon(h._id))),
          ]);

          if (regResults.status === "fulfilled") {
            const regs = regResults.value.reduce(
              (acc, r) => acc + (r.data.data.registrations?.length || 0), 0
            );
            setTotalRegs(regs);
          }

          if (subResults.status === "fulfilled") {
            const subs = subResults.value.reduce(
              (acc, r) => acc + (r.data.data.submissions?.length || 0), 0
            );
            setTotalSubs(subs);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const regOpen = hackathons.filter(h => h.registrationOpen).length;

  const stats = [
    { label: "Total Hackathons",     value: hackathons.length, icon: HiOutlineCollection,    color: "bg-indigo-500/15 text-indigo-400" },
    { label: "Registration Open",    value: regOpen,          icon: HiOutlineClipboardList, color: "bg-emerald-500/15 text-emerald-400" },
    { label: "Total Registrations",  value: totalRegs,      icon: HiOutlineUserGroup,     color: "bg-amber-500/15 text-amber-400" },
    { label: "Submissions",          value: totalSubs,       icon: HiOutlineDocumentText,  color: "bg-violet-500/15 text-violet-400" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">Organizer Dashboard</h1>
            <p className="text-zinc-400 text-xs mt-0.5">Welcome back, <span className="text-white font-medium">{user?.name}</span>!</p>
          </div>
          <Link to="/organizer/hackathons/create" className="btn-primary text-xs px-3.5 py-2 flex items-center justify-center gap-1.5 font-bold w-full sm:w-auto">
            <HiOutlinePlus /> New Hackathon
          </Link>
        </div>

        {/* Compact Sleek Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-black text-white mt-0.5">{loading ? "—" : s.value}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${s.color}`}>
                <s.icon />
              </div>
            </div>
          ))}
        </div>

        {/* Compact Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link to="/organizer/registrations" className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-indigo-500/40 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineUserGroup />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">Manage Registrations</p>
              <p className="text-[11px] text-zinc-500 truncate">Approve or reject teams</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs flex-shrink-0" />
          </Link>

          <Link to="/organizer/submissions" className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-emerald-500/40 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineDocumentText />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">Review Submissions</p>
              <p className="text-[11px] text-zinc-500 truncate">Manage project entries</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs flex-shrink-0" />
          </Link>

          <Link to="/organizer/hackathons/create" className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-violet-500/40 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlinePlus />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">Create Hackathon</p>
              <p className="text-[11px] text-zinc-500 truncate">Launch a new event</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs flex-shrink-0" />
          </Link>
        </div>

        {/* Compact Hackathon List */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <RiTrophyLine className="text-amber-400 text-sm" /> My Hackathons
            </h3>
            <Link to="/organizer/hackathons" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-medium">
              View All <HiArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : hackathons.length === 0 ? (
            <div className="empty-state py-10">
              <HiOutlineCollection className="text-3xl text-zinc-600" />
              <p className="text-zinc-400 text-xs mt-1">No hackathons created yet</p>
              <Link to="/organizer/hackathons/create" className="btn-primary text-xs px-3 py-1.5 mt-2">Create Your First Hackathon</Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {hackathons.slice(0, 6).map(h => (
                <div key={h._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-zinc-900/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 overflow-hidden flex-shrink-0 border border-zinc-800">
                      {h.bannerImage
                        ? <img src={h.bannerImage} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">🏆</div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{h.title}</p>
                        <span className={`badge ${statusColor[h.status] || "badge-gray"} text-[9px] px-2 py-0.5 font-extrabold uppercase`}>
                          {h.status === "registration_open" ? "REG OPEN" : h.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {h.mode} · {h.theme}
                        {h.startDate && ` · ${format(new Date(h.startDate), "MMM d, yyyy")}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 flex-shrink-0 border-t sm:border-t-0 border-zinc-800/60 pt-2 sm:pt-0">
                    <Link
                      to={`/hackathons/${h._id}`}
                      target="_blank"
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <HiOutlineExternalLink className="text-base" />
                    </Link>
                    <Link
                      to={`/organizer/hackathons/${h._id}`}
                      className="btn-secondary text-xs px-3.5 py-1.5 font-bold cursor-pointer"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerDashboard;
