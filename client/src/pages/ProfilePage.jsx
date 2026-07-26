import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/apiServices";
import toast from "react-hot-toast";
import {
  HiOutlineUser, HiOutlinePencil, HiOutlineSave, HiOutlineLockClosed,
  HiOutlineGlobeAlt, HiOutlineCode, HiOutlineMail, HiOutlineBadgeCheck,
  HiOutlineX,
} from "react-icons/hi";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    skills: user?.skills?.join(", ") || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    portfolio: user?.portfolio || "",
  });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
  const [changingPass, setChangingPass] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.data.user);
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword) {
      toast.error("Please fill in both current and new password");
      return;
    }
    setChangingPass(true);
    try {
      await authAPI.changePassword(passForm);
      toast.success("Password changed successfully!");
      setPassForm({ currentPassword: "", newPassword: "" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-2">
        {/* =========================================================
           1. HERO PROFILE CARD (Vercel Monochrome Style)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-zinc-800 bg-[#111113] overflow-hidden shadow-2xl"
        >
          {/* Header Banner Background */}
          <div className="h-32 bg-gradient-to-r from-zinc-900 via-[#18181b] to-zinc-900 border-b border-zinc-800/80 relative overflow-hidden">
            <div className="blob w-64 h-64 bg-white/10 -top-20 -left-20" />
            <div className="blob w-64 h-64 bg-zinc-400/8 -bottom-20 -right-20" />
          </div>

          <div className="px-6 pb-6 pt-0 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-12">
            {/* Avatar & User Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="w-24 h-24 rounded-full bg-zinc-950 border-4 border-[#111113] overflow-hidden flex items-center justify-center shadow-xl shadow-black/80 flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-3xl font-black text-white uppercase">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">{user?.name}</h1>
                  <span className="badge badge-primary font-bold uppercase text-[10px] tracking-wider">
                    {user?.role}
                  </span>
                  {user?.isBlocked && <span className="badge badge-danger">Blocked</span>}
                </div>
                <p className="text-zinc-400 text-xs mt-1 flex items-center gap-1.5">
                  <HiOutlineMail className="text-zinc-500" />
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Action Edit Toggle */}
            <button
              onClick={() => setEditing(!editing)}
              className={`btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 transition-all ${
                editing ? "border-red-500/40 text-red-400 hover:bg-red-500/10" : ""
              }`}
            >
              {editing ? (
                <>
                  <HiOutlineX className="text-sm" /> Cancel Edit
                </>
              ) : (
                <>
                  <HiOutlinePencil className="text-sm" /> Edit Profile
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* =========================================================
           2. MAIN TWO-COLUMN CONTENT GRID
           ========================================================= */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column — Overview & Tech Stack */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* About & Bio Card */}
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineUser className="text-zinc-400" /> About Developer
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {user?.bio || "No biography added yet. Click 'Edit Profile' to share your developer background."}
              </p>
            </div>

            {/* Technical Skills Card */}
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineCode className="text-zinc-400" /> Skills & Tech Stack
              </h3>
              {user?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span key={s} className="badge badge-gray text-xs py-1 px-3">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs">No skills listed yet.</p>
              )}
            </div>

            {/* Social & Portfolio Links Card */}
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineGlobeAlt className="text-zinc-400" /> Developer Profiles
              </h3>
              <div className="space-y-2.5 text-xs">
                {user?.github ? (
                  <a
                    href={user.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors truncate"
                  >
                    <FaGithub className="text-sm flex-shrink-0" />
                    <span className="truncate">{user.github}</span>
                  </a>
                ) : (
                  <div className="text-zinc-500 text-xs flex items-center gap-2">
                    <FaGithub /> GitHub not linked
                  </div>
                )}

                {user?.linkedin ? (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors truncate"
                  >
                    <FaLinkedin className="text-sm flex-shrink-0 text-blue-400" />
                    <span className="truncate">{user.linkedin}</span>
                  </a>
                ) : (
                  <div className="text-zinc-500 text-xs flex items-center gap-2">
                    <FaLinkedin /> LinkedIn not linked
                  </div>
                )}

                {user?.portfolio ? (
                  <a
                    href={user.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors truncate"
                  >
                    <HiOutlineGlobeAlt className="text-sm flex-shrink-0 text-emerald-400" />
                    <span className="truncate">{user.portfolio}</span>
                  </a>
                ) : (
                  <div className="text-zinc-500 text-xs flex items-center gap-2">
                    <HiOutlineGlobeAlt /> Portfolio URL not linked
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column — Edit Form & Change Password */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Edit Profile Form */}
            {editing ? (
              <form onSubmit={handleSave} className="card space-y-4 border-zinc-700">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiOutlinePencil className="text-white" /> Edit Developer Details
                  </h3>
                  <span className="badge badge-primary text-[10px]">LIVE EDIT</span>
                </div>

                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Gautam Kumar"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="input-label">Developer Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief developer intro & project highlights..."
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="input-label">Skills & Tech Stack (comma separated)</label>
                  <input
                    name="skills"
                    value={form.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, MongoDB, Python, TailwindCSS"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">GitHub URL</label>
                    <input
                      name="github"
                      value={form.github}
                      onChange={handleChange}
                      placeholder="https://github.com/..."
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="input-label">LinkedIn URL</label>
                    <input
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/..."
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Portfolio Website URL</label>
                  <input
                    name="portfolio"
                    value={form.portfolio}
                    onChange={handleChange}
                    placeholder="https://yoursite.com"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary text-xs py-2.5 px-5">
                    {submitting ? "Saving..." : <><HiOutlineSave className="text-sm" /> Save Changes</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary text-xs py-2.5 px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="card space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineLockClosed className="text-zinc-400" /> Account Security & Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-[11px]" htmlFor="current-pass">Current Password</label>
                  <input
                    type="password"
                    id="current-pass"
                    value={passForm.currentPassword}
                    onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="input-label text-[11px]" htmlFor="new-pass">New Password</label>
                  <input
                    type="password"
                    id="new-pass"
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm((f) => ({ ...f, newPassword: e.target.value }))}
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <button type="submit" disabled={changingPass} className="btn-secondary text-xs py-2.5 px-5">
                {changingPass ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
