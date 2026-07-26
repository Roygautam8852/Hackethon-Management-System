import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { teamAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineUserGroup, HiOutlineSearch, HiOutlineTrash,
  HiOutlineShieldCheck, HiOutlineUser,
} from "react-icons/hi";

const AdminTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await teamAPI.getAllAdmin();
      setTeams(res.data.data.teams || []);
    } catch (e) {
      toast.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"?`)) return;
    try {
      await teamAPI.delete(teamId);
      toast.success(`Team "${teamName}" deleted`);
      fetchTeams();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete team");
    }
  };

  const filteredTeams = teams.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.leader?.name?.toLowerCase().includes(q) ||
      t.hackathon?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <HiOutlineUserGroup className="text-indigo-400" /> Platform Teams
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">Overview of all participating teams across all hackathons</p>
          </div>
          <span className="badge badge-primary text-[10px]">{teams.length} Total Teams</span>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teams by team name, leader, or hackathon event…"
              className="input-field text-xs pl-9 py-2"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Hackathon Event</th>
                  <th>Team Leader</th>
                  <th>Members</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
                ) : filteredTeams.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-zinc-500 py-10">No teams found</td></tr>
                ) : (
                  filteredTeams.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <p className="font-extrabold text-white text-xs">{t.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">ID: {t._id?.slice(-6)}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-indigo-400 text-xs">{t.hackathon?.title || "Event"}</p>
                        <span className="badge badge-gray text-[9px] capitalize">{t.hackathon?.mode || "online"}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                            <HiOutlineShieldCheck />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200 text-xs">{t.leader?.name || "Leader"}</p>
                            <p className="text-[10px] text-zinc-500">{t.leader?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary text-[10px] font-bold">
                          {t.members?.length || 1} Member{(t.members?.length || 1) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="text-zinc-400 text-[11px]">
                        {t.createdAt ? format(new Date(t.createdAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteTeam(t._id, t.name)}
                          className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-300"
                          title="Delete Team"
                        >
                          <HiOutlineTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTeamsPage;
