import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, submissionAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineDocumentText, HiOutlineExternalLink, HiOutlineFilter,
  HiOutlineUserAdd, HiOutlineX, HiOutlineCheck, HiOutlineScale,
} from "react-icons/hi";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const statusBadge = {
  pending:      "badge-warning",
  under_review: "badge-primary",
  approved:     "badge-success",
  rejected:     "badge-danger",
};

const OrganizerSubmissionsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [allJudges, setAllJudges] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Assign Judge Modal State
  const [assignModalSub, setAssignModalSub] = useState(null); // target submission
  const [selectedJudgeIds, setSelectedJudgeIds] = useState([]);
  const [savingJudges, setSavingJudges] = useState(false);

  useEffect(() => {
    Promise.all([
      hackathonAPI.getMy(),
      hackathonAPI.getAllJudges(),
    ])
      .then(([hackRes, judgeRes]) => {
        const list = hackRes.data.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) setSelectedHackathon(list[0]._id);
        setAllJudges(judgeRes.data.data.judges || []);
      })
      .catch(console.error);
  }, []);

  const fetchSubs = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    submissionAPI.getByHackathon(selectedHackathon)
      .then(r => setSubmissions(r.data.data.submissions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleStatusChange = async (subId, newStatus) => {
    try {
      await submissionAPI.updateStatus(subId, newStatus);
      toast.success(`Status updated to "${newStatus.replace("_", " ")}"`);
      fetchSubs();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update status");
    }
  };

  const openAssignModal = (sub) => {
    setAssignModalSub(sub);
    const existingIds = (sub.assignedJudges || []).map(j => (typeof j === "string" ? j : j._id));
    setSelectedJudgeIds(existingIds);
  };

  const toggleJudgeSelection = (judgeId) => {
    setSelectedJudgeIds(prev =>
      prev.includes(judgeId) ? prev.filter(id => id !== judgeId) : [...prev, judgeId]
    );
  };

  const handleSaveAssignedJudges = async () => {
    if (!assignModalSub) return;
    setSavingJudges(true);
    try {
      await submissionAPI.assignJudges(assignModalSub._id, selectedJudgeIds);
      toast.success("Assigned judges updated for project!");
      setAssignModalSub(null);
      fetchSubs();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to assign judges");
    } finally {
      setSavingJudges(false);
    }
  };

  const filtered = statusFilter
    ? submissions.filter(s => s.status === statusFilter)
    : submissions;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineDocumentText className="text-zinc-400" /> Project Submissions & Judge Assignment
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Review submitted projects and assign specific judges per team entry · {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedHackathon}
            onChange={e => setSelectedHackathon(e.target.value)}
            className="input-field sm:max-w-xs text-sm"
          >
            <option value="">Select Hackathon</option>
            {hackathons.map(h => (
              <option key={h._id} value={h._id}>{h.title}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field sm:max-w-[180px] text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : !selectedHackathon ? (
          <div className="empty-state py-16 card">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">Select a hackathon to view submissions</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineFilter className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">No submissions match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(s => {
              const assignedList = s.assignedJudges || [];
              return (
                <div key={s._id} className="card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{s.projectName}</h3>
                        <span className={`badge ${statusBadge[s.status] || "badge-gray"} capitalize text-[10px] font-bold`}>
                          {s.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Team: <span className="text-zinc-200 font-semibold">{s.team?.name}</span>
                        {s.createdAt && ` · Submitted ${format(new Date(s.createdAt), "MMM d, yyyy")}`}
                      </p>
                    </div>

                    {/* Status control */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
                      <select
                        value={s.status}
                        onChange={e => handleStatusChange(s._id, e.target.value)}
                        className="text-xs bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 flex-1 sm:flex-initial min-h-[44px]"
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <button
                        onClick={() => openAssignModal(s)}
                        className="btn-secondary text-xs px-3.5 py-2.5 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer font-bold"
                        title="Assign Judges to this Submission"
                      >
                        <HiOutlineUserAdd className="text-indigo-400 text-sm" />
                        Assign Judges ({assignedList.length})
                      </button>
                    </div>
                  </div>

                  {/* Assigned Judges Badges Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 flex-wrap">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <HiOutlineScale /> Assigned Evaluators:
                    </span>
                    {assignedList.length === 0 ? (
                      <span className="text-xs text-zinc-500 italic">No specific judges assigned yet (Any hackathon judge can evaluate)</span>
                    ) : (
                      assignedList.map(j => (
                        <div key={j._id || j} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs">
                          <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[9px]">
                            {j.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-zinc-200 font-medium">{j.name}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Description */}
                  {s.problemStatement && (
                    <div className="text-zinc-400 text-xs leading-relaxed border-t border-zinc-800 pt-3">
                      <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Problem: </span>
                      {s.problemStatement.slice(0, 200)}{s.problemStatement.length > 200 ? "…" : ""}
                    </div>
                  )}

                  {/* Tech Stack + Links */}
                  <div className="flex flex-wrap items-center gap-3">
                    {s.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.techStack.map(t => (
                          <span key={t} className="badge badge-gray text-[10px]">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                      {s.githubRepo && (
                        <a href={s.githubRepo} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                          <FaGithub /> GitHub
                        </a>
                      )}
                      {s.liveDemoUrl && (
                        <a href={s.liveDemoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                          <HiOutlineExternalLink /> Live Demo
                        </a>
                      )}
                      {s.demoVideoLink && (
                        <a href={s.demoVideoLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                          <HiOutlineExternalLink /> Video
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ASSIGN JUDGES MODAL */}
      {assignModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Assign Judges to Project</h3>
                <p className="text-xs text-zinc-400 truncate max-w-xs">{assignModalSub.projectName}</p>
              </div>
              <button onClick={() => setAssignModalSub(null)} className="text-zinc-500 hover:text-white p-1">
                <HiOutlineX />
              </button>
            </div>

            <p className="text-xs text-zinc-400">Select which judge(s) will be assigned to evaluate this submission:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allJudges.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4 text-center">No registered judges found in the platform.</p>
              ) : (
                allJudges.map(judge => {
                  const isChecked = selectedJudgeIds.includes(judge._id);
                  return (
                    <div
                      key={judge._id}
                      onClick={() => toggleJudgeSelection(judge._id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-indigo-500/10 border-indigo-500/40"
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                          {judge.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{judge.name}</p>
                          <p className="text-[11px] text-zinc-500">{judge.email}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-zinc-700"
                      }`}>
                        {isChecked && <HiOutlineCheck className="text-xs" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setAssignModalSub(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignedJudges}
                disabled={savingJudges}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                {savingJudges ? "Saving..." : "Save Assigned Judges"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizerSubmissionsPage;
