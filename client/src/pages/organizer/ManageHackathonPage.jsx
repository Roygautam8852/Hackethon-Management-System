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
} from "react-icons/hi";
import { motion } from "framer-motion";

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
  const [judgeEmail, setJudgeEmail] = useState("");
  const [searchingJudge, setSearchingJudge] = useState(false);
  const [foundJudge, setFoundJudge] = useState(null);

  // Submission Judge Assignment Modal
  const [assignSubModal, setAssignSubModal] = useState(null);
  const [selectedSubJudgeIds, setSelectedSubJudgeIds] = useState([]);
  const [savingSubJudges, setSavingSubJudges] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null); // { regId }
  const [rejectReason, setRejectReason] = useState("");

  // Delete Modal State
  const navigate = useNavigate();
  const [deleteStep, setDeleteStep] = useState(0);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  // Publish results
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

  const tabs = [
    { id: "overview",       label: "Overview",       icon: HiOutlineClipboardList },
    { id: "registrations",  label: "Registrations",  icon: HiOutlineUserGroup,     count: registrations.length },
    { id: "submissions",    label: "Submissions",     icon: HiOutlineDocumentText,  count: submissions.length },
    { id: "judges",         label: "Judges",          icon: HiOutlineScale,         count: hackathon?.assignedJudges?.length || 0 },
  ];

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{hackathon.title}</h1>
              <span className={`badge ${
                hackathon.status === "completed" ? "badge-success" :
                hackathon.status === "registration_open" ? "badge-primary" :
                "badge-warning"
              } capitalize text-[11px] font-bold`}>
                {hackathon.status?.replace(/_/g, " ")}
              </span>
              {hackathon.registrationOpen && <span className="badge badge-success text-[10px]">Reg Open</span>}
            </div>
            <p className="text-zinc-500 text-xs mt-1">
              {hackathon.mode} · {hackathon.theme}
              {hackathon.startDate && ` · ${format(new Date(hackathon.startDate), "MMM d")} – ${format(new Date(hackathon.endDate), "MMM d, yyyy")}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={handleToggleReg}
              className={`btn-sm text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg border transition-colors ${
                hackathon.registrationOpen
                  ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                  : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {hackathon.registrationOpen ? <HiOutlineXCircle /> : <HiOutlineCheckCircle />}
              {hackathon.registrationOpen ? "Close Reg" : "Open Reg"}
            </button>
            <Link
              to={`/hackathons/${hackathon._id}`}
              target="_blank"
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <HiOutlineExternalLink /> Preview
            </Link>
            {hackathon.status !== "completed" && (() => {
              const isEndDatePassed = hackathon.endDate ? new Date() >= new Date(hackathon.endDate) : true;
              return (
                <button
                  onClick={handlePublish}
                  disabled={publishing || !isEndDatePassed}
                  title={!isEndDatePassed ? `Results can only be published after ${format(new Date(hackathon.endDate), "MMM d, yyyy")}` : ""}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineFlag />
                  {publishing ? "Publishing..." : "Publish Results"}
                </button>
              );
            })()}

            <button
              onClick={() => { setDeleteStep(1); setConfirmInput(""); }}
              className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
              title="Delete Hackathon"
            >
              <HiOutlineTrash /> Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="text-sm" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Registrations", value: registrations.length, color: "text-indigo-400" },
              { label: "Pending Approval", value: pending, color: "text-amber-400" },
              { label: "Submissions", value: submissions.length, color: "text-emerald-400" },
              { label: "Judges Assigned", value: hackathon.assignedJudges?.length || 0, color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="card text-center py-5">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-zinc-500 text-[11px] mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
            {pending > 0 && (
              <div className="col-span-2 md:col-span-4 card bg-amber-500/5 border-amber-500/30 flex items-center justify-between gap-4">
                <p className="text-amber-300 text-sm font-semibold">
                  ⚠️ {pending} registration{pending > 1 ? "s" : ""} awaiting your approval
                </p>
                <button onClick={() => setActiveTab("registrations")} className="btn-primary text-xs px-4 py-2">
                  Review Now →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Registrations Tab ── */}
        {activeTab === "registrations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-x-auto">
            {registrations.length === 0 ? (
              <div className="empty-state py-12">
                <HiOutlineUserGroup className="text-4xl text-zinc-600" />
                <p className="text-zinc-400 text-sm mt-2">No registrations yet</p>
              </div>
            ) : (
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
            )}
          </motion.div>
        )}

        {/* ── Submissions Tab ── */}
        {activeTab === "submissions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-x-auto">
            {submissions.length === 0 ? (
              <div className="empty-state py-12">
                <HiOutlineDocumentText className="text-4xl text-zinc-600" />
                <p className="text-zinc-400 text-sm mt-2">No submissions yet</p>
              </div>
            ) : (
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
                              title="Assign Judges"
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
            )}
          </motion.div>
        )}

        {/* ── Judges Tab ── */}
        {activeTab === "judges" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Search bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-base pointer-events-none z-10" />
                <input
                  value={judgeSearchFilter}
                  onChange={e => setJudgeSearchFilter(e.target.value)}
                  placeholder="Search registered judges by name or email…"
                  className="input-field pl-10 text-sm"
                />
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                {hackathon.assignedJudges?.length || 0} assigned
              </span>
            </div>

            {/* List of All Registered Judges */}
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
                All Registered Judges ({allJudges.length})
              </h3>
              {allJudges.length === 0 ? (
                <div className="empty-state py-8">
                  <HiOutlineScale className="text-3xl text-zinc-600" />
                  <p className="text-zinc-500 text-sm mt-1">No judges registered in the platform yet</p>
                  <p className="text-zinc-600 text-xs">Users who sign up as "Judge" will appear here automatically.</p>
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
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isAssigned
                              ? "bg-emerald-500/5 border-emerald-500/30"
                              : "bg-zinc-900 border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                              isAssigned
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                            }`}>
                              {judge.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-white">{judge.name}</p>
                                {isAssigned && (
                                  <span className="badge badge-success text-[10px]">Assigned ✓</span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400">{judge.email}</p>
                            </div>
                          </div>

                          {isAssigned ? (
                            <button
                              onClick={() => handleRemoveJudge(judge._id, judge.name)}
                              disabled={isBusy}
                              className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1"
                            >
                              {isBusy ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineTrash />}
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignJudge(judge._id, judge.name)}
                              disabled={isBusy}
                              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                            >
                              {isBusy ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlinePlus />}
                              Assign
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

      {/* ASSIGN JUDGES TO SUBMISSION MODAL */}
      {assignSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Assign Judges to Project</h3>
                <p className="text-xs text-zinc-400 truncate max-w-xs">{assignSubModal.projectName}</p>
              </div>
              <button onClick={() => setAssignSubModal(null)} className="text-zinc-500 hover:text-white p-1">
                <HiOutlineX />
              </button>
            </div>

            <p className="text-xs text-zinc-400">Select which judge(s) will be assigned to evaluate this project:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allJudges.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4 text-center">No registered judges found.</p>
              ) : (
                allJudges.map(judge => {
                  const isChecked = selectedSubJudgeIds.includes(judge._id);
                  return (
                    <div
                      key={judge._id}
                      onClick={() => toggleSubJudge(judge._id)}
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
                onClick={() => setAssignSubModal(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubJudges}
                disabled={savingSubJudges}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                {savingSubJudges ? "Saving..." : "Save Assigned Judges"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Reject Registration</h3>
            <p className="text-zinc-400 text-sm">Optionally provide a reason — it will be sent to the team leader.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Team size does not meet requirements…"
              className="input-field resize-none text-sm"
            />
            <div className="flex gap-3 justify-end">
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
          </div>
        </div>
      )}

      {/* ── TWO-STEP DELETE CONFIRMATION MODAL ── */}
      {deleteStep > 0 && hackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#111113] border border-red-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
            <button onClick={() => setDeleteStep(0)} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1">
              <HiOutlineX />
            </button>

            {/* STEP 1: WARNING CONFIRMATION */}
            {deleteStep === 1 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-2xl mx-auto">
                  <HiOutlineTrash />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-white">Delete Hackathon?</h3>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Step 1 of 2: First Confirmation</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-zinc-300 space-y-2">
                  <p className="font-semibold text-white">Are you sure you want to delete <span className="text-red-400">"{hackathon.title}"</span>?</p>
                  <p className="text-zinc-400">
                    This will permanently purge this hackathon and all associated registrations, team submissions, leaderboard scores, and judge evaluations.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
                  <button onClick={() => setDeleteStep(0)} className="btn-secondary text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="btn-danger text-xs px-4 py-2 font-bold"
                  >
                    Yes, Proceed to Final Confirm →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TYPE TITLE TO CONFIRM */}
            {deleteStep === 2 && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/30 text-red-300 border border-red-500 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-red-500/20">
                  <HiOutlineTrash />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-white">Final Confirmation Required</h3>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Step 2 of 2: Permanent Purge</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-300">
                    To confirm deletion, please type the exact title <strong className="text-amber-400">{hackathon.title}</strong> below:
                  </p>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={e => setConfirmInput(e.target.value)}
                    placeholder={`Type "${hackathon.title}"...`}
                    className="input-field text-sm border-red-500/40 focus:border-red-500 font-semibold"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
                  <button onClick={() => setDeleteStep(0)} className="btn-secondary text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteHackathon}
                    disabled={confirmInput.trim() !== hackathon.title.trim() || deleting}
                    className="btn-danger text-xs px-4 py-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {deleting ? "Purging Data..." : "PERMANENTLY DELETE HACKATHON"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageHackathonPage;
