import { useState, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/apiServices";
import toast from "react-hot-toast";
import {
  HiOutlineUser, HiOutlinePencil, HiOutlineSave, HiOutlineLockClosed,
  HiOutlineGlobeAlt, HiOutlineCode, HiOutlineMail,
  HiOutlineX, HiOutlineCamera,
} from "react-icons/hi";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Compress and resize image to a small JPEG thumbnail (~15-30KB)
// using the browser's Canvas API — no external service needed.
const compressImage = (file, maxDim = 200, quality = 0.78) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

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

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // --- Avatar selection ---
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // --- Upload avatar ---
  // Compresses image to ~15-30KB thumbnail on the client, then stores as
  // a small base64 string in MongoDB — works without any cloud storage.
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(avatarFile, 200, 0.78);
      const res = await authAPI.updateProfile({ avatarBase64: compressed, name: user?.name || "" });
      updateUser(res.data.data.user);
      toast.success("Profile photo updated!");
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarCancel = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // --- Profile form save ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.data.user);
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPass(false);
    }
  };

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-2">

        {/* 1. HERO PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-zinc-800 bg-[#111113] overflow-hidden shadow-2xl"
        >
          <div className="h-32 bg-gradient-to-r from-zinc-900 via-[#18181b] to-zinc-900 border-b border-zinc-800/80 relative overflow-hidden">
            <div className="blob w-64 h-64 bg-white/10 -top-20 -left-20" />
            <div className="blob w-64 h-64 bg-zinc-400/8 -bottom-20 -right-20" />
          </div>

          <div className="px-6 pb-6 pt-0 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">

              {/* Clickable Avatar */}
              <div className="relative group flex-shrink-0">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="avatar-upload"
                  onChange={handleAvatarSelect}
                />
                <label
                  htmlFor="avatar-upload"
                  className="relative w-24 h-24 rounded-full bg-zinc-950 border-4 border-[#111113] overflow-hidden flex items-center justify-center shadow-xl shadow-black/80 cursor-pointer block"
                  title="Click to change profile photo"
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-3xl font-black text-white uppercase">
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <HiOutlineCamera className="text-white text-xl" />
                    <span className="text-white text-[9px] font-semibold mt-0.5">CHANGE</span>
                  </div>
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full border-2 border-t-white border-zinc-700 animate-spin pointer-events-none" />
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
                <p className="text-zinc-600 text-[10px] mt-0.5 flex items-center gap-1">
                  <HiOutlineCamera className="text-zinc-700" />
                  Click avatar to change photo
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className={`btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 transition-all ${
                editing ? "border-red-500/40 text-red-400 hover:bg-red-500/10" : ""
              }`}
            >
              {editing ? (
                <><HiOutlineX className="text-sm" /> Cancel Edit</>
              ) : (
                <><HiOutlinePencil className="text-sm" /> Edit Profile</>
              )}
            </button>
          </div>
        </motion.div>

        {/* 1b. AVATAR PREVIEW CONFIRM BANNER */}
        <AnimatePresence>
          {avatarPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-zinc-700 bg-zinc-900/80 backdrop-blur px-5 py-4 flex flex-col sm:flex-row items-center gap-4"
            >
              <img
                src={avatarPreview}
                alt="New avatar preview"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white/20 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">New profile photo selected</p>
                <p className="text-zinc-400 text-xs truncate mt-0.5">{avatarFile?.name}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {uploadingAvatar ? (
                    <>
                      <span className="inline-block w-3 h-3 border border-t-white border-white/30 rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <><HiOutlineSave className="text-sm" /> Save Photo</>
                  )}
                </button>
                <button onClick={handleAvatarCancel} className="btn-secondary text-xs py-2 px-3 text-zinc-400">
                  <HiOutlineX />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. MAIN TWO-COLUMN GRID */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineUser className="text-zinc-400" /> About Developer
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {user?.bio || "No biography added yet. Click 'Edit Profile' to share your developer background."}
              </p>
            </div>

            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineCode className="text-zinc-400" /> Skills & Tech Stack
              </h3>
              {user?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span key={s} className="badge badge-gray text-xs py-1 px-3">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs">No skills listed yet.</p>
              )}
            </div>

            <div className="card space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineGlobeAlt className="text-zinc-400" /> Developer Profiles
              </h3>
              <div className="space-y-2.5 text-xs">
                {user?.github ? (
                  <a href={user.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors truncate">
                    <FaGithub className="text-sm flex-shrink-0" />
                    <span className="truncate">{user.github}</span>
                  </a>
                ) : (
                  <div className="text-zinc-500 flex items-center gap-2"><FaGithub /> GitHub not linked</div>
                )}
                {user?.linkedin ? (
                  <a href={user.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors truncate">
                    <FaLinkedin className="text-sm flex-shrink-0 text-blue-400" />
                    <span className="truncate">{user.linkedin}</span>
                  </a>
                ) : (
                  <div className="text-zinc-500 flex items-center gap-2"><FaLinkedin /> LinkedIn not linked</div>
                )}
                {user?.portfolio ? (
                  <a href={user.portfolio} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors truncate">
                    <HiOutlineGlobeAlt className="text-sm flex-shrink-0 text-emerald-400" />
                    <span className="truncate">{user.portfolio}</span>
                  </a>
                ) : (
                  <div className="text-zinc-500 flex items-center gap-2"><HiOutlineGlobeAlt /> Portfolio URL not linked</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="lg:col-span-7 space-y-6"
          >
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
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Gautam Kumar"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500" />
                </div>

                <div>
                  <label className="input-label">Developer Bio</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                    placeholder="Brief developer intro & project highlights..."
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 resize-none text-xs" />
                </div>

                <div>
                  <label className="input-label">Skills & Tech Stack (comma separated)</label>
                  <input name="skills" value={form.skills} onChange={handleChange}
                    placeholder="React, Node.js, MongoDB, Python, TailwindCSS"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">GitHub URL</label>
                    <input name="github" value={form.github} onChange={handleChange}
                      placeholder="https://github.com/..."
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs" />
                  </div>
                  <div>
                    <label className="input-label">LinkedIn URL</label>
                    <input name="linkedin" value={form.linkedin} onChange={handleChange}
                      placeholder="https://linkedin.com/in/..."
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="input-label">Portfolio Website URL</label>
                  <input name="portfolio" value={form.portfolio} onChange={handleChange}
                    placeholder="https://yoursite.com"
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary text-xs py-2.5 px-5">
                    {submitting ? "Saving..." : <><HiOutlineSave className="text-sm" /> Save Changes</>}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-xs py-2.5 px-4">
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <form onSubmit={handleChangePassword} className="card space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <HiOutlineLockClosed className="text-zinc-400" /> Account Security & Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-[11px]" htmlFor="current-pass">Current Password</label>
                  <input type="password" id="current-pass" value={passForm.currentPassword}
                    onChange={(e) => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    placeholder="........" />
                </div>
                <div>
                  <label className="input-label text-[11px]" htmlFor="new-pass">New Password</label>
                  <input type="password" id="new-pass" value={passForm.newPassword}
                    onChange={(e) => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 text-xs"
                    placeholder="Min 6 characters" />
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
