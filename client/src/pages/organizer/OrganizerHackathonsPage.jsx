import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format, isPast } from "date-fns";
import {
  HiOutlinePlus, HiOutlineExternalLink, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineTrash, HiOutlineExclamation, HiOutlineX,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const OrganizerHackathonsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Two-step Delete Modal state
  const [deleteStep, setDeleteStep] = useState(0); // 0 = closed, 1 = warning, 2 = type to confirm
  const [targetHackathon, setTargetHackathon] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Reopen Registration Modal
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenDates, setReopenDates] = useState({ startDate: "", endDate: "", registrationDeadline: "" });
  const [reopening, setReopening] = useState(false);

  const fetch = async () => {
    setLoading(true);
    hackathonAPI.getMy()
      .then(r => setHackathons(r.data.data.hackathons || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleToggleReg = async (id, open) => {
    try {
      await hackathonAPI.toggleRegistration(id);
      toast.success(open ? "Registration closed" : "Registration opened");
      fetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const openReopenModal = (h) => {
    setReopenTarget(h);
    setReopenDates({ startDate: "", endDate: "", registrationDeadline: "" });
  };

  const handleReopenReg = async (e) => {
    e.preventDefault();
    const { startDate, endDate, registrationDeadline } = reopenDates;
    if (!startDate || !endDate || !registrationDeadline) {
      toast.error("Please fill in all date fields");
      return;
    }
    if (new Date(registrationDeadline) >= new Date(startDate)) {
      toast.error("Registration deadline must be before the hackathon start date");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("Start date must be before the end date");
      return;
    }
    if (new Date(registrationDeadline) <= new Date()) {
      toast.error("New registration deadline must be in the future");
      return;
    }
    setReopening(true);
    try {
      await hackathonAPI.updateJSON(reopenTarget._id, {
        startDate,
        endDate,
        registrationDeadline,
        registrationOpen: true,
        status: "registration_open",
      });
      toast.success("Registration reopened with new dates! 🎉");
      setReopenTarget(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reopen registration");
    } finally {
      setReopening(false);
    }
  };

  // Start 2-step deletion
  const startDeleteFlow = (hackathon) => {
    setTargetHackathon(hackathon);
    setDeleteStep(1);
    setConfirmInput("");
  };

  const closeDeleteFlow = () => {
    setDeleteStep(0);
    setTargetHackathon(null);
    setConfirmInput("");
    setDeleting(false);
  };

  // Execute deletion after 2nd confirmation
  const executeDelete = async () => {
    if (!targetHackathon) return;
    if (confirmInput.trim() !== targetHackathon.title.trim()) {
      toast.error(`Please type exact hackathon name "${targetHackathon.title}" to confirm`);
      return;
    }

    setDeleting(true);
    try {
      await hackathonAPI.delete(targetHackathon._id);
      toast.success(`"${targetHackathon.title}" and all related data purged successfully!`);
      closeDeleteFlow();
      fetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete hackathon");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Hackathons</h1>
            <p className="text-slate-400 text-xs mt-0.5">{hackathons.length} hackathon{hackathons.length !== 1 ? "s" : ""}</p>
          </div>
          <Link to="/organizer/hackathons/create" className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5">
            <HiOutlinePlus /> New Hackathon
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="empty-state py-16 card">
            <p className="text-zinc-400 text-sm">No hackathons created yet</p>
            <Link to="/organizer/hackathons/create" className="btn-primary text-xs px-4 py-2 mt-2">Create First Hackathon</Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {hackathons.map(h => {
              const deadlinePassed = h.registrationDeadline ? isPast(new Date(h.registrationDeadline)) : false;
              return (
              <div key={h._id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4 border-zinc-800 bg-[#0d0d0f] hover:border-zinc-700 transition-all p-4">
                {/* Banner thumb & details */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-indigo-500/10 overflow-hidden flex-shrink-0 border border-zinc-800">
                    {h.bannerImage
                      ? <img src={h.bannerImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🏆</div>
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">{h.title}</h3>
                    {deadlinePassed && h.status === "registration_open" ? (
                      <span className="badge badge-danger text-[9px] font-extrabold uppercase px-2 py-0.5">Registration Closed</span>
                    ) : (
                      <span className={`badge ${
                        h.status === "registration_open" ? "badge-success" :
                        h.status === "completed" ? "badge-gray" : "badge-primary"
                      } text-[9px] font-extrabold uppercase px-2 py-0.5`}>
                        {h.status === "registration_open" ? "REG OPEN" : h.status?.replace(/_/g, " ")}
                      </span>
                    )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{h.theme} · {h.mode}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">
                      {h.startDate && `${format(new Date(h.startDate), "MMM d")} — ${format(new Date(h.endDate), "MMM d, yyyy")}`}
                    </p>
                  </div>
                </div>

                {/* Actions Toolbar (Symmetrical 2x2 Grid on Mobile, Row on Desktop) */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-2 border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0">
                  <Link
                    to={`/organizer/hackathons/${h._id}`}
                    className="btn-primary text-xs py-2.5 md:py-1.5 px-3 font-bold flex items-center justify-center gap-1 cursor-pointer order-1 md:order-2"
                  >
                    Manage →
                  </Link>

                  {deadlinePassed ? (
                    <button
                      onClick={() => openReopenModal(h)}
                      className="text-xs py-2.5 md:py-1.5 px-3 flex items-center justify-center gap-1.5 border rounded-xl font-bold transition-all cursor-pointer order-2 md:order-1 border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                      title="Reopen registration with new dates"
                    >
                      <HiOutlineCheckCircle className="text-sm" />
                      <span>Reopen Reg</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleReg(h._id, h.registrationOpen)}
                      className={`text-xs py-2.5 md:py-1.5 px-3 flex items-center justify-center gap-1.5 border rounded-xl font-bold transition-all cursor-pointer order-2 md:order-1 ${
                        h.registrationOpen
                          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25"
                          : "border-zinc-700 text-zinc-400 bg-zinc-900 hover:text-white"
                      }`}
                      title={h.registrationOpen ? "Close Registration" : "Open Registration"}
                    >
                      {h.registrationOpen ? <HiOutlineXCircle className="text-sm" /> : <HiOutlineCheckCircle className="text-sm" />}
                      <span>{h.registrationOpen ? "Reg Open" : "Reg Closed"}</span>
                    </button>
                  )}

                  <Link
                    to={`/hackathons/${h._id}`}
                    target="_blank"
                    className="btn-secondary text-xs py-2.5 md:py-1.5 px-3 font-semibold flex items-center justify-center gap-1.5 text-zinc-300 hover:text-white cursor-pointer order-3 md:order-3"
                    title="Preview Public Page"
                  >
                    <HiOutlineExternalLink className="text-sm" /> Preview
                  </Link>

                  <button
                    onClick={() => startDeleteFlow(h)}
                    className="btn-danger text-xs py-2.5 md:py-1.5 px-3 flex items-center justify-center gap-1.5 font-bold cursor-pointer order-4 md:order-4"
                    title="Delete Hackathon"
                  >
                    <HiOutlineTrash className="text-sm" /> Delete
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}

        {/* ── TWO-STEP DELETE CONFIRMATION MODAL ── */}
        {deleteStep > 0 && targetHackathon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#111113] border border-red-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 relative">
              
              <button onClick={closeDeleteFlow} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1">
                <HiOutlineX />
              </button>

              {/* STEP 1: WARNING CONFIRMATION */}
              {deleteStep === 1 && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-2xl mx-auto">
                    <HiOutlineExclamation />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-white">Delete Hackathon?</h3>
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Step 1 of 2: First Confirmation</p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-zinc-300 space-y-2">
                    <p className="font-semibold text-white">Are you sure you want to delete <span className="text-red-400">"{targetHackathon.title}"</span>?</p>
                    <p className="text-zinc-400">
                      This will permanently purge this hackathon and all associated registrations, team submissions, leaderboard scores, and judge evaluations.
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
                    <button onClick={closeDeleteFlow} className="btn-secondary text-xs px-4 py-2">
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
                      To confirm deletion, please type the exact title <strong className="text-amber-400">{targetHackathon.title}</strong> below:
                    </p>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={e => setConfirmInput(e.target.value)}
                      placeholder={`Type "${targetHackathon.title}"...`}
                      className="input-field text-sm border-red-500/40 focus:border-red-500 font-semibold"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
                    <button onClick={closeDeleteFlow} className="btn-secondary text-xs px-4 py-2">
                      Cancel
                    </button>
                    <button
                      onClick={executeDelete}
                      disabled={confirmInput.trim() !== targetHackathon.title.trim() || deleting}
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

        {/* ── REOPEN REGISTRATION MODAL ── */}
        <AnimatePresence>
          {reopenTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setReopenTarget(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#111113] border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 relative"
              >
                <button
                  onClick={() => setReopenTarget(null)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 transition-colors"
                >
                  <HiOutlineX />
                </button>

                <div className="space-y-1">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400 mb-3">
                    <HiOutlineCheckCircle />
                  </div>
                  <h3 className="text-base font-black text-white">Reopen Registration</h3>
                  <p className="text-xs text-zinc-400">
                    The previous deadline has passed. Set new dates to reopen registration for{" "}
                    <span className="text-zinc-200 font-semibold">{reopenTarget.title}</span>.
                  </p>
                </div>

                <form onSubmit={handleReopenReg} className="space-y-4 border-t border-zinc-800 pt-4">
                  <div>
                    <label className="input-label text-xs mb-1 block">
                      📅 New Registration Deadline <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={reopenDates.registrationDeadline}
                      onChange={e => setReopenDates(d => ({ ...d, registrationDeadline: e.target.value }))}
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-emerald-500/60 text-xs"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Must be in the future and before the hackathon start date.</p>
                  </div>

                  <div>
                    <label className="input-label text-xs mb-1 block">
                      🚀 New Hackathon Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={reopenDates.startDate}
                      onChange={e => setReopenDates(d => ({ ...d, startDate: e.target.value }))}
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-emerald-500/60 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label text-xs mb-1 block">
                      🏁 New Hackathon End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={reopenDates.endDate}
                      onChange={e => setReopenDates(d => ({ ...d, endDate: e.target.value }))}
                      className="input-field bg-[#0d0d0f] border-zinc-800 focus:border-emerald-500/60 text-xs"
                      required
                    />
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs text-zinc-300 space-y-1">
                    <p className="font-semibold text-emerald-300">What happens after submitting?</p>
                    <ul className="text-zinc-400 space-y-0.5 list-disc list-inside">
                      <li>Registration status → <strong className="text-emerald-300">Open</strong></li>
                      <li>Status badge → <strong className="text-emerald-300">Registration Open</strong></li>
                      <li>Participants can create teams again</li>
                      <li>All dates update immediately across all pages</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 justify-end pt-1 border-t border-zinc-800">
                    <button type="button" onClick={() => setReopenTarget(null)} className="btn-secondary text-xs px-4 py-2">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reopening || !reopenDates.startDate || !reopenDates.endDate || !reopenDates.registrationDeadline}
                      className="btn-primary text-xs px-4 py-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <HiOutlineCheckCircle />
                      {reopening ? "Reopening..." : "Reopen Registration"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
};

export default OrganizerHackathonsPage;
