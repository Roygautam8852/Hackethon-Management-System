import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { registrationAPI, submissionAPI, leaderboardAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineCollection, HiOutlineUserGroup, HiOutlineDocumentText, HiArrowRight,
  HiOutlineStar,
} from "react-icons/hi";
import { RiTrophyLine } from "react-icons/ri";

const badgeMap = {
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
  cancelled: "badge-gray",
};

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [hackathonRanksMap, setHackathonRanksMap] = useState({}); // { [hackId]: rankString }
  const [selectedHackId, setSelectedHackId] = useState("");
  const [totalWins, setTotalWins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registrationAPI.getMy()
      .then(async (r) => {
        const regs = r.data.data.registrations || [];
        setRegistrations(regs);

        const approvedRegs = regs.filter((reg) => reg.status === "approved" && reg.hackathon);

        if (approvedRegs.length > 0) {
          if (!selectedHackId) {
            setSelectedHackId(approvedRegs[0].hackathon._id);
          }

          const hackathonIds = approvedRegs.map((reg) => reg.hackathon._id).filter(Boolean);

          // Submissions count
          try {
            const results = await submissionAPI.getMyAll(hackathonIds);
            const count = results.filter((res) => res.data.data?.submission).length;
            setSubmissionCount(count);
          } catch (_) {}

          // Fetch leaderboards to calculate Team Position per Hackathon & Total Official Wins
          let winsCount = 0;
          const ranksMap = {};

          for (const reg of approvedRegs) {
            const hackId = reg.hackathon._id;
            try {
              const lbRes = await leaderboardAPI.get(hackId);
              const lb = lbRes.data.data?.leaderboard || [];
              const myTeamId = reg.team?._id?.toString();

              const myEntry = lb.find(
                (item) => (item.team?._id || item.team)?.toString() === myTeamId
              );

              if (myEntry) {
                let rankStr = `#${myEntry.rank}`;
                if (myEntry.rank === 1) rankStr = "#1 🥇";
                else if (myEntry.rank === 2) rankStr = "#2 🥈";
                else if (myEntry.rank === 3) rankStr = "#3 🥉";

                ranksMap[hackId] = rankStr;

                // ONLY count as an official Win IF the hackathon results are officially published (status === "completed")!
                const isCompleted = reg.hackathon.status === "completed";
                const isOfficialWinner = reg.hackathon.winners?.some(
                  w => (w.team?._id || w.team)?.toString() === myTeamId && w.position === 1
                );

                if (isCompleted && (myEntry.rank === 1 || isOfficialWinner)) {
                  winsCount++;
                }
              } else {
                ranksMap[hackId] = "Unranked";
              }
            } catch (_) {
              ranksMap[hackId] = "Unranked";
            }
          }

          setHackathonRanksMap(ranksMap);
          setTotalWins(winsCount);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackId]);

  const approvedCount = registrations.filter(r => r.status === "approved").length;
  const currentTeamPosition = selectedHackId ? (hackathonRanksMap[selectedHackId] || "Unranked") : "—";

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-3">
          <h1 className="text-xl font-extrabold text-white">Participant Dashboard</h1>
          <p className="text-zinc-400 text-xs mt-0.5">Welcome, <span className="text-white font-medium">{user?.name}</span>! Track your hackathons, team rankings, and submissions.</p>
        </div>

        {/* Compact Sleek Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Registered */}
          <div className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Registered</p>
              <p className="text-lg font-black text-white mt-0.5">{loading ? "—" : registrations.length}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineCollection />
            </div>
          </div>

          {/* Card 2: Approved */}
          <div className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Approved</p>
              <p className="text-lg font-black text-white mt-0.5">{loading ? "—" : approvedCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineUserGroup />
            </div>
          </div>

          {/* Card 3: Submissions */}
          <div className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Submissions</p>
              <p className="text-lg font-black text-white mt-0.5">{loading ? "—" : submissionCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineDocumentText />
            </div>
          </div>

          {/* Card 4: Team Position WITH HACKATHON DROPBOX */}
          <div className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Team Position</p>
              {registrations.length > 0 && (
                <select
                  value={selectedHackId}
                  onChange={(e) => setSelectedHackId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white text-[10px] font-semibold rounded px-1.5 py-0.5 focus:outline-none max-w-[110px] truncate"
                  title="Select Hackathon to view rank"
                >
                  {registrations.map((r) => r.hackathon && (
                    <option key={r.hackathon._id} value={r.hackathon._id}>
                      {r.hackathon.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-lg font-black text-violet-300">{loading ? "—" : currentTeamPosition}</p>
              <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center text-xs flex-shrink-0">
                <HiOutlineStar />
              </div>
            </div>
          </div>

          {/* Card 5: Hackathons Won */}
          <div className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hackathons Won</p>
              <p className="text-lg font-black text-amber-300 mt-0.5">
                {loading ? "—" : (totalWins > 0 ? `${totalWins} Win${totalWins !== 1 ? "s" : ""}` : "0 Wins")}
              </p>
              {totalWins === 0 && (
                <p className="text-[9px] text-zinc-500 font-medium">Pending Publication</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              <RiTrophyLine />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/hackathons" className="card p-4 flex items-center gap-3 hover:border-indigo-500/40 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 flex-shrink-0 text-base">
              <HiOutlineCollection />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-200 text-xs group-hover:text-white transition-colors">Browse Hackathons</p>
              <p className="text-[11px] text-zinc-500 truncate">Explore upcoming challenges</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 text-sm" />
          </Link>

          <Link to="/participant/team" className="card p-4 flex items-center gap-3 hover:border-indigo-500/40 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 flex-shrink-0 text-base">
              <HiOutlineUserGroup />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-200 text-xs group-hover:text-white transition-colors">My Team</p>
              <p className="text-[11px] text-zinc-500 truncate">Manage members & invites</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 text-sm" />
          </Link>

          <Link to="/participant/submission" className="card p-4 flex items-center gap-3 hover:border-indigo-500/40 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 flex-shrink-0 text-base">
              <HiOutlineDocumentText />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-200 text-xs group-hover:text-white transition-colors">My Submission</p>
              <p className="text-[11px] text-zinc-500 truncate">Submit repository & demo</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 text-sm" />
          </Link>
        </div>

        {/* My Registrations */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Registrations</h3>
            <span className="text-[11px] text-zinc-500">{registrations.length} event{registrations.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
          ) : registrations.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-zinc-400 text-xs">No registrations yet</p>
              <Link to="/hackathons" className="btn-primary text-xs px-3 py-1.5 mt-2">Browse Hackathons</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {registrations.map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d0d0f] border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 overflow-hidden flex-shrink-0 border border-zinc-800">
                      {r.hackathon?.bannerImage
                        ? <img src={r.hackathon.bannerImage} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs text-indigo-400">🏆</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{r.hackathon?.title}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{r.hackathon?.mode} · {r.hackathon?.status?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${badgeMap[r.status] || "badge-gray"} text-[10px]`}>{r.status}</span>
                    <Link to={`/participant/results?hackathon=${r.hackathon?._id}`} className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">
                      View Results →
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

export default ParticipantDashboard;
