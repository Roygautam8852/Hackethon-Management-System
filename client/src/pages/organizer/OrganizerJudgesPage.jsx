import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, submissionAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineScale, HiOutlineCheckCircle, HiOutlineUserAdd,
  HiOutlineExternalLink, HiOutlineTrash, HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const statusBadge = {
  pending:      "badge-warning",
  under_review: "badge-primary",
  approved:     "badge-success",
  rejected:     "badge-danger",
};

const OrganizerJudgesPage = () => {
  const [hackathons, setHackathons]       = useState([]);
  const [selectedHackathon, setSelected]  = useState("");
  const [submissions, setSubmissions]     = useState([]);
  const [allJudges, setAllJudges]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [updatingSubId, setUpdatingSubId] = useState(null);

  // Fetch organizer's hackathons and all registered judges on load
  useEffect(() => {
    Promise.all([
      hackathonAPI.getMy(),
      hackathonAPI.getAllJudges(),
    ])
      .then(([hackRes, judgesRes]) => {
        const list = hackRes.data.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) setSelected(list[0]._id);

        setAllJudges(judgesRes.data.data.judges || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchSubmissions = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    submissionAPI.getByHackathon(selectedHackathon)
      .then(r => setSubmissions(r.data.data.submissions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  /* ── Direct Dropdown Judge Selection & Removal Handler ── */
  const handleSelectJudge = async (subId, judgeId, subTitle) => {
    setUpdatingSubId(subId);
    try {
      const judgeIds = judgeId ? [judgeId] : [];
      await submissionAPI.assignJudges(subId, judgeIds);

      const targetJudge = allJudges.find(j => j._id === judgeId);
      if (targetJudge) {
        toast.success(`Assigned ${targetJudge.name} to "${subTitle}" ✓`);
      } else {
        toast.success(`Judge removed from "${subTitle}"`);
      }
      fetchSubmissions();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update judge assignment");
    } finally {
      setUpdatingSubId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineScale className="text-indigo-400" /> Assign Judges to Submissions
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              Select or change assigned judges for team project entries
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedHackathon}
              onChange={e => setSelected(e.target.value)}
              className="input-field text-xs sm:text-sm font-bold bg-[#111113] border-zinc-800 w-full sm:w-64"
            >
              <option value="">Select Hackathon Event…</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Info Banner Card */}
        <div className="card bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-950 border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl flex-shrink-0">
              <HiOutlineUserAdd />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">Judge Assignment Studio</p>
              <p className="text-[11px] text-zinc-400 truncate">Select a judge from the dropdown for each team entry.</p>
            </div>
          </div>
          <span className="badge badge-primary text-[10px] font-extrabold flex-shrink-0 px-2.5 py-1">
            {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : !selectedHackathon ? (
          <div className="empty-state py-16 card">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">Select a hackathon above to view submissions</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-300 font-semibold text-base mt-2">No team submissions yet</p>
            <p className="text-zinc-500 text-xs mt-1">Submitted team projects will appear here for judge assignment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const assignedJudges = sub.assignedJudges || [];
              const currentJudgeId = assignedJudges[0]?._id || (typeof assignedJudges[0] === "string" ? assignedJudges[0] : "");
              const currentJudgeObj = assignedJudges[0];
              const isUpdatingThis = updatingSubId === sub._id;

              return (
                <motion.div
                  key={sub._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card bg-[#0f0f11] border-zinc-800/90 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl"
                >
                  {/* Submission Title & Team Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white">{sub.projectName}</h3>
                        <span className={`badge ${statusBadge[sub.status] || "badge-gray"} capitalize text-[10px] font-extrabold`}>
                          {sub.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Team: <span className="text-indigo-300 font-bold">{sub.team?.name || "Unnamed Team"}</span>
                        {sub.createdAt && ` · Submitted ${format(new Date(sub.createdAt), "MMM d, yyyy")}`}
                      </p>
                    </div>
                  </div>

                  {/* ── ASSIGN JUDGE CONTROL BOX (Clean Vertical Stacking on Mobile) ── */}
                  <div className="space-y-2 bg-[#141417] border border-zinc-800/90 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <HiOutlineScale className="text-indigo-400 text-sm" /> Assign Judge:
                      </label>

                      {isUpdatingThis && (
                        <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 animate-pulse">
                          Updating assignment...
                        </span>
                      )}
                    </div>

                    {/* Select Dropdown (Full Width on Mobile & Desktop) */}
                    <div className="relative">
                      <select
                        value={currentJudgeId}
                        disabled={isUpdatingThis}
                        onChange={(e) => handleSelectJudge(sub._id, e.target.value, sub.projectName)}
                        className="w-full bg-[#18181b] border border-zinc-700/80 focus:border-indigo-500 text-white text-xs font-bold rounded-xl px-3.5 py-2.5 outline-none transition-colors cursor-pointer min-h-[44px]"
                      >
                        <option value="">-- Click to Select a Judge --</option>
                        {allJudges.map((j) => (
                          <option key={j._id} value={j._id}>
                            {j.name} ({j.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dedicated Red Remove Button below dropdown */}
                    {currentJudgeId && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => handleSelectJudge(sub._id, "", sub.projectName)}
                        className="w-full btn-danger text-xs py-2 flex items-center justify-center gap-1.5 font-bold rounded-xl cursor-pointer min-h-[40px] transition-all"
                      >
                        <HiOutlineTrash className="text-sm" /> Remove Assigned Judge ({currentJudgeObj?.name || "Judge"})
                      </button>
                    )}
                  </div>

                  {/* Active Evaluator & Links Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Active Evaluator:</span>
                      {assignedJudges.length === 0 ? (
                        <span className="text-zinc-500 italic text-xs">Unassigned (Open to all judges)</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-xl text-xs font-extrabold">
                          <HiOutlineShieldCheck className="text-indigo-400 text-sm" />
                          <span>{currentJudgeObj?.name || "Assigned Judge"}</span>
                        </div>
                      )}
                    </div>

                    {/* Links Buttons (Equal 50% width on Mobile) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {sub.githubRepo && (
                        <a
                          href={sub.githubRepo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-2 rounded-xl transition-colors font-bold min-h-[40px]"
                        >
                          <FaGithub className="text-sm" /> Repo
                        </a>
                      )}
                      {sub.liveDemoUrl && (
                        <a
                          href={sub.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 px-3 py-2 rounded-xl transition-colors font-extrabold min-h-[40px]"
                        >
                          <HiOutlineExternalLink className="text-sm text-emerald-400" /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Problem Statement Snippet */}
                  {sub.problemStatement && (
                    <div className="text-zinc-400 text-xs leading-relaxed bg-[#141417] p-3 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Problem: </span>
                      {sub.problemStatement}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrganizerJudgesPage;
