import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { reviewAPI, hackathonAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineClipboardCheck, HiOutlinePencil, HiOutlineBriefcase,
  HiOutlineCheckCircle, HiOutlineClock,
} from "react-icons/hi";
import { motion } from "framer-motion";

const JudgeProjectsPage = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hackathonsLoading, setHackathonsLoading] = useState(true);

  // Fetch only hackathons this judge is assigned to by filtering from all hackathons
  useEffect(() => {
    hackathonAPI.getMyAssigned()
      .then(r => {
        const assigned = r.data.data.hackathons || [];
        setHackathons(assigned);
        if (assigned.length > 0) setSelectedHackathon(assigned[0]._id);
      })
      .catch(console.error)
      .finally(() => setHackathonsLoading(false));
  }, []);

  const fetchDashboard = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    reviewAPI.getJudgeDashboard(selectedHackathon)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (hackathonsLoading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineBriefcase className="text-zinc-400" /> Assigned Projects
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Review and score submissions you are assigned to evaluate</p>
          </div>
        </div>

        {/* Hackathon Selector */}
        {hackathons.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineBriefcase className="text-4xl text-zinc-600" />
            <h3 className="text-white font-bold mt-2">No hackathons assigned yet</h3>
            <p className="text-zinc-500 text-sm mt-1">An organizer needs to assign you as a judge for a hackathon</p>
          </div>
        ) : (
          <>
            <div>
              <label className="input-label text-xs">Select Hackathon Event</label>
              <select
                value={selectedHackathon}
                onChange={e => setSelectedHackathon(e.target.value)}
                className="input-field sm:max-w-xs text-sm mt-1"
              >
                {hackathons.map(h => (
                  <option key={h._id} value={h._id}>{h.title}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center"><div className="spinner" /></div>
            ) : data && (
              <div className="space-y-5">
                {/* Judging Criteria Reference */}
                {data.hackathon?.judgingCriteria?.length > 0 && (
                  <div className="card bg-indigo-500/5 border-indigo-500/20 space-y-2">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Judging Criteria</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.hackathon.judgingCriteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                          <span className="text-zinc-300 font-medium">{c.criterion}</span>
                          <span className="text-indigo-400 font-bold">/{c.maxMarks}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Reviews */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HiOutlineClock className="text-amber-400" />
                    Pending Review
                    <span className="badge badge-warning text-[10px] ml-1">{data.pending?.length || 0}</span>
                  </h3>
                  {data.pending?.length === 0 ? (
                    <div className="card py-8 text-center">
                      <HiOutlineClipboardCheck className="text-4xl text-emerald-400 mx-auto" />
                      <p className="text-emerald-400 font-semibold mt-2">All submissions reviewed! 🎉</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.pending?.map(sub => (
                        <motion.div
                          key={sub._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="card flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{sub.projectName}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              Team: <span className="text-zinc-300">{sub.team?.name}</span>
                              {sub.techStack?.length > 0 && (
                                <span className="ml-2 text-zinc-600">· {sub.techStack.slice(0, 3).join(", ")}</span>
                              )}
                            </p>
                          </div>
                          <Link
                            to={`/judge/projects/${sub._id}/review?hackathon=${selectedHackathon}`}
                            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
                          >
                            <HiOutlinePencil /> Score
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed Reviews */}
                {data.completed?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <HiOutlineCheckCircle className="text-emerald-400" />
                      Completed
                      <span className="badge badge-success text-[10px] ml-1">{data.completed.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {data.completed.map(rev => (
                        <div key={rev._id} className="card flex items-center justify-between gap-4 opacity-80">
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm">Score: {rev.totalScore} pts</p>
                            <p className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                              {rev.feedback || "No written feedback"}
                            </p>
                          </div>
                          <span className="badge badge-success text-[10px] flex-shrink-0">Reviewed ✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JudgeProjectsPage;
