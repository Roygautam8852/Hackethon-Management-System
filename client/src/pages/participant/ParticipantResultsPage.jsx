import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { registrationAPI, leaderboardAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import { RiTrophyLine } from "react-icons/ri";
import { HiOutlineSparkles, HiOutlineChartBar, HiOutlineStar } from "react-icons/hi";
import { motion } from "framer-motion";

const ParticipantResultsPage = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialHackathonId = params.get("hackathon") || "";

  // Only show hackathons the user has an approved registration for
  const [registrations, setRegistrations] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(initialHackathonId);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [regsLoading, setRegsLoading] = useState(true);

  // Load user's registrations
  useEffect(() => {
    registrationAPI.getMy()
      .then(r => {
        const regs = r.data.data.registrations || [];
        // Only approved registrations have meaningful leaderboard data
        const approved = regs.filter(reg => reg.status === "approved" && reg.hackathon);
        setRegistrations(approved);
        if (!initialHackathonId && approved.length > 0) {
          setSelectedHackathon(approved[0].hackathon._id);
        }
      })
      .catch(console.error)
      .finally(() => setRegsLoading(false));
  }, []);

  // Load leaderboard when hackathon changes
  useEffect(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    leaderboardAPI.get(selectedHackathon)
      .then(r => setLeaderboard(r.data.data.leaderboard || []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  const activeReg = registrations.find(r => r.hackathon?._id === selectedHackathon);
  const activeHackathonObj = activeReg?.hackathon;

  // Find the user's team rank in the leaderboard
  const myTeamId = activeReg?.team?._id;
  const myRankEntry = leaderboard.find(e => e.team?._id === myTeamId || e.team?._id?.toString() === myTeamId?.toString());

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <RiTrophyLine className="text-yellow-500 text-2xl" /> Hackathon Results & Leaderboards
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Live scores, podium standings, and team rankings</p>
          </div>
          <Link
            to="/leaderboard"
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <HiOutlineChartBar /> Global Standings →
          </Link>
        </div>

        {/* Hackathon Selector — only approved registrations */}
        {regsLoading ? (
          <div className="skeleton h-16 rounded-xl" />
        ) : registrations.length === 0 ? (
          <div className="empty-state py-12 card">
            <RiTrophyLine className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">No approved hackathon registrations yet</p>
            <p className="text-zinc-600 text-xs mt-1">Once your team registration is approved, results will appear here.</p>
            <Link to="/hackathons" className="btn-primary btn-sm mt-4">Browse Hackathons</Link>
          </div>
        ) : (
          <>
            <div className="card bg-[#0d0d0f] border-zinc-800">
              <label className="input-label text-xs">Selected Event</label>
              <select
                value={selectedHackathon}
                onChange={e => setSelectedHackathon(e.target.value)}
                className="input-field bg-[#111113] border-zinc-800 focus:border-zinc-500 text-xs"
              >
                <option value="">-- Select a Hackathon Event --</option>
                {registrations.map(r => (
                  <option key={r.hackathon._id} value={r.hackathon._id}>
                    {r.hackathon.title} ({r.hackathon.status?.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>

            {/* My Team Rank Banner */}
            {myRankEntry && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card bg-indigo-500/10 border-indigo-500/40 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <HiOutlineStar className="text-indigo-400 text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Your Team's Standing</p>
                    <p className="text-white font-bold text-sm">{activeReg?.team?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-400">#{myRankEntry.rank}</p>
                  <p className="text-xs text-zinc-400">{myRankEntry.averageScore} pts avg</p>
                </div>
              </motion.div>
            )}

            {/* Content */}
            {selectedHackathon ? (
              loading ? (
                <div className="py-12 flex justify-center">
                  <div className="spinner" />
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-6">
                  {/* Podium Top 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card bg-[#111113] border-zinc-700/60 p-5 text-center flex flex-col items-center justify-between order-2 md:order-1 border-t-4 border-t-zinc-400"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-xl mb-3">🥈</div>
                        <span className="badge badge-gray text-[10px] uppercase font-bold mb-1">2nd Place</span>
                        <h3 className="text-base font-extrabold text-white truncate max-w-full">
                          {leaderboard[1].submission?.projectName || leaderboard[1].team?.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-semibold mt-1">Team: {leaderboard[1].team?.name}</p>
                        <div className="mt-4 pt-3 border-t border-zinc-800 w-full">
                          <span className="text-lg font-black text-white">{leaderboard[1].averageScore || 0}</span>
                          <span className="text-zinc-500 text-xs ml-1">pts</span>
                        </div>
                      </motion.div>
                    )}

                    {/* 1st Place */}
                    {leaderboard[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card bg-[#141417] border-yellow-500/40 p-6 text-center flex flex-col items-center justify-between order-1 md:order-2 border-t-4 border-t-yellow-500 shadow-xl shadow-yellow-500/5"
                      >
                        <div className="w-14 h-14 rounded-full bg-yellow-500/10 border-2 border-yellow-500/50 flex items-center justify-center text-2xl mb-3">🥇</div>
                        <span className="badge badge-warning text-[10px] uppercase font-bold mb-1">Champion</span>
                        <h3 className="text-lg font-black text-white truncate max-w-full">
                          {leaderboard[0].submission?.projectName || leaderboard[0].team?.name}
                        </h3>
                        <p className="text-xs text-zinc-300 font-semibold mt-1">Team: {leaderboard[0].team?.name}</p>
                        <div className="mt-4 pt-3 border-t border-zinc-800 w-full">
                          <span className="text-2xl font-black text-yellow-400">{leaderboard[0].averageScore || 0}</span>
                          <span className="text-zinc-400 text-xs ml-1">pts</span>
                        </div>
                      </motion.div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card bg-[#111113] border-zinc-700/60 p-5 text-center flex flex-col items-center justify-between order-3 border-t-4 border-t-amber-700"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-xl mb-3">🥉</div>
                        <span className="badge badge-warning text-[10px] uppercase font-bold mb-1">3rd Place</span>
                        <h3 className="text-base font-extrabold text-white truncate max-w-full">
                          {leaderboard[2].submission?.projectName || leaderboard[2].team?.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-semibold mt-1">Team: {leaderboard[2].team?.name}</p>
                        <div className="mt-4 pt-3 border-t border-zinc-800 w-full">
                          <span className="text-lg font-black text-white">{leaderboard[2].averageScore || 0}</span>
                          <span className="text-zinc-500 text-xs ml-1">pts</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Full Standings Table */}
                  <div className="card p-0 overflow-hidden border-zinc-800">
                    <div className="px-5 py-4 bg-[#0d0d0f] border-b border-zinc-800 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Full Leaderboard</h3>
                      <span className="text-xs text-zinc-500">{leaderboard.length} teams scored</span>
                    </div>
                    <div className="divide-y divide-zinc-800/80">
                      {leaderboard.map((item, idx) => {
                        const isMyTeam = item.team?._id?.toString() === myTeamId?.toString();
                        return (
                          <div
                            key={item._id || idx}
                            className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
                              isMyTeam ? "bg-indigo-500/10 border-l-2 border-indigo-500" : "hover:bg-zinc-900/50"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span className="w-6 text-center font-extrabold text-sm text-zinc-400">#{idx + 1}</span>
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isMyTeam ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-white"
                              }`}>
                                {item.team?.name?.[0]?.toUpperCase() || "T"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {item.submission?.projectName || item.team?.name}
                                  {isMyTeam && <span className="ml-2 badge badge-primary text-[9px]">You</span>}
                                </p>
                                <p className="text-[11px] text-zinc-400 truncate">Team: {item.team?.name}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`text-sm font-black ${isMyTeam ? "text-indigo-400" : "text-white"}`}>
                                {item.averageScore || 0}
                              </span>
                              <span className="text-[11px] text-zinc-500 ml-1">pts</span>
                              {item.reviewCount > 0 && (
                                <p className="text-[10px] text-zinc-600">{item.reviewCount} review{item.reviewCount !== 1 ? "s" : ""}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state py-12 card">
                  <HiOutlineSparkles className="text-4xl text-yellow-500/60" />
                  <h3 className="text-base font-bold text-white mt-2">Results Pending Evaluation</h3>
                  <p className="text-zinc-400 text-xs max-w-md mx-auto mt-1">
                    Judges are reviewing submissions for {activeHackathonObj?.title || "this event"}. Scores appear live as evaluations complete.
                  </p>
                </div>
              )
            ) : (
              <div className="empty-state py-12 card">
                <RiTrophyLine className="text-4xl text-zinc-600" />
                <p className="text-zinc-400 text-xs">Select a hackathon to view results.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParticipantResultsPage;
