import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { submissionAPI, hackathonAPI, reviewAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlineStar, HiOutlineExternalLink, HiOutlineArrowLeft,
  HiOutlineCheckCircle, HiOutlineRefresh, HiOutlineCode,
} from "react-icons/hi";
import { FaGithub, FaYoutube } from "react-icons/fa";
import { motion } from "framer-motion";

const SCORE_COLORS = [
  "bg-red-500/20 border-red-500/30 text-red-400",
  "bg-orange-500/20 border-orange-500/30 text-orange-400",
  "bg-amber-500/20 border-amber-500/30 text-amber-400",
  "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
];

const scoreColor = (marks, max) => {
  if (!max) return SCORE_COLORS[0];
  const pct = marks / max;
  if (pct < 0.2) return SCORE_COLORS[0];
  if (pct < 0.4) return SCORE_COLORS[1];
  if (pct < 0.6) return SCORE_COLORS[2];
  if (pct < 0.8) return SCORE_COLORS[3];
  return SCORE_COLORS[4];
};

const ReviewSubmissionPage = () => {
  const { submissionId } = useParams();
  const [urlParams] = useSearchParams();
  const hackathonId = urlParams.get("hackathon");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission]       = useState(null);
  const [hackathon, setHackathon]         = useState(null);
  const [existingReview, setExistingReview] = useState(null); // if already reviewed
  const [scores, setScores]               = useState([]);
  const [feedback, setFeedback]           = useState("");
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [activeTab, setActiveTab]         = useState("project"); // "project" | "score"

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [subRes, hackRes, reviewsRes] = await Promise.all([
          submissionAPI.getById(submissionId),
          hackathonAPI.getById(hackathonId),
          reviewAPI.getBySubmission(submissionId),
        ]);

        const sub  = subRes.data.data.submission;
        const hack = hackRes.data.data.hackathon;
        const allReviews = reviewsRes.data.data.reviews || [];

        setSubmission(sub);
        setHackathon(hack);

        // Check if this judge already reviewed this submission
        const myReview = allReviews.find(r =>
          (r.judge?._id || r.judge)?.toString() === user?._id?.toString()
        );

        const criteria = hack.judgingCriteria || [];

        if (myReview) {
          setExistingReview(myReview);
          // Pre-fill scores from existing review
          const filled = criteria.map(c => {
            const existing = myReview.scores?.find(s => s.criterion === c.criterion);
            return {
              criterion: c.criterion,
              marks: existing?.marks ?? 0,
              maxMarks: c.maxMarks,
              description: c.description || "",
            };
          });
          setScores(filled);
          setFeedback(myReview.feedback || "");
        } else {
          // Fresh review
          setScores(criteria.map(c => ({
            criterion: c.criterion,
            marks: 0,
            maxMarks: c.maxMarks,
            description: c.description || "",
          })));
        }
      } catch (e) {
        toast.error("Failed to load submission details");
      } finally {
        setLoading(false);
      }
    };

    if (submissionId && hackathonId) fetchAll();
    else {
      toast.error("Missing hackathon ID. Please navigate from your assigned projects list.");
      setLoading(false);
    }
  }, [submissionId, hackathonId, user]);

  const handleScoreChange = (idx, value) => {
    setScores(prev => {
      const updated = [...prev];
      const max = updated[idx].maxMarks;
      updated[idx] = { ...updated[idx], marks: Math.min(max, Math.max(0, Number(value))) };
      return updated;
    });
  };

  const totalScore = scores.reduce((s, c) => s + (c.marks || 0), 0);
  const maxTotal   = scores.reduce((s, c) => s + (c.maxMarks || 0), 0);
  const pct        = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (scores.length === 0) {
      toast.error("No judging criteria defined for this hackathon.");
      return;
    }
    setSubmitting(true);
    try {
      if (existingReview) {
        // UPDATE existing review
        await reviewAPI.update(existingReview._id, { scores, feedback });
        toast.success("Review updated successfully ✓");
      } else {
        // CREATE new review
        await reviewAPI.submit({ submissionId, hackathonId, scores, feedback });
        toast.success("Review submitted! Scores are now live on the leaderboard 🎉");
      }
      navigate(`/judge/projects?hackathon=${hackathonId}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
    </DashboardLayout>
  );

  if (!submission || !hackathon) return (
    <DashboardLayout>
      <div className="empty-state py-20">
        <p className="text-zinc-400">Submission not found</p>
        <Link to="/judge/projects" className="btn-primary btn-sm mt-3">← Back to Projects</Link>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-zinc-800 pb-4">
          <div className="flex-1 min-w-0">
            <Link
              to={`/judge/projects?hackathon=${hackathonId}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-2 transition-colors w-fit"
            >
              <HiOutlineArrowLeft /> Back to Assigned Projects
            </Link>
            <h1 className="text-xl font-extrabold text-white tracking-tight">{submission.projectName}</h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              {hackathon.title} · Team: <span className="text-zinc-200 font-semibold">{submission.team?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {existingReview && (
              <span className="badge badge-success text-xs flex items-center gap-1 py-1.5 px-3">
                <HiOutlineCheckCircle /> Already Reviewed
              </span>
            )}
            {/* Score preview pill */}
            {existingReview && (
              <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-black text-indigo-300">{existingReview.totalScore}</p>
                <p className="text-[10px] text-zinc-500">/{maxTotal} pts</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800">
          {["project", "score"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs font-bold capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "project" ? "📋 Project Details" : "⭐ Score & Feedback"}
            </button>
          ))}
        </div>

        {/* Project Details Tab */}
        {activeTab === "project" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Project overview card */}
            <div className="card space-y-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Problem Statement</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{submission.problemStatement}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Solution Description</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{submission.solutionDescription}</p>
              </div>

              {/* Tech Stack */}
              {submission.techStack?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <HiOutlineCode /> Tech Stack
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {submission.techStack.map(t => (
                      <span key={t} className="badge badge-gray text-xs">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* External links */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800">
                {submission.githubRepo && (
                  <a href={submission.githubRepo} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                    <FaGithub /> GitHub Repository
                  </a>
                )}
                {submission.liveDemoUrl && (
                  <a href={submission.liveDemoUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                    <HiOutlineExternalLink /> Live Demo
                  </a>
                )}
                {submission.demoVideoLink && (
                  <a href={submission.demoVideoLink} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-2 flex items-center gap-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    <FaYoutube /> Demo Video
                  </a>
                )}
              </div>
            </div>

            {/* Screenshots */}
            {submission.screenshots?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Screenshots</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {submission.screenshots.map((sc, i) => (
                    <a key={i} href={sc.url} target="_blank" rel="noopener noreferrer">
                      <img src={sc.url} alt={`Screenshot ${i + 1}`}
                        className="rounded-xl object-cover w-full h-32 border border-zinc-800 hover:border-indigo-500/50 transition-colors cursor-pointer" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Go to scoring CTA */}
            <button
              onClick={() => setActiveTab("score")}
              className="btn-primary w-full py-3 justify-center text-sm flex items-center gap-2"
            >
              <HiOutlineStar />
              {existingReview ? "Edit My Scores →" : "Start Scoring →"}
            </button>
          </motion.div>
        )}

        {/* Score & Feedback Tab */}
        {activeTab === "score" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Score summary header */}
              <div className="card bg-[#0d0d0f] border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Score Summary</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {existingReview ? "Update your existing scores" : "Score each criterion — scores update the live leaderboard"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white">{totalScore}</p>
                    <p className="text-xs text-zinc-500">/ {maxTotal} pts</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full transition-all ${
                      pct >= 80 ? "bg-emerald-500" :
                      pct >= 60 ? "bg-indigo-500" :
                      pct >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 text-right">{pct}% of maximum</p>
              </div>

              {/* Per-criterion scoring */}
              {scores.length === 0 ? (
                <div className="empty-state py-8 card">
                  <HiOutlineStar className="text-3xl text-zinc-600" />
                  <p className="text-zinc-400 text-sm mt-2">No judging criteria set for this hackathon</p>
                  <p className="text-zinc-600 text-xs">The organizer needs to add criteria before scoring can begin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scores.map((s, i) => (
                    <div key={s.criterion} className="card space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-bold text-white">{s.criterion}</label>
                          {s.description && (
                            <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>
                          )}
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${scoreColor(s.marks, s.maxMarks)}`}>
                          {s.marks} / {s.maxMarks}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={s.maxMarks}
                          value={s.marks}
                          onChange={e => handleScoreChange(i, e.target.value)}
                          className="flex-1 h-2 appearance-none rounded-full cursor-pointer accent-indigo-500"
                          style={{ background: `linear-gradient(to right, #6366f1 ${(s.marks/s.maxMarks)*100}%, #27272a ${(s.marks/s.maxMarks)*100}%)` }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={s.maxMarks}
                          value={s.marks}
                          onChange={e => handleScoreChange(i, e.target.value)}
                          className="input-field w-20 text-center text-sm font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Written Feedback */}
              <div className="card space-y-3">
                <label className="text-sm font-bold text-white">Written Feedback</label>
                <p className="text-xs text-zinc-500">Constructive feedback helps teams improve. Teams will be able to read this.</p>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={5}
                  placeholder="e.g. The problem statement was clear and well-scoped. The solution architecture shows strong technical depth. Consider improving the UI polish and adding more documentation. Overall a very strong submission!"
                  className="input-field resize-none text-sm"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("project")}
                  className="btn-secondary flex items-center gap-1.5 text-sm px-4"
                >
                  <HiOutlineArrowLeft /> Review Project
                </button>
                <button
                  type="submit"
                  disabled={submitting || scores.length === 0}
                  className="btn-primary flex-1 justify-center text-sm py-3 flex items-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : existingReview ? (
                    <><HiOutlineRefresh /> Update Review</>
                  ) : (
                    <><HiOutlineStar /> Submit Review & Update Leaderboard</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReviewSubmissionPage;
