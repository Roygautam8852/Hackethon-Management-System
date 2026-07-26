import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, submissionAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineStar, HiOutlineDocumentText, HiOutlineScale,
  HiOutlineCheck, HiOutlineUserAdd, HiOutlineExternalLink, HiOutlineTrash,
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
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineScale className="text-zinc-400" /> Assign Judges to Team Submissions
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Select a judge from the dropbox or click Remove to unassign them from a team submission
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400 font-medium">Hackathon:</span>
            <select
              value={selectedHackathon}
              onChange={e => setSelected(e.target.value)}
              className="input-field text-xs sm:text-sm font-semibold sm:w-64"
            >
              <option value="">Select Hackathon…</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card bg-indigo-500/10 border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg flex-shrink-0 mt-0.5 sm:mt-0">
              <HiOutlineUserAdd />
            </div>
            <div>
              <p className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">Team Submission Judge Assignment</p>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                Assign or remove judges for individual team project submissions using the controls below.
              </p>
            </div>
          </div>
          <span className="badge badge-primary text-[10px] font-bold flex-shrink-0 self-start sm:self-auto">
            {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Submissions List with Inline Judge Dropboxes & Remove Button */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : !selectedHackathon ? (
          <div className="empty-state py-16 card">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">Select a hackathon to view team submissions</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-300 font-semibold text-base mt-2">No team submissions yet</p>
            <p className="text-zinc-500 text-xs mt-1">Once teams submit their projects, they will appear here with judge dropboxes.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((sub) => {
              const assignedJudges = sub.assignedJudges || [];
              const currentJudgeId = assignedJudges[0]?._id || (typeof assignedJudges[0] === "string" ? assignedJudges[0] : "");
              const isUpdatingThis = updatingSubId === sub._id;

              return (
                <motion.div
                  key={sub._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card space-y-4 border-zinc-800 bg-[#0d0d0f] hover:border-zinc-700 transition-all p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-white truncate">{sub.projectName}</h3>
                        <span className={`badge ${statusBadge[sub.status] || "badge-gray"} capitalize text-[10px] font-extrabold`}>
                          {sub.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Team: <span className="text-indigo-400 font-extrabold">{sub.team?.name || "Unnamed Team"}</span>
                        {sub.createdAt && ` · Submitted ${format(new Date(sub.createdAt), "MMM d, yyyy")}`}
                      </p>
                    </div>

                    {/* ── INLINE JUDGE SELECT DROPBOX & REMOVE BUTTON (Responsive Stacking on Mobile) ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto bg-[#141417] border border-zinc-800 p-2.5 sm:p-2 rounded-xl">
                      <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <HiOutlineScale className="text-indigo-400 text-sm" /> Assign Judge:
                      </label>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={currentJudgeId}
                          disabled={isUpdatingThis}
                          onChange={(e) => handleSelectJudge(sub._id, e.target.value, sub.projectName)}
                          className="bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 flex-1 sm:w-64 transition-colors cursor-pointer min-h-[38px]"
                        >
                          <option value="">-- Select Judge --</option>
                          {allJudges.map((j) => (
                            <option key={j._id} value={j._id}>
                              {j.name} ({j.email})
                            </option>
                          ))}
                        </select>

                        {/* Red Remove Button if a judge is currently assigned */}
                        {currentJudgeId && (
                          <button
                            type="button"
                            disabled={isUpdatingThis}
                            onClick={() => handleSelectJudge(sub._id, "", sub.projectName)}
                            className="btn-danger text-xs px-2.5 py-2 flex items-center justify-center gap-1 font-bold cursor-pointer min-h-[38px] flex-shrink-0"
                            title="Remove assigned judge"
                          >
                            <HiOutlineTrash className="text-xs" /> Remove
                          </button>
                        )}

                        {isUpdatingThis && (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evaluator Badge & Links */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Active Evaluator:</span>
                      {assignedJudges.length === 0 ? (
                        <span className="text-zinc-500 italic text-xs">Unassigned (Open to any judge)</span>
                      ) : (
                        assignedJudges.map((j) => (
                          <div key={j._id || j} className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-xl font-bold">
                            <HiOutlineCheck className="text-indigo-400" />
                            <span>{j.name || "Assigned Judge"}</span>
                            <button
                              type="button"
                              onClick={() => handleSelectJudge(sub._id, "", sub.projectName)}
                              className="text-red-400 hover:text-red-300 ml-1 p-0.5 transition-colors cursor-pointer"
                              title="Remove judge"
                            >
                              <HiOutlineTrash className="text-xs" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                      {sub.githubRepo && (
                        <a href={sub.githubRepo} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors font-medium">
                          <FaGithub /> Repo
                        </a>
                      )}
                      {sub.liveDemoUrl && (
                        <a href={sub.liveDemoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-bold">
                          <HiOutlineExternalLink /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Problem Statement Snippet */}
                  {sub.problemStatement && (
                    <div className="text-zinc-400 text-xs leading-relaxed bg-[#111113] p-3 rounded-xl border border-zinc-800/80">
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
