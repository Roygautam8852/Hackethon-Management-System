import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { teamAPI, hackathonAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlinePlus, HiOutlineUserAdd, HiOutlineTrash, HiOutlineLogout,
  HiOutlineUserGroup, HiOutlineMail, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineDuplicate, HiOutlineBell, HiOutlineUser, HiOutlineCode, HiOutlinePencilAlt,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const ParticipantTeamPage = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const hackathonId = params.get("hackathon") || "";
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(hackathonId);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberSkills, setMemberSkills] = useState("");
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  // Edit teammate email inline state
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Fetch pending invitations on mount
  useEffect(() => {
    teamAPI.getPendingInvitations()
      .then((r) => setPendingInvites(r.data.data.teams || []))
      .catch(() => setPendingInvites([]));
  }, []);

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
    teamAPI.getMy(selectedHackathon)
      .then((r) => setTeam(r.data.data.team))
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [selectedHackathon]);

  const handleRespondInvitation = async (teamId, action) => {
    setRespondingId(teamId + action);
    try {
      await teamAPI.respondInvitation(teamId, action);
      toast.success(action === "accept" ? "Invitation accepted! You joined the team." : "Invitation declined.");
      setPendingInvites((prev) => prev.filter((t) => t._id !== teamId));
      if (action === "accept" && selectedHackathon) {
        const res = await teamAPI.getMy(selectedHackathon);
        setTeam(res.data.data.team);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to respond to invitation");
    } finally {
      setRespondingId(null);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const res = await teamAPI.create({ name: teamName, hackathonId: selectedHackathon });
      setTeam(res.data.data.team);
      toast.success("Team created successfully!");
      setTeamName("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if ((!memberName.trim() && !memberEmail.trim()) || !team) return;
    setInviting(true);
    try {
      const payload = {
        name: memberName.trim(),
        email: memberEmail.trim(),
        skills: memberSkills.trim(),
      };
      const res = await teamAPI.invite(team._id, payload);
      toast.success(res.data.message || `${memberName || memberEmail} added to team! 🎉`);
      setMemberName("");
      setMemberEmail("");
      setMemberSkills("");
      const teamRes = await teamAPI.getMy(selectedHackathon);
      setTeam(teamRes.data.data.team);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to add member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      await teamAPI.removeMember(team._id, userId);
      toast.success("Member removed from team");
      const res = await teamAPI.getMy(selectedHackathon);
      setTeam(res.data.data.team);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove member");
    }
  };

  const startEditEmail = (memberUser) => {
    setEditingMemberId(memberUser._id);
    const raw = memberUser.email || "";
    const isPlaceholder = !raw || raw.includes("@pending.local") || raw.includes("@hacklytics.local");
    setEditingEmail(isPlaceholder ? "" : raw);
  };

  const handleSaveMemberEmail = async (memberUserId) => {
    if (!editingEmail.trim() || !editingEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSavingEmail(true);
    try {
      const res = await teamAPI.updateMemberEmail(team._id, memberUserId, editingEmail.trim());
      toast.success("Teammate email updated successfully!");
      setTeam(res.data.data.team);
      setEditingMemberId(null);
      setEditingEmail("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    try {
      await teamAPI.leave(team._id);
      toast.success("You have left the team");
      setTeam(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to leave team");
    }
  };

  const isLeader = team?.leader?._id === user?._id || team?.leader === user?._id;

  const copyTeamId = () => {
    if (team?._id) {
      navigator.clipboard.writeText(team._id);
      toast.success("Team ID copied to clipboard!");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineUserGroup className="text-zinc-400" /> My Hackathon Team
            </h1>
            <p className="text-zinc-400 text-xs mt-1">Create, join, or manage team members for your hackathons</p>
          </div>

          <Link
            to="/hackathons"
            className="btn-secondary text-xs px-3.5 py-2 flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            Browse Hackathons →
          </Link>
        </div>

        {/* Pending Invitations Banner */}
        <AnimatePresence>
          {pendingInvites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card border-indigo-500/30 bg-indigo-500/5 space-y-3"
            >
              <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <HiOutlineBell className="text-indigo-400 text-base" />
                Pending Team Invitations
                <span className="ml-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingInvites.length}
                </span>
              </h3>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{invite.name}</p>
                      <p className="text-xs text-zinc-400">
                        Hackathon: <span className="text-zinc-200">{invite.hackathon?.title}</span>
                        {" · "}Leader: <span className="text-zinc-200">{invite.leader?.name}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleRespondInvitation(invite._id, "accept")}
                        disabled={!!respondingId}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-1 sm:flex-initial justify-center"
                      >
                        <HiOutlineCheckCircle />
                        {respondingId === invite._id + "accept" ? "Joining..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleRespondInvitation(invite._id, "reject")}
                        disabled={!!respondingId}
                        className="btn-danger text-xs px-3 py-1.5 flex-1 sm:flex-initial justify-center"
                      >
                        {respondingId === invite._id + "reject" ? "..." : "Decline"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hackathon Selector Card */}
        <div className="card bg-[#0d0d0f] border-zinc-800 space-y-2">
          <label className="input-label text-xs">Target Hackathon Event</label>
          <select
            value={selectedHackathon}
            onChange={(e) => setSelectedHackathon(e.target.value)}
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

        {/* Dynamic Content based on Hackathon Selection */}
        {selectedHackathon ? (
          loading ? (
            <div className="py-12 flex justify-center">
              <div className="spinner" />
            </div>
          ) : team ? (
            /* Team Details & Roster */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Main Team Info Header Card */}
              <div className="card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{team.name}</h2>
                      <span
                        className={`badge ${
                          team.status === "approved"
                            ? "badge-success"
                            : team.status === "registered"
                            ? "badge-primary"
                            : team.status === "rejected"
                            ? "badge-danger"
                            : "badge-warning"
                        } text-[10px] font-bold uppercase`}
                      >
                        {team.status === "forming" ? "REGISTERED" : team.status}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1">
                      Event: <span className="text-zinc-200 font-semibold">{team.hackathon?.title || "Hackathon"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={copyTeamId}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                      title="Copy Team ID"
                    >
                      <HiOutlineDuplicate /> Team ID
                    </button>
                    {!isLeader && (
                      <button onClick={handleLeave} className="btn-danger text-xs px-3 py-1.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer">
                        <HiOutlineLogout /> Leave Team
                      </button>
                    )}
                  </div>
                </div>

                {/* Roster & Members */}
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Team Roster</p>
                  <div className="space-y-2.5">
                    {team.members?.map((m) => {
                      const memberUser = m.user || {};
                      const isTeamLeader = memberUser._id === team.leader?._id || memberUser._id === team.leader;
                      const rawEmail = memberUser.email || "";
                      const isPlaceholderEmail = !rawEmail || rawEmail.includes("@pending.local") || rawEmail.includes("@hacklytics.local");
                      const isEditing = editingMemberId === memberUser._id;
                      const canEditEmail = isLeader || memberUser._id === user?._id;

                      return (
                        <div
                          key={memberUser._id || Math.random()}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-zinc-900/90 border border-zinc-800/80 rounded-xl"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0 mt-0.5 sm:mt-0">
                              {memberUser.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-bold text-zinc-200">{memberUser.name || "Teammate"}</p>
                                {isTeamLeader && <span className="badge badge-primary text-[9px] px-1.5 py-0.5 font-extrabold">Leader</span>}
                              </div>

                              {/* Inline Email Display & Edit Mode */}
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <input
                                    type="email"
                                    value={editingEmail}
                                    onChange={(e) => setEditingEmail(e.target.value)}
                                    placeholder="Enter teammate's real email"
                                    className="bg-[#0d0d0f] border border-indigo-500/80 text-white text-xs rounded-lg px-2.5 py-1 outline-none min-w-[210px]"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveMemberEmail(memberUser._id)}
                                    disabled={savingEmail}
                                    className="btn-primary text-[11px] px-2.5 py-1 min-h-[30px] font-bold cursor-pointer"
                                  >
                                    {savingEmail ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditingMemberId(null)}
                                    className="btn-ghost text-[11px] px-2 py-1 min-h-[30px] text-zinc-400 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isPlaceholderEmail ? (
                                    <span className="text-zinc-500 italic text-[11px]">No email provided</span>
                                  ) : (
                                    <span className="text-zinc-300 text-[11px] font-mono truncate max-w-[220px] sm:max-w-xs">{rawEmail}</span>
                                  )}

                                  {canEditEmail && (
                                    <button
                                      onClick={() => startEditEmail(memberUser)}
                                      className="text-indigo-300 hover:text-white text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                      title="Provide or edit teammate's real email address"
                                    >
                                      <HiOutlinePencilAlt className="text-xs text-indigo-400" />
                                      {isPlaceholderEmail ? "Add Email" : "Edit Email"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 border-t sm:border-t-0 border-zinc-800/60 pt-2 sm:pt-0">
                            <span
                              className={`badge text-[10px] ${
                                m.status === "accepted"
                                  ? "badge-success"
                                  : m.status === "pending"
                                  ? "badge-warning"
                                  : "badge-danger"
                              }`}
                            >
                              {m.status === "accepted" ? (
                                <span className="flex items-center gap-1"><HiOutlineCheckCircle /> Member</span>
                              ) : (
                                <span className="flex items-center gap-1"><HiOutlineClock /> Invited</span>
                              )}
                            </span>

                            {isLeader && memberUser._id !== user?._id && (
                              <button
                                onClick={() => handleRemoveMember(memberUser._id)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remove member"
                              >
                                <HiOutlineTrash className="text-base" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Add Member Form Card (Team Leader Only) */}
              {isLeader && (
                <div className="card space-y-4">
                  <div className="border-b border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <HiOutlineUserAdd className="text-zinc-400" /> Add Team Member
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Fill out your teammate's name. Email is optional — if not provided now, you can add their real email anytime using the "Add Email" option!
                    </p>
                  </div>

                  <form onSubmit={handleAddMember} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Teammate Full Name */}
                      <div>
                        <label className="input-label text-[11px] mb-1">Teammate Full Name</label>
                        <div className="relative flex items-center">
                          <HiOutlineUser className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                          <input
                            type="text"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            placeholder="e.g. Raju or Aryan Sharma"
                            className="input-field input-with-icon-left bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Teammate Email Address */}
                      <div>
                        <label className="input-label text-[11px] mb-1">Teammate Email Address (Optional)</label>
                        <div className="relative flex items-center">
                          <HiOutlineMail className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                          <input
                            type="email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            placeholder="e.g. raju@gmail.com (Optional)"
                            className="input-field input-with-icon-left bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Skills / Tech Stack (Optional) */}
                    <div>
                      <label className="input-label text-[11px] mb-1">Skills / Tech Stack (Optional)</label>
                      <div className="relative flex items-center">
                        <HiOutlineCode className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                        <input
                          type="text"
                          value={memberSkills}
                          onChange={(e) => setMemberSkills(e.target.value)}
                          placeholder="e.g. React, Python, Machine Learning"
                          className="input-field input-with-icon-left bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={inviting || (!memberName.trim() && !memberEmail.trim())}
                      className="btn-primary text-xs py-2.5 px-6 w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {inviting ? "Adding Teammate..." : <><HiOutlineUserAdd className="text-sm" /> Add Teammate</>}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          ) : (
            /* Create Team Form */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <HiOutlinePlus className="text-white" /> Create a New Team
                </h2>
                <p className="text-zinc-400 text-xs mt-1">
                  Launch your team for the selected hackathon event and start inviting teammates!
                </p>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4 border-t border-zinc-800/80 pt-4">
                <div>
                  <label className="input-label text-xs">Team Name *</label>
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Quantum Agents, CyberCraft, Neural Ninjas"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    required
                  />
                </div>

                <button type="submit" disabled={creating} className="btn-primary text-xs py-2.5 px-5 w-full sm:w-auto justify-center cursor-pointer">
                  {creating ? "Creating Team..." : <><HiOutlinePlus className="text-sm" /> Launch Team</>}
                </button>
              </form>
            </motion.div>
          )
        ) : (
          <div className="empty-state py-12">
            <HiOutlineUserGroup className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-xs">Please select a hackathon from the dropdown above to view or create your team.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParticipantTeamPage;
