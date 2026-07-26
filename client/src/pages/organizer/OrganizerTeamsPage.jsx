import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, teamAPI } from "../../services/apiServices";
import { format } from "date-fns";
import {
  HiOutlineUserGroup, HiOutlineFilter, HiOutlineSearch,
  HiOutlineChevronDown, HiOutlineChevronUp,
} from "react-icons/hi";

const statusBadge = {
  pending:  "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
};

const OrganizerTeamsPage = () => {
  const [hackathons, setHackathons]       = useState([]);
  const [selectedHackathon, setSelected]  = useState("");
  const [teams, setTeams]                 = useState([]);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [loading, setLoading]             = useState(false);
  const [expandedTeam, setExpandedTeam]   = useState(null);

  useEffect(() => {
    hackathonAPI.getMy()
      .then(r => {
        const list = r.data.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) setSelected(list[0]._id);
      })
      .catch(console.error);
  }, []);

  const fetchTeams = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    teamAPI.getByHackathon(selectedHackathon, { limit: 100 })
      .then(r => setTeams(r.data.data.teams || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const filtered = teams.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineUserGroup className="text-zinc-400" /> Teams
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              All registered teams across your hackathons · {filtered.length} team{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedHackathon}
            onChange={e => setSelected(e.target.value)}
            className="input-field sm:max-w-xs text-xs sm:text-sm"
          >
            <option value="">Select Hackathon</option>
            {hackathons.map(h => (
              <option key={h._id} value={h._id}>{h.title}</option>
            ))}
          </select>

          <div className="relative flex-1 sm:max-w-xs">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base pointer-events-none z-10" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teams…"
              className="input-field pl-10 text-xs sm:text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field sm:max-w-[160px] text-xs sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Teams list */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : !selectedHackathon ? (
          <div className="empty-state py-16 card">
            <HiOutlineUserGroup className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">Select a hackathon to view its teams</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineFilter className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">No teams match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(team => (
              <div key={team._id} className="card p-0 overflow-hidden bg-[#0d0d0f]">
                {/* Team row */}
                <div
                  className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-sm font-extrabold text-indigo-400 flex-shrink-0">
                      {team.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{team.name}</p>
                        <span className={`badge ${statusBadge[team.status] || "badge-gray"} capitalize text-[10px] font-extrabold`}>
                          {team.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        Leader: <span className="text-zinc-200 font-semibold">{team.leader?.name}</span>
                        {" · "}{team.members?.length || 0} member{team.members?.length !== 1 ? "s" : ""}
                        {team.createdAt && ` · Formed ${format(new Date(team.createdAt), "MMM d, yyyy")}`}
                      </p>
                    </div>
                  </div>
                  {expandedTeam === team._id
                    ? <HiOutlineChevronUp className="text-zinc-400 text-lg flex-shrink-0" />
                    : <HiOutlineChevronDown className="text-zinc-400 text-lg flex-shrink-0" />
                  }
                </div>

                {/* Expanded member roster */}
                {expandedTeam === team._id && (
                  <div className="border-t border-zinc-800/80 px-4 sm:px-5 py-3.5 sm:py-4 space-y-3 bg-zinc-950/70">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Member Roster</p>
                    <div className="space-y-2">
                      {team.members?.map(m => {
                        const mu = m.user || {};
                        const isLeader = mu._id === team.leader?._id || mu._id === team.leader;
                        const rawEmail = mu.email || "";
                        const isPlaceholderEmail = !rawEmail || rawEmail.includes("@pending.local") || rawEmail.includes("@hacklytics.local");

                        return (
                          <div
                            key={mu._id || Math.random()}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-zinc-900/90 border border-zinc-800/80 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0">
                                {mu.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-zinc-200">{mu.name || "Unknown"}</span>
                                  {isLeader && <span className="badge badge-primary text-[9px] py-0.5 px-1.5 font-extrabold">Leader</span>}
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                  {isPlaceholderEmail ? <span className="text-zinc-500 italic">No email provided</span> : rawEmail}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-end border-t sm:border-t-0 border-zinc-800/60 pt-1.5 sm:pt-0">
                              <span className={`badge ${
                                m.status === "accepted" ? "badge-success" :
                                m.status === "pending"  ? "badge-warning" : "badge-danger"
                              } text-[10px] font-bold`}>
                                {m.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrganizerTeamsPage;
