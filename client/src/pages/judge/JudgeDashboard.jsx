import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, reviewAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import {
  HiOutlineBriefcase, HiOutlineClipboardCheck, HiArrowRight,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText,
  HiOutlinePencil,
} from "react-icons/hi";

const JudgeDashboard = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [assignedHackathons, setAssignedHackathons] = useState([]);
  const [allAssignedSubmissions, setAllAssignedSubmissions] = useState([]);
  const [totalAssignedSubmissions, setTotalAssignedSubmissions] = useState(0);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      reviewAPI.getMy(),
      hackathonAPI.getMyAssigned(),
    ]).then(async ([reviewRes, hackRes]) => {
      let myReviewsList = [];
      let hackList = [];

      if (reviewRes.status === "fulfilled") {
        myReviewsList = reviewRes.value.data.data.reviews || [];
        setReviews(myReviewsList);
      }
      if (hackRes.status === "fulfilled") {
        hackList = hackRes.value.data.data.hackathons || [];
        setAssignedHackathons(hackList);
      }

      // Fetch per-hackathon submission assignment stats and individual submissions
      if (hackList.length > 0) {
        const individualSubmissions = [];
        let assignedSum = 0;
        let pendingSum = 0;

        await Promise.all(
          hackList.map(async (h) => {
            try {
              const res = await reviewAPI.getJudgeDashboard(h._id);
              const data = res.data.data;
              const pendingSubs = data.pending || [];
              const completedRevs = data.completed || [];

              const pendingCount = pendingSubs.length;
              const completedCount = completedRevs.length;
              const totalAssigned = pendingCount + completedCount;

              assignedSum += totalAssigned;
              pendingSum += pendingCount;

              // Collect pending submissions
              pendingSubs.forEach(s => {
                individualSubmissions.push({
                  submissionId: s._id,
                  projectName: s.projectName,
                  teamName: s.team?.name || "Unnamed Team",
                  hackathonTitle: h.title,
                  hackathonId: h._id,
                  isCompleted: false,
                });
              });

              // Collect completed reviews
              completedRevs.forEach(r => {
                individualSubmissions.push({
                  reviewId: r._id,
                  submissionId: r.submission?._id || r.submission,
                  projectName: r.submission?.projectName || "Submitted Project",
                  teamName: r.submission?.team?.name || "Team",
                  totalScore: r.totalScore,
                  hackathonTitle: h.title,
                  hackathonId: h._id,
                  isCompleted: true,
                });
              });

            } catch (_) {}
          })
        );

        setAllAssignedSubmissions(individualSubmissions);
        setTotalAssignedSubmissions(assignedSum);
        setTotalPendingCount(pendingSum);
      }
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Hackathons Assigned",        value: assignedHackathons.length,     icon: HiOutlineBriefcase,      color: "bg-indigo-500/15 text-indigo-400" },
    { label: "Total Submissions",          value: totalAssignedSubmissions,     icon: HiOutlineDocumentText,   color: "bg-violet-500/15 text-violet-400" },
    { label: "Pending Reviews",            value: totalPendingCount,             icon: HiOutlineClock,          color: "bg-amber-500/15 text-amber-400" },
    { label: "Reviews Completed",          value: reviews.length,                icon: HiOutlineClipboardCheck,  color: "bg-emerald-500/15 text-emerald-400" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl">
        {/* Compact Header */}
        <div className="border-b border-zinc-800 pb-3">
          <h1 className="text-xl font-extrabold text-white">Judge Dashboard</h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Welcome, <span className="text-white font-medium">{user?.name}</span> · Ready to evaluate submissions?
          </p>
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
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/judge/projects" className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-indigo-500/40 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineClock />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">Pending Reviews</p>
                {totalPendingCount > 0 && (
                  <span className="badge badge-warning text-[9px] px-1.5 py-0.5">{totalPendingCount} Action Required</span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 truncate">Score team submissions waiting for evaluation</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs flex-shrink-0" />
          </Link>

          <Link to="/judge/completed" className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 hover:border-emerald-500/40 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm flex-shrink-0">
              <HiOutlineCheckCircle />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">Completed Reviews ({reviews.length})</p>
              <p className="text-[11px] text-zinc-500 truncate">View and edit your submitted scores</p>
            </div>
            <HiArrowRight className="ml-auto text-zinc-600 group-hover:text-zinc-400 text-xs flex-shrink-0" />
          </Link>
        </div>

        {/* 🎯 INDIVIDUAL TEAM SUBMISSIONS LIST (COMPACT SLEEK CARDS) */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <HiOutlineDocumentText className="text-violet-400 text-sm" /> My Assigned Team Submissions ({allAssignedSubmissions.length})
            </h3>
            <span className="text-[10px] text-zinc-500 font-medium">Individual Submissions</span>
          </div>

          {loading ? (
            <div className="py-6 flex justify-center"><div className="spinner" /></div>
          ) : allAssignedSubmissions.length === 0 ? (
            <div className="empty-state py-6">
              <HiOutlineDocumentText className="text-2xl text-zinc-600" />
              <p className="text-zinc-400 text-xs mt-1">No team submissions assigned to you yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allAssignedSubmissions.map((subItem) => (
                <div
                  key={subItem.submissionId || subItem.reviewId}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                    subItem.isCompleted
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-amber-500/5 border-amber-500/30"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-extrabold text-white truncate">{subItem.projectName}</h4>
                      {subItem.isCompleted ? (
                        <span className="badge badge-success text-[9px] px-2 py-0.5 flex items-center gap-1">
                          <HiOutlineCheckCircle /> Evaluated ({subItem.totalScore} pts)
                        </span>
                      ) : (
                        <span className="badge badge-warning text-[9px] px-2 py-0.5 flex items-center gap-1">
                          <HiOutlineClock /> Action Required (Pending)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      Team: <span className="text-indigo-400 font-bold">{subItem.teamName}</span>
                      <span className="text-zinc-600"> · </span>
                      Event: <span className="text-zinc-300">{subItem.hackathonTitle}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    {subItem.isCompleted ? (
                      <Link
                        to={`/judge/completed`}
                        className="btn-secondary text-[11px] px-3 py-1.5 flex items-center gap-1 font-medium"
                      >
                        <HiOutlineCheckCircle /> View Score ({subItem.totalScore} pts)
                      </Link>
                    ) : (
                      <Link
                        to={`/judge/projects/${subItem.submissionId}/review?hackathon=${subItem.hackathonId}`}
                        className="btn-primary text-[11px] px-3.5 py-1.5 flex items-center gap-1.5 shadow-md font-bold"
                      >
                        <HiOutlinePencil /> Score Project →
                      </Link>
                    )}
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

export default JudgeDashboard;
