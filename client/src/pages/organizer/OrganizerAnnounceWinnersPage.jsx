import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, leaderboardAPI, submissionAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineFlag, HiOutlineDocumentText,
  HiOutlineSparkles,
} from "react-icons/hi";
import { RiTrophyLine } from "react-icons/ri";
import { motion } from "framer-motion";

const positionBadge = {
  1: { label: "1st Place (Gold)",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", icon: "🥇" },
  2: { label: "2nd Place (Silver)",  badge: "bg-slate-400/20 text-slate-200 border-slate-400/40", icon: "🥈" },
  3: { label: "3rd Place (Bronze)",  badge: "bg-amber-700/20 text-amber-500 border-amber-700/40", icon: "🥉" },
};

const OrganizerAnnounceWinnersPage = () => {
  const [hackathons, setHackathons]       = useState([]);
  const [selectedHackathon, setSelected]  = useState("");
  const [hackathonData, setHackathonData] = useState(null);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [submissions, setSubmissions]     = useState([]);
  const [selectedWinners, setSelectedWinners] = useState({}); // { [teamId]: positionNumber }
  const [loading, setLoading]             = useState(true);
  const [publishing, setPublishing]       = useState(false);

  // Fetch organizer's hackathons
  useEffect(() => {
    hackathonAPI.getMy()
      .then(r => {
        const list = r.data.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) setSelected(list[0]._id);
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load hackathons");
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchData = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);

    Promise.allSettled([
      hackathonAPI.getById(selectedHackathon),
      leaderboardAPI.get(selectedHackathon),
      submissionAPI.getByHackathon(selectedHackathon),
    ])
      .then(([hRes, lbRes, subRes]) => {
        let h = null;
        let lb = [];
        let subs = [];

        if (hRes.status === "fulfilled") {
          h = hRes.value.data.data.hackathon;
          setHackathonData(h);
        }

        if (lbRes.status === "fulfilled") {
          lb = lbRes.value.data.data.leaderboard || [];
          setLeaderboard(lb);
        }

        if (subRes.status === "fulfilled") {
          subs = subRes.value.data.submissions || [];
          setSubmissions(subs);
        }

        // Auto-assign default winner positions from leaderboard ranks if none exist
        const existingMap = {};
        if (h && h.winners && h.winners.length > 0) {
          h.winners.forEach(w => {
            const teamId = typeof w.team === "string" ? w.team : w.team?._id;
            if (teamId) existingMap[teamId] = w.position;
          });
        }

        // If no explicit winners saved yet, auto-select strictly based on leaderboard scores (Rank 1 = 1st, Rank 2 = 2nd, Rank 3 = 3rd)
        if (Object.keys(existingMap).length === 0 && lb.length > 0) {
          lb.slice(0, 3).forEach((item, idx) => {
            if (item.team?._id) existingMap[item.team._id] = idx + 1;
          });
        }

        setSelectedWinners(existingMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Combine leaderboard & extra submissions
  const scoredTeamIds = new Set(leaderboard.map(e => e.team._id));
  const unrankedSubs = submissions.filter(s => s.team && !scoredTeamIds.has(s.team._id));

  // Auto pick top 3 strictly based on highest average scores
  const handleAutoPickTop3 = () => {
    const newWinners = {};
    leaderboard.slice(0, 3).forEach((item, idx) => {
      if (item.team?._id) newWinners[item.team._id] = idx + 1;
    });
    setSelectedWinners(newWinners);
    toast.success("Auto-selected top 3 teams based on highest scores! 🎉");
  };

  // Toggle position for a team
  const setTeamWinnerPosition = (teamId, pos) => {
    setSelectedWinners(prev => {
      const copy = { ...prev };
      if (copy[teamId] === pos) {
        delete copy[teamId];
      } else {
        // Clear this position from any other team
        Object.keys(copy).forEach(k => {
          if (copy[k] === pos) delete copy[k];
        });
        copy[teamId] = pos;
      }
      return copy;
    });
  };

  // Publish final winners
  const handlePublishWinners = async () => {
    if (Object.keys(selectedWinners).length === 0) {
      toast.error("Please mark at least 1 team as winner before publishing");
      return;
    }

    if (!confirm("Are you sure you want to announce these winners? This will mark the hackathon as COMPLETED.")) return;

    setPublishing(true);
    try {
      const winnersPayload = Object.entries(selectedWinners).map(([teamId, position]) => ({
        team: teamId,
        position,
      }));

      await hackathonAPI.publishResults(selectedHackathon, { winners: winnersPayload });
      toast.success("Winners officially announced & hackathon marked as completed! 🎉🏆");
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to publish winners");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <RiTrophyLine className="text-amber-400" /> Announce Hackathon Winners
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Review team leaderboard scores, select 1st/2nd/3rd place winners, and publish final results
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">Hackathon:</span>
            <select
              value={selectedHackathon}
              onChange={e => setSelected(e.target.value)}
              className="input-field text-sm font-semibold sm:w-64"
            >
              <option value="">Select Hackathon…</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Banner & Action Bar */}
        {selectedHackathon && hackathonData && (() => {
          const isEndDatePassed = hackathonData.endDate ? new Date() >= new Date(hackathonData.endDate) : true;

          return (
            <div className="space-y-3">
              {!isEndDatePassed && hackathonData.status !== "completed" && (
                <div className="card bg-amber-500/10 border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⏳</span>
                    <div>
                      <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Hackathon Event In Progress</p>
                      <p className="text-xs text-zinc-400">
                        Results cannot be published until the hackathon end date: <strong className="text-white">{format(new Date(hackathonData.endDate), "MMM d, yyyy")}</strong>.
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-warning text-[10px] flex-shrink-0">End Date Required</span>
                </div>
              )}

              <div className="card bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">{hackathonData.title}</h3>
                    <span className={`badge ${
                      hackathonData.status === "completed" ? "badge-success" : "badge-warning"
                    } capitalize text-[10px]`}>
                      {hackathonData.status === "completed" ? "Completed · Results Published 🎉" : hackathonData.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {leaderboard.length} scored submission{leaderboard.length !== 1 ? "s" : ""} · {Object.keys(selectedWinners).length} winner position(s) assigned
                    {hackathonData.endDate && ` · End Date: ${format(new Date(hackathonData.endDate), "MMM d, yyyy")}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={handleAutoPickTop3}
                    disabled={leaderboard.length === 0}
                    className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                  >
                    <HiOutlineSparkles /> Auto-Select Top 3 ⚡
                  </button>

                  <button
                    onClick={handlePublishWinners}
                    disabled={publishing || Object.keys(selectedWinners).length === 0 || (!isEndDatePassed && hackathonData.status !== "completed")}
                    title={!isEndDatePassed && hackathonData.status !== "completed" ? `Results can only be published after ${format(new Date(hackathonData.endDate), "MMM d, yyyy")}` : ""}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiOutlineFlag /> {publishing ? "Publishing..." : "Publish Winners 🎉"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Leaderboard Table / Standings List */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : !selectedHackathon ? (
          <div className="empty-state py-16 card">
            <RiTrophyLine className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">Select a hackathon to announce winners</p>
          </div>
        ) : leaderboard.length === 0 && unrankedSubs.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-300 font-semibold text-base mt-2">No team submissions or scores found</p>
            <p className="text-zinc-500 text-xs mt-1">Once judges review submitted projects, team scores and ranks will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
              Leaderboard & Score Standings ({leaderboard.length})
            </h3>

            <div className="grid gap-3">
              {leaderboard.map((item) => {
                const teamId = item.team._id;
                const assignedPos = selectedWinners[teamId];

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      assignedPos === 1 ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/5" :
                      assignedPos === 2 ? "border-slate-400/50 bg-slate-400/10" :
                      assignedPos === 3 ? "border-amber-700/50 bg-amber-700/10" :
                      "hover:border-zinc-700"
                    }`}
                  >
                    {/* Left Rank & Team Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-sm flex-shrink-0 ${
                        item.rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                        item.rank === 2 ? "bg-slate-400/20 text-slate-300 border border-slate-400/40" :
                        item.rank === 3 ? "bg-amber-700/20 text-amber-500 border border-amber-700/40" :
                        "bg-zinc-900 text-zinc-400 border border-zinc-800"
                      }`}>
                        <span>#{item.rank}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-white truncate">{item.team.name}</h4>
                          {assignedPos && (
                            <span className={`badge border text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${positionBadge[assignedPos]?.badge}`}>
                              {positionBadge[assignedPos]?.icon} {positionBadge[assignedPos]?.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          Project: <span className="text-zinc-200 font-medium">{item.submission?.projectName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Middle Score Display */}
                    <div className="flex items-center gap-4 flex-shrink-0 bg-[#0d0d0f] border border-zinc-800/80 px-4 py-2 rounded-xl">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Score</p>
                        <p className="text-lg font-black text-amber-400">{item.averageScore} <span className="text-xs font-semibold text-zinc-500">pts</span></p>
                      </div>
                      <div className="h-6 w-px bg-zinc-800" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Evaluations</p>
                        <p className="text-sm font-bold text-zinc-300">{item.reviewCount} judge{item.reviewCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    {/* Right Mark Winner Position Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => setTeamWinnerPosition(teamId, 1)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          assignedPos === 1
                            ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                            : "bg-zinc-900 text-amber-400 border-zinc-700 hover:border-amber-500/50"
                        }`}
                      >
                        🥇 1st Place
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeamWinnerPosition(teamId, 2)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          assignedPos === 2
                            ? "bg-slate-300 text-black border-slate-200 shadow-md"
                            : "bg-zinc-900 text-slate-300 border-zinc-700 hover:border-slate-400/50"
                        }`}
                      >
                        🥈 2nd Place
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeamWinnerPosition(teamId, 3)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          assignedPos === 3
                            ? "bg-amber-700 text-white border-amber-600 shadow-md"
                            : "bg-zinc-900 text-amber-500 border-zinc-700 hover:border-amber-700/50"
                        }`}
                      >
                        🥉 3rd Place
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrganizerAnnounceWinnersPage;
