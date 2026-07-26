import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, submissionAPI, teamAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlineUpload, HiOutlineExternalLink, HiOutlineCode,
  HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineCheckCircle,
  HiOutlinePlay, HiOutlineSave, HiOutlinePencil, HiOutlineEye,
} from "react-icons/hi";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

const ParticipantSubmissionPage = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialHackathonId = params.get("hackathon") || "";

  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(initialHackathonId);
  const [submission, setSubmission] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Controls View Mode vs Edit Mode

  const [form, setForm] = useState({
    projectName: "",
    problemStatement: "",
    solutionDescription: "",
    githubRepo: "",
    liveDemoUrl: "",
    demoVideoLink: "",
    techStack: "",
  });

  useEffect(() => {
    hackathonAPI.getAll({ limit: 50 }).then((r) => {
      const list = r.data.data.hackathons;
      setHackathons(list);
      if (!selectedHackathon && list.length > 0) {
        setSelectedHackathon(list[0]._id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    setIsEditing(false);

    Promise.all([
      submissionAPI.getMySubmission(selectedHackathon),
      teamAPI.getMy(selectedHackathon),
    ])
      .then(([subRes, teamRes]) => {
        const sub = subRes.data.data?.submission;
        const t = teamRes.data.data?.team;
        setSubmission(sub || null);
        setTeam(t || null);

        if (sub) {
          setForm({
            projectName: sub.projectName || "",
            problemStatement: sub.problemStatement || "",
            solutionDescription: sub.solutionDescription || "",
            githubRepo: sub.githubRepo || "",
            liveDemoUrl: sub.liveDemoUrl || "",
            demoVideoLink: sub.demoVideoLink || "",
            techStack: sub.techStack?.join(", ") || "",
          });
        } else {
          setForm({
            projectName: "",
            problemStatement: "",
            solutionDescription: "",
            githubRepo: "",
            liveDemoUrl: "",
            demoVideoLink: "",
            techStack: "",
          });
          setIsEditing(true); // New submission form starts open & empty
        }
      })
      .catch(() => {
        setSubmission(null);
        setTeam(null);
      })
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!team) {
      toast.error("You must belong to a team before submitting a project.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        teamId: team._id,
        hackathonId: selectedHackathon,
      };

      if (submission) {
        const res = await submissionAPI.update(submission._id, payload);
        setSubmission(res.data.data.submission || submission);
        toast.success("Project submission updated!");
        setIsEditing(false); // Return to View Summary mode after updating
      } else {
        const res = await submissionAPI.create(payload);
        setSubmission(res.data.data.submission);
        toast.success("Project submitted successfully! 🎉");
        setIsEditing(false); // Return to View Summary mode after creation
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineDocumentText className="text-zinc-400" /> Project Submission Portal
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Submit or manage your team's hackathon project entry</p>
          </div>

          <Link
            to="/participant/team"
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <HiOutlineUserGroup /> Manage Team →
          </Link>
        </div>

        {/* Hackathon Selector Card */}
        <div className="card bg-[#0d0d0f] border-zinc-800">
          <label className="input-label text-xs">Target Hackathon Event</label>
          <select
            value={selectedHackathon}
            onChange={(e) => {
              setSelectedHackathon(e.target.value);
              setSubmission(null);
            }}
            className="input-field bg-[#111113] border-zinc-800 focus:border-zinc-500 text-xs"
          >
            <option value="">-- Select a Hackathon --</option>
            {hackathons.map((h) => (
              <option key={h._id} value={h._id}>
                {h.title} ({h.status})
              </option>
            ))}
          </select>
        </div>

        {/* Form or State Banner */}
        {selectedHackathon ? (
          loading ? (
            <div className="py-12 flex justify-center">
              <div className="spinner" />
            </div>
          ) : !team ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-amber-500/10 border-amber-500/30 text-amber-200 space-y-3"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                <span>⚠️ Team Required for Submission</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                You must create or join a team for this hackathon before submitting your project work.
              </p>
              <Link
                to={`/participant/team?hackathon=${selectedHackathon}`}
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                Create / Join Team Now →
              </Link>
            </motion.div>
          ) : submission && !isEditing ? (
            /* ── VIEW MODE SUMMARY CARD (Shown after successful submission) ── */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card space-y-5 border-emerald-500/30 bg-[#0d0d0f]"
            >
              {/* Success Banner */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg">
                    <HiOutlineCheckCircle />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Project Successfully Submitted</p>
                    <p className="text-xs text-zinc-400">Team: <span className="text-white font-semibold">{team.name}</span></p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <HiOutlinePencil /> Edit Submission
                </button>
              </div>

              {/* Submitted Details */}
              <div className="space-y-4 pt-1">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Project Name</p>
                  <p className="text-lg font-extrabold text-white mt-0.5">{submission.projectName}</p>
                </div>

                {submission.techStack?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Tech Stack</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {submission.techStack.map(t => (
                        <span key={t} className="badge badge-primary text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap pt-1">
                  {submission.githubRepo && (
                    <a
                      href={submission.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <FaGithub className="text-zinc-400" /> GitHub Repository
                    </a>
                  )}
                  {submission.liveDemoUrl && (
                    <a
                      href={submission.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <HiOutlineExternalLink className="text-zinc-400" /> Live Demo
                    </a>
                  )}
                  {submission.demoVideoLink && (
                    <a
                      href={submission.demoVideoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <HiOutlinePlay className="text-zinc-400" /> Demo Video
                    </a>
                  )}
                </div>

                {submission.problemStatement && (
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Problem Statement</p>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-[#111113] p-3 rounded-xl border border-zinc-800/80">
                      {submission.problemStatement}
                    </p>
                  </div>
                )}

                {submission.solutionDescription && (
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Solution Description</p>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-[#111113] p-3 rounded-xl border border-zinc-800/80 whitespace-pre-wrap">
                      {submission.solutionDescription}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ── EDIT / CREATE FORM MODE ── */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card space-y-5"
            >
              {/* Form Status Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {submission ? "Edit Project Submission" : "Submit New Project"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Team: <span className="text-zinc-300 font-semibold">{team.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {submission && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-ghost btn-sm text-xs text-zinc-400 flex items-center gap-1"
                    >
                      <HiOutlineEye /> View Summary
                    </button>
                  )}
                  {submission ? (
                    <span className="badge badge-success text-[10px] uppercase font-bold flex items-center gap-1">
                      <HiOutlineCheckCircle /> Submitted
                    </span>
                  ) : (
                    <span className="badge badge-warning text-[10px] uppercase font-bold">
                      New Entry
                    </span>
                  )}
                </div>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label text-xs">Project Name *</label>
                  <input
                    name="projectName"
                    value={form.projectName}
                    onChange={handleChange}
                    placeholder="e.g. Antigravity Agent, Decentralized Ledger, AutoFlow"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label text-xs flex items-center gap-1.5">
                      <FaGithub className="text-zinc-400" /> GitHub Repository URL
                    </label>
                    <input
                      name="githubRepo"
                      value={form.githubRepo}
                      onChange={handleChange}
                      placeholder="https://github.com/user/repo"
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="input-label text-xs flex items-center gap-1.5">
                      <HiOutlineExternalLink className="text-zinc-400" /> Live Demo URL
                    </label>
                    <input
                      name="liveDemoUrl"
                      value={form.liveDemoUrl}
                      onChange={handleChange}
                      placeholder="https://my-hackathon-app.vercel.app"
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label text-xs flex items-center gap-1.5">
                      <HiOutlinePlay className="text-zinc-400" /> Demo Video URL
                    </label>
                    <input
                      name="demoVideoLink"
                      value={form.demoVideoLink}
                      onChange={handleChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="input-label text-xs flex items-center gap-1.5">
                      <HiOutlineCode className="text-zinc-400" /> Tech Stack (comma separated)
                    </label>
                    <input
                      name="techStack"
                      value={form.techStack}
                      onChange={handleChange}
                      placeholder="React, Node.js, MongoDB, Solidity, Python"
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label text-xs">Problem Statement *</label>
                  <textarea
                    name="problemStatement"
                    value={form.problemStatement}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Briefly describe the challenge or problem your team targeted..."
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="input-label text-xs">Solution Description *</label>
                  <textarea
                    name="solutionDescription"
                    value={form.solutionDescription}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Detailed explanation of how your solution works, architecture, and feature capabilities..."
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  {submission && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary text-xs py-3 w-1/3"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-3 flex-1 flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                  >
                    {submitting ? (
                      "Saving..."
                    ) : submission ? (
                      <><HiOutlineSave className="text-sm" /> Save Updates</>
                    ) : (
                      <><HiOutlineUpload className="text-sm" /> Submit Project Entry</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )
        ) : (
          <div className="empty-state py-12">
            <HiOutlineDocumentText className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-xs">Please select a hackathon from the dropdown above to view or submit your project.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParticipantSubmissionPage;
