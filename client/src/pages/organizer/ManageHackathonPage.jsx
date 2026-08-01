import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, registrationAPI, submissionAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineScale,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineSearch,
  HiOutlineExternalLink, HiOutlineTrash, HiOutlinePlus,
  HiOutlineFlag, HiOutlineClipboardList, HiOutlineUserAdd, HiOutlineCheck, HiOutlineX,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const statusBadge = {
  pending:      "badge-warning",
  approved:     "badge-success",
  rejected:     "badge-danger",
  under_review: "badge-primary",
};

const ManageHackathonPage = () => {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Judges tab
  const [allJudges, setAllJudges] = useState([]);
  const [judgeSearchFilter, setJudgeSearchFilter] = useState("");
  const [actionJudgeId, setActionJudgeId] = useState(null);

  // Submission Judge Assignment Modal
  const [assignSubModal, setAssignSubModal] = useState(null);
  const [selectedSubJudgeIds, setSelectedSubJudgeIds] = useState([]);
  const [savingSubJudges, setSavingSubJudges] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Delete Modal State
  const navigate = useNavigate();
  const [deleteStep, setDeleteStep] = useState(0);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Mobile action menu
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const handleDeleteHackathon = async () => {
    if (!hackathon) return;
    if (confirmInput.trim() !== hackathon.title.trim()) {
      toast.error(`Please type exact hackathon name "${hackathon.title}" to confirm`);
      return;
    }
    setDeleting(true);
    try {
      await hackathonAPI.delete(id);
      toast.success(`"${hackathon.title}" and all related data purged successfully!`);
      navigate("/organizer/hackathons");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete hackathon");
      setDeleting(false);
    }
  };

  const [publishing, setPublishing] = useState(false);

  const fetchData = async () => {
    try {
      const [hackRes, regRes, subRes, judgesRes] = await Promise.all([
        hackathonAPI.getById(id),
        registrationAPI.getByHackathon(id),
        submissionAPI.getByHackathon(id),
        hackathonAPI.getAllJudges(),
      ]);
      setHackathon(hackRes.data.data.hackathon);
      setRegistrations(regRes.data.data.registrations || []);
      setSubmissions(subRes.data.data.submissions || []);
      setAllJudges(judgesRes.data.data.judges || []);
    } catch (e) {
      toast.error("Failed to load hackathon data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  /* ── Registration actions ── */
  const handleApprove = async (regId) => {
    try {
      await registrationAPI.approve(regId);
      toast.success("Registration approved ✓");
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to approve"); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await registrationAPI.reject(rejectModal.regId, rejectReason);
      toast.success("Registration rejected");
      setRejectModal(null);
      setRejectReason("");
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to reject"); }
  };

  /* ── Submission actions ── */
  const handleSubStatus = async (subId, status) => {
    try {
      await submissionAPI.updateStatus(subId, status);
      toast.success(`Submission marked as ${status.replace("_", " ")}`);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to update status"); }
  };

  const openSubJudgeModal = (sub) => {
    setAssignSubModal(sub);
    const existingIds = (sub.assignedJudges || []).map(j => (typeof j === "string" ? j : j._id));
    setSelectedSubJudgeIds(existingIds);
  };

  const toggleSubJudge = (judgeId) => {
    setSelectedSubJudgeIds(prev =>
      prev.includes(judgeId) ? prev.filter(i => i !== judgeId) : [...prev, judgeId]
    );
  };

  const handleSaveSubJudges = async () => {
    if (!assignSubModal) return;
    setSavingSubJudges(true);
    try {
      await submissionAPI.assignJudges(assignSubModal._id, selectedSubJudgeIds);
      toast.success("Judges assigned to submission ✓");
      setAssignSubModal(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to assign judges");
    } finally {
      setSavingSubJudges(false);
    }
  };

  /* ── Global Judge actions ── */
  const handleAssignJudge = async (judgeId, judgeName) => {
    setActionJudgeId(judgeId);
    try {
      await hackathonAPI.assignJudge(id, judgeId);
      toast.success(`${judgeName} assigned to hackathon ✓`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to assign judge");
    } finally {
      setActionJudgeId(null);
    }
  };

  const handleRemoveJudge = async (judgeId, judgeName) => {
    setActionJudgeId(judgeId);
    try {
      await hackathonAPI.removeJudge(id, judgeId);
      toast.success(`${judgeName || "Judge"} removed`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove judge");
    } finally {
      setActionJudgeId(null);
    }
  };

  /* ── Publish results ── */
  const handlePublish = async () => {
    if (!confirm("Mark this hackathon as COMPLETED and publish results? This cannot be undone.")) return;
    setPublishing(true);
    try {
      await hackathonAPI.publishResults(id, {});
      toast.success("Results published! Hackathon marked as completed 🎉");
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  /* ── Toggle registration ── */
  const handleToggleReg = async () => {
    try {
      await hackathonAPI.toggleRegistration(id);
      toast.success(hackathon.registrationOpen ? "Registration closed" : "Registration opened");
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  // Compute unique judge count (hackathon-level + submission-level)
  const allAssignedJudgeIds = new Set(
    (hackathon?.assignedJudges || []).map(j => (typeof j === "string" ? j : j._id))
  );
  submissions.forEach(s => {
    (s.assignedJudges || []).forEach(j => {
      const jId = typeof j === "string" ? j : j._id;
      if (jId) allAssignedJudgeIds.add(jId.toString());
    });
  });

  const tabs = [
    { id: "overview",      label: "Overview",       icon: HiOutlineClipboardList },
    { id: "registrations", label: "Registrations",  icon: HiOutlineUserGroup,    count: registrations.length },
    { id: "submissions",   label: "Submissions",    icon: HiOutlineDocumentText, count: submissions.length },
    { id: "judges",        label: "Judges",         icon: HiOutlineScale,        count: allAssignedJudgeIds.size },
  ];

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="spinner" />
        <p className="text-zinc-500 text-sm">Loading hackathon data…</p>
      </div>
    </DashboardLayout>
  );

  if (!hackathon) return (
    <DashboardLayout>
      <div className="empty-state py-20">
        <p>Hackathon not found</p>
        <Link to="/organizer/hackathons" className="btn-primary btn-sm">← Back</Link>
      </div>
    </DashboardLayout>
  );

  const pending = registrations.filter(r => r.status === "pending").length;
  const isEndDatePassed = hackathon.endDate ? new Date() >= new Date(hackathon.endDate) : true;
  const isRegDeadlinePassed = hackathon.registrationDeadline ? new Date() > new Date(hackathon.registrationDeadline) : false;

  // Count ALL unique judges — hackathon-level + submission-level combined
  const hackathonJudgeIds = new Set(
    (hackathon.assignedJudges || []).map(j => (typeof j === "string" ? j : j._id))
  );
  submissions.forEach(s => {
    (s.assignedJudges || []).forEach(j => {
      const jId = typeof j === "string" ? j : j._id;
      if (jId) hackathonJudgeIds.add(jId.toString());
    });
  });
  const totalJudgesAssigned = hackathonJudgeIds.size;

  return (
    <DashboardLayout>
      <div className="manage-page space-y-5 pb-10">

        {/* ── HEADER ── */}
        <div className="manage-header">
          {/* Title row */}
          <div className="manage-title-row">
            <div className="manage-title-block">
              <div className="manage-title-badges">
                <h1 className="manage-hackathon-title">{hackathon.title}</h1>
                <span className={`badge ${
                  hackathon.status === "completed" ? "badge-success" :
                  hackathon.status === "registration_open" ? "badge-primary" :
                  "badge-warning"
                } capitalize text-[10px] font-bold`}>
                  {hackathon.status?.replace(/_/g, " ")}
                </span>
                {isRegDeadlinePassed ? (
                  <span className="badge badge-danger text-[10px]">Reg Deadline Passed</span>
                ) : hackathon.registrationOpen ? (
                  <span className="badge badge-success text-[10px]">Reg Open</span>
                ) : null}
              </div>
              <p className="manage-hackathon-meta">
                {hackathon.mode} · {hackathon.theme}
                {hackathon.startDate && ` · ${format(new Date(hackathon.startDate), "MMM d")} – ${format(new Date(hackathon.endDate), "MMM d, yyyy")}`}
              </p>
            </div>

            {/* Desktop actions */}
            <div className="manage-actions-desktop">
              <button
                onClick={handleToggleReg}
                className={`manage-action-btn ${hackathon.registrationOpen ? "manage-action-danger" : "manage-action-success"}`}
              >
                {hackathon.registrationOpen ? <HiOutlineXCircle /> : <HiOutlineCheckCircle />}
                {hackathon.registrationOpen ? "Close Reg" : "Open Reg"}
              </button>
              <Link
                to={`/hackathons/${hackathon._id}`}
                target="_blank"
                className="manage-action-btn manage-action-ghost"
              >
                <HiOutlineExternalLink /> Preview
              </Link>
              {hackathon.status !== "completed" && (
                <button
                  onClick={handlePublish}
                  disabled={publishing || !isEndDatePassed}
                  title={!isEndDatePassed ? `Available after ${format(new Date(hackathon.endDate), "MMM d, yyyy")}` : ""}
                  className="manage-action-btn manage-action-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineFlag />
                  {publishing ? "Publishing…" : "Publish Results"}
                </button>
              )}
              <button
                onClick={() => { setDeleteStep(1); setConfirmInput(""); }}
                className="manage-action-btn manage-action-delete"
              >
                <HiOutlineTrash /> Delete
              </button>
            </div>

            {/* Mobile actions dropdown */}
            <div className="manage-actions-mobile">
              <button
                onClick={() => setMobileActionsOpen(v => !v)}
                className="manage-mobile-menu-btn"
              >
                Actions <HiOutlineChevronDown className={`transition-transform ${mobileActionsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Mobile dropdown panel */}
          <AnimatePresence>
            {mobileActionsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="manage-mobile-actions-panel"
              >
                <button
                  onClick={() => { handleToggleReg(); setMobileActionsOpen(false); }}
                  className={`manage-mobile-action-item ${hackathon.registrationOpen ? "text-red-400" : "text-emerald-400"}`}
                >
                  {hackathon.registrationOpen ? <HiOutlineXCircle className="text-lg" /> : <HiOutlineCheckCircle className="text-lg" />}
                  {hackathon.registrationOpen ? "Close Registration" : "Open Registration"}
                </button>
                <Link
                  to={`/hackathons/${hackathon._id}`}
                  target="_blank"
                  className="manage-mobile-action-item text-zinc-300"
                  onClick={() => setMobileActionsOpen(false)}
                >
                  <HiOutlineExternalLink className="text-lg" /> Preview Page
                </Link>
                {hackathon.status !== "completed" && (
                  <button
                    onClick={() => { handlePublish(); setMobileActionsOpen(false); }}
                    disabled={publishing || !isEndDatePassed}
                    className="manage-mobile-action-item text-white disabled:opacity-50"
                  >
                    <HiOutlineFlag className="text-lg" />
                    {publishing ? "Publishing…" : "Publish Results"}
                  </button>
                )}
                <button
                  onClick={() => { setDeleteStep(1); setConfirmInput(""); setMobileActionsOpen(false); }}
                  className="manage-mobile-action-item text-red-400 border-t border-red-500/20 mt-1 pt-2"
                >
                  <HiOutlineTrash className="text-lg" /> Delete Hackathon
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── TABS ── */}
        <div className="manage-tabs-wrapper">
          <div className="manage-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`manage-tab-btn ${activeTab === tab.id ? "manage-tab-active" : ""}`}
              >
                <tab.icon />
                <span className="manage-tab-label">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`manage-tab-count ${activeTab === tab.id ? "active" : ""}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="manage-stats-grid">
              {[
                { label: "Total Registrations", value: registrations.length, color: "text-indigo-400", bg: "from-indigo-500/10 to-transparent" },
                { label: "Pending Approval", value: pending, color: "text-amber-400", bg: "from-amber-500/10 to-transparent" },
                { label: "Submissions", value: submissions.length, color: "text-emerald-400", bg: "from-emerald-500/10 to-transparent" },
                { label: "Judges Assigned", value: totalJudgesAssigned, color: "text-violet-400", bg: "from-violet-500/10 to-transparent" },
              ].map(s => (
                <div key={s.label} className={`manage-stat-card bg-gradient-to-br ${s.bg}`}>
                  <p className={`manage-stat-value ${s.color}`}>{s.value}</p>
                  <p className="manage-stat-label">{s.label}</p>
                </div>
              ))}
            </div>

            {pending > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="manage-pending-alert"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-amber-300 text-sm font-semibold">
                      {pending} registration{pending > 1 ? "s" : ""} awaiting approval
                    </p>
                    <p className="text-amber-500/70 text-xs mt-0.5">Review and approve or reject teams</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab("registrations")} className="manage-alert-btn">
                  Review Now →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── REGISTRATIONS TAB ── */}
        {activeTab === "registrations" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {registrations.length === 0 ? (
              <div className="empty-state py-16 card">
                <HiOutlineUserGroup className="text-5xl text-zinc-700" />
                <p className="text-zinc-400 text-sm mt-2">No registrations yet</p>
                <p className="text-zinc-600 text-xs">Teams that register will appear here</p>
              </div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="manage-card-list md:hidden">
                  {registrations.map(r => (
                    <div key={r._id} className="manage-reg-card">
                      <div className="manage-reg-card-header">
                        <div className="manage-reg-avatar">
                          {r.team?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="manage-reg-team-name">{r.team?.name}</p>
                          <p className="manage-reg-leader">{r.team?.leader?.name}</p>
                        </div>
                        <span className={`badge ${statusBadge[r.status] || "badge-gray"} capitalize text-[10px]`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="manage-reg-card-meta">
                        <span className="manage-meta-chip">
                          <HiOutlineUserGroup className="text-xs" />
                          {r.team?.members?.length || 0} members
                        </span>
                        {r.registeredAt && (
                          <span className="manage-meta-chip">
                            {format(new Date(r.registeredAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {r.status === "pending" && (
                        <div className="manage-reg-card-actions">
                          <button
                            onClick={() => handleApprove(r._id)}
                            className="manage-approve-btn"
                          >
                            <HiOutlineCheckCircle /> Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal({ regId: r._id }); setRejectReason(""); }}
                            className="manage-reject-btn"
                          >
                            <HiOutlineXCircle /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="card p-0 overflow-x-auto hidden md:block">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Leader</th>
                        <th>Members</th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map(r => (
                        <tr key={r._id}>
                          <td className="font-semibold text-white">{r.team?.name}</td>
                          <td className="text-zinc-400 text-sm">{r.team?.leader?.name}</td>
                          <td className="text-zinc-500 text-sm">{r.team?.members?.length || 0}</td>
                          <td className="text-zinc-500 text-xs">
                            {r.registeredAt ? format(new Date(r.registeredAt), "MMM d, yyyy") : "—"}
                          </td>
                          <td>
                            <span className={`badge ${statusBadge[r.status] || "badge-gray"} capitalize text-[10px]`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            {r.status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(r._id)}
                                  className="btn-primary btn-sm text-xs py-1 px-2.5 flex items-center gap-1"
                                >
                                  <HiOutlineCheckCircle /> Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModal({ regId: r._id }); setRejectReason(""); }}
                                  className="btn-danger btn-sm text-xs py-1 px-2.5 flex items-center gap-1"
                                >
                                  <HiOutlineXCircle /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {activeTab === "submissions" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {submissions.length === 0 ? (
              <div className="empty-state py-16 card">
                <HiOutlineDocumentText className="text-5xl text-zinc-700" />
                <p className="text-zinc-400 text-sm mt-2">No submissions yet</p>
                <p className="text-zinc-600 text-xs">Team submissions will appear here</p>
              </div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="manage-card-list md:hidden">
                  {submissions.map(s => {
                    const assigned = s.assignedJudges || [];
                    return (
                      <div key={s._id} className="manage-sub-card">
                        <div className="manage-sub-card-top">
                          <div className="flex-1 min-w-0">
                            <p className="manage-sub-name">{s.projectName}</p>
                            <p className="manage-sub-team">{s.team?.name}</p>
                          </div>
                          <span className={`badge ${statusBadge[s.status] || "badge-gray"} capitalize text-[10px] flex-shrink-0`}>
                            {s.status?.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="manage-sub-judges-row">
                          <span className="text-zinc-500 text-xs">Judges:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {assigned.length === 0 ? (
                              <span className="text-zinc-600 text-xs italic">Unassigned</span>
                            ) : (
                              assigned.map(j => (
                                <span key={j._id || j} className="badge badge-primary text-[10px]">
                                  {j.name || "Judge"}
                                </span>
                              ))
                            )}
                            <button
                              onClick={() => openSubJudgeModal(s)}
                              className="manage-assign-judge-btn"
                            >
                              <HiOutlineUserAdd /> Edit
                            </button>
                          </div>
                        </div>

                        <div className="manage-sub-status-row">
                          <span className="text-zinc-500 text-xs">Change Status:</span>
                          <select
                            value={s.status}
                            onChange={e => handleSubStatus(s._id, e.target.value)}
                            className="manage-status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="card p-0 overflow-x-auto hidden md:block">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Team</th>
                        <th>Assigned Judges</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => {
                        const assigned = s.assignedJudges || [];
                        return (
                          <tr key={s._id}>
                            <td className="font-semibold text-white max-w-[180px] truncate">{s.projectName}</td>
                            <td className="text-zinc-400 text-sm">{s.team?.name}</td>
                            <td>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {assigned.length === 0 ? (
                                  <span className="text-zinc-500 text-xs italic">Unassigned</span>
                                ) : (
                                  assigned.map(j => (
                                    <span key={j._id || j} className="badge badge-primary text-[10px]">
                                      {j.name || "Judge"}
                                    </span>
                                  ))
                                )}
                                <button
                                  onClick={() => openSubJudgeModal(s)}
                                  className="btn-ghost btn-sm text-[10px] text-indigo-400 flex items-center gap-0.5"
                                >
                                  <HiOutlineUserAdd /> Edit
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${statusBadge[s.status] || "badge-gray"} capitalize text-[10px]`}>
                                {s.status?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              <select
                                value={s.status}
                                onChange={e => handleSubStatus(s._id, e.target.value)}
                                className="text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── JUDGES TAB ── */}
        {activeTab === "judges" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Search bar */}
            <div className="manage-judge-search-row">
              <div className="relative flex-1">
                <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base pointer-events-none z-10" />
                <input
                  value={judgeSearchFilter}
                  onChange={e => setJudgeSearchFilter(e.target.value)}
                  placeholder="Search judges by name or email…"
                  className="input-field pl-10 text-sm"
                />
              </div>
              <div className="manage-judge-count-badge">
                {hackathon.assignedJudges?.length || 0} assigned
              </div>
            </div>

            {/* Judges list */}
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
                All Registered Judges ({allJudges.length})
              </h3>
              {allJudges.length === 0 ? (
                <div className="empty-state py-8">
                  <HiOutlineScale className="text-3xl text-zinc-600" />
                  <p className="text-zinc-500 text-sm mt-1">No judges registered yet</p>
                  <p className="text-zinc-600 text-xs">Users who sign up as "Judge" will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allJudges
                    .filter(j =>
                      j.name?.toLowerCase().includes(judgeSearchFilter.toLowerCase()) ||
                      j.email?.toLowerCase().includes(judgeSearchFilter.toLowerCase())
                    )
                    .map(judge => {
                      const assignedIds = new Set((hackathon.assignedJudges || []).map(j => (typeof j === "string" ? j : j._id)));
                      const isAssigned = assignedIds.has(judge._id);
                      const isBusy = actionJudgeId === judge._id;

                      return (
                        <div
                          key={judge._id}
                          className={`manage-judge-row ${isAssigned ? "manage-judge-assigned" : "manage-judge-default"}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`manage-judge-avatar ${isAssigned ? "manage-judge-avatar-assigned" : "manage-judge-avatar-default"}`}>
                              {judge.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-white truncate">{judge.name}</p>
                                {isAssigned && (
                                  <span className="badge badge-success text-[10px]">Assigned ✓</span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 truncate">{judge.email}</p>
                            </div>
                          </div>

                          {isAssigned ? (
                            <button
                              onClick={() => handleRemoveJudge(judge._id, judge.name)}
                              disabled={isBusy}
                              className="manage-judge-remove-btn"
                            >
                              {isBusy
                                ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                : <HiOutlineTrash />
                              }
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignJudge(judge._id, judge.name)}
                              disabled={isBusy}
                              className="manage-judge-assign-btn"
                            >
                              {isBusy
                                ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                : <HiOutlinePlus />
                              }
                              <span className="hidden sm:inline">Assign</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          ASSIGN JUDGES TO SUBMISSION MODAL
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {assignSubModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-box"
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Assign Judges</h3>
                  <p className="modal-subtitle truncate">{assignSubModal.projectName}</p>
                </div>
                <button onClick={() => setAssignSubModal(null)} className="modal-close-btn">
                  <HiOutlineX />
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-3">Select judge(s) to evaluate this project:</p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {allJudges.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-4 text-center">No registered judges found.</p>
                ) : (
                  allJudges.map(judge => {
                    const isChecked = selectedSubJudgeIds.includes(judge._id);
                    return (
                      <div
                        key={judge._id}
                        onClick={() => toggleSubJudge(judge._id)}
                        className={`modal-judge-item ${isChecked ? "modal-judge-checked" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {judge.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{judge.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{judge.email}</p>
                          </div>
                        </div>
                        <div className={`modal-checkbox ${isChecked ? "modal-checkbox-checked" : ""}`}>
                          {isChecked && <HiOutlineCheck className="text-xs" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="modal-footer">
                <button onClick={() => setAssignSubModal(null)} className="btn-secondary text-xs px-4 py-2">
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubJudges}
                  disabled={savingSubJudges}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {savingSubJudges ? "Saving…" : "Save Judges"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          REJECT MODAL
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-box"
            >
              <div className="modal-header">
                <h3 className="modal-title">Reject Registration</h3>
                <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="modal-close-btn">
                  <HiOutlineX />
                </button>
              </div>
              <p className="text-zinc-400 text-sm mb-3">Optionally provide a reason — it will be sent to the team leader.</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Team size does not meet requirements…"
                className="input-field resize-none text-sm"
              />
              <div className="modal-footer">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
                <button onClick={handleReject} className="btn-danger text-sm px-4 py-2">
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          TWO-STEP DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteStep > 0 && hackathon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-box border-red-500/30"
            >
              <button onClick={() => setDeleteStep(0)} className="modal-close-btn absolute top-4 right-4">
                <HiOutlineX />
              </button>

              {/* STEP 1 */}
              {deleteStep === 1 && (
                <div className="space-y-4 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-2xl mx-auto">
                    <HiOutlineTrash />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-white">Delete Hackathon?</h3>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Step 1 of 2 · First Confirmation</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-zinc-300 space-y-2">
                    <p className="font-semibold text-white">
                      Are you sure you want to delete <span className="text-red-400">"{hackathon.title}"</span>?
                    </p>
                    <p className="text-zinc-400">
                      This will permanently purge all registrations, submissions, leaderboard scores, and judge evaluations.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button onClick={() => setDeleteStep(0)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                    <button onClick={() => setDeleteStep(2)} className="btn-danger text-xs px-4 py-2 font-bold">
                      Proceed →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {deleteStep === 2 && (
                <div className="space-y-4 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/30 text-red-300 border border-red-500 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-red-500/20">
                    <HiOutlineTrash />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-white">Final Confirmation</h3>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Step 2 of 2 · Permanent Purge</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-300">
                      Type the exact title <strong className="text-amber-400">{hackathon.title}</strong> to confirm:
                    </p>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={e => setConfirmInput(e.target.value)}
                      placeholder={`Type "${hackathon.title}"…`}
                      className="input-field text-sm border-red-500/40 focus:border-red-500 font-semibold"
                    />
                  </div>
                  <div className="modal-footer">
                    <button onClick={() => setDeleteStep(0)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                    <button
                      onClick={handleDeleteHackathon}
                      disabled={confirmInput.trim() !== hackathon.title.trim() || deleting}
                      className="btn-danger text-xs px-4 py-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {deleting ? "Purging…" : "DELETE PERMANENTLY"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default ManageHackathonPage;
