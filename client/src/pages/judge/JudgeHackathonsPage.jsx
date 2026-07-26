import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, reviewAPI } from "../../services/apiServices";
import { format } from "date-fns";
import {
  HiOutlineCollection, HiOutlineExternalLink, HiOutlineBriefcase,
  HiOutlineClock, HiOutlineCheckCircle,
} from "react-icons/hi";
import { motion } from "framer-motion";

const JudgeHackathonsPage = () => {
  const [assignedHackathons, setAssignedHackathons] = useState([]);
  const [hackathonStatsMap, setHackathonStatsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hackathonAPI.getMyAssigned()
      .then(async (hackRes) => {
        const hackList = hackRes.data.data.hackathons || [];
        setAssignedHackathons(hackList);

        if (hackList.length > 0) {
          const statsMap = {};
          await Promise.all(
            hackList.map(async (h) => {
              try {
                const res = await reviewAPI.getJudgeDashboard(h._id);
                const data = res.data.data;
                const pendingCount = data.pending?.length || 0;
                const completedCount = data.completed?.length || 0;
                statsMap[h._id] = {
                  pending: pendingCount,
                  completed: completedCount,
                  totalAssigned: pendingCount + completedCount,
                };
              } catch (_) {}
            })
          );
          setHackathonStatsMap(statsMap);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineCollection className="text-indigo-400" /> Assigned Hackathons
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Hackathon events where you are assigned as an evaluator
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {assignedHackathons.length} Event{assignedHackathons.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Hackathons List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : assignedHackathons.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineBriefcase className="text-4xl text-zinc-600" />
            <p className="text-zinc-300 font-semibold text-base mt-2">No hackathons assigned yet</p>
            <p className="text-zinc-500 text-xs mt-1">
              Organizers will assign you to hackathons when project submissions are ready for judging.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignedHackathons.map((h) => {
              const stat = hackathonStatsMap[h._id] || { pending: 0, completed: 0, totalAssigned: 0 };
              return (
                <motion.div
                  key={h._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-indigo-500/10 overflow-hidden flex-shrink-0 border border-zinc-800">
                      {h.bannerImage ? (
                        <img src={h.bannerImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {h.title}
                        </h3>
                        <span className="badge badge-primary capitalize text-[10px]">
                          {h.status?.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mt-1">
                        Mode: <span className="text-zinc-200 capitalize">{h.mode}</span> · Theme: <span className="text-zinc-200">{h.theme}</span>
                        {h.startDate && ` · ${format(new Date(h.startDate), "MMM d")} — ${format(new Date(h.endDate), "MMM d, yyyy")}`}
                      </p>

                      <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
                        <span className="text-zinc-500 font-medium">Submissions Assigned: <strong className="text-white">{stat.totalAssigned}</strong></span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <HiOutlineClock className="text-xs" /> {stat.pending} Pending
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <HiOutlineCheckCircle className="text-xs" /> {stat.completed} Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    <Link
                      to={`/hackathons/${h._id}`}
                      target="_blank"
                      className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="View public page"
                    >
                      <HiOutlineExternalLink className="text-base" />
                    </Link>

                    <Link
                      to={`/judge/projects?hackathon=${h._id}`}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md font-bold"
                    >
                      Score Projects ({stat.pending}) →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JudgeHackathonsPage;
