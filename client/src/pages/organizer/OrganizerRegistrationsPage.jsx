import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI, registrationAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineFilter,
} from "react-icons/hi";

const badgeMap = {
  pending:  "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
};

const OrganizerRegistrationsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    hackathonAPI.getMy()
      .then(r => {
        const list = r.data.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) setSelectedHackathon(list[0]._id);
      })
      .catch(console.error);
  }, []);

  const fetchRegs = useCallback(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    registrationAPI.getByHackathon(selectedHackathon, statusFilter ? { status: statusFilter } : {})
      .then(r => setRegistrations(r.data.data.registrations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedHackathon, statusFilter]);

  useEffect(() => { fetchRegs(); }, [fetchRegs]);

  const handleApprove = async (id) => {
    try {
      await registrationAPI.approve(id);
      toast.success("Registration approved ✓");
      fetchRegs();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await registrationAPI.reject(rejectModal.regId, rejectReason);
      toast.success("Registration rejected");
      setRejectModal(null);
      setRejectReason("");
      fetchRegs();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  const filtered = statusFilter
    ? registrations.filter(r => r.status === statusFilter)
    : registrations;

  const pendingCount = registrations.filter(r => r.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <HiOutlineUserGroup className="text-zinc-400" /> Team Registrations
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Review and approve teams for your hackathons
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-400 font-semibold">
                  · {pendingCount} pending
                </span>
              )}
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
            className="input-field sm:max-w-[160px] text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : !selectedHackathon ? (
          <div className="empty-state py-16 card">
            <HiOutlineUserGroup className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">Select a hackathon to view registrations</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineFilter className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">No registrations match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Responsive Cards (< md) */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {filtered.map((r) => (
                <div key={r._id} className="card p-4 space-y-3 border-zinc-800 bg-[#0f0f11]">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-base font-extrabold text-white">{r.team?.name || "Team"}</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Registered: {r.registeredAt ? format(new Date(r.registeredAt), "MMM d, yyyy") : "Recently"}
                      </p>
                    </div>
                    <span className={`badge ${badgeMap[r.status] || "badge-gray"} capitalize text-[10px] font-extrabold flex-shrink-0`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Team Leader:</span>
                      <span className="text-zinc-200 font-semibold">{r.team?.leader?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Leader Email:</span>
                      <span className="text-zinc-300 font-mono text-[11px] truncate max-w-[180px]">
                        {r.team?.leader?.email?.includes("@pending.local") ? "No email provided" : r.team?.leader?.email || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Total Members:</span>
                      <span className="text-zinc-200 font-semibold">{r.team?.members?.length || 0} Members</span>
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-800/80">
                      <button
                        onClick={() => handleApprove(r._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                      >
                        <HiOutlineCheckCircle className="text-base flex-shrink-0" />
                        <span>Approve Team</span>
                      </button>
                      <button
                        onClick={() => { setRejectModal({ regId: r._id }); setRejectReason(""); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-600/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                      >
                        <HiOutlineXCircle className="text-base flex-shrink-0" />
                        <span>Reject Team</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block card p-0 overflow-x-auto">
              <table className="data-table w-full">
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
                  {filtered.map((r) => (
                    <tr key={r._id}>
                      <td className="font-semibold text-white">{r.team?.name}</td>
                      <td>
                        <div>
                          <p className="text-zinc-300 text-sm font-semibold">{r.team?.leader?.name}</p>
                          <p className="text-zinc-500 text-xs">
                            {r.team?.leader?.email?.includes("@pending.local") ? "No email provided" : r.team?.leader?.email}
                          </p>
                        </div>
                      </td>
                      <td className="text-zinc-400 text-sm">{r.team?.members?.length || 0}</td>
                      <td className="text-zinc-500 text-xs">
                        {r.registeredAt ? format(new Date(r.registeredAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td>
                        <span className={`badge ${badgeMap[r.status] || "badge-gray"} capitalize text-[10px] font-bold`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(r._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              <HiOutlineCheckCircle className="text-sm" /> Approve
                            </button>
                            <button
                              onClick={() => { setRejectModal({ regId: r._id }); setRejectReason(""); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              <HiOutlineXCircle className="text-sm" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Reject Registration</h3>
            <p className="text-zinc-400 text-xs sm:text-sm">Optionally provide a reason for the team leader.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Team size does not meet requirements…"
              className="input-field resize-none text-xs sm:text-sm"
            />
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setRejectModal(null)} className="btn-secondary text-xs sm:text-sm px-4 py-2 cursor-pointer">Cancel</button>
              <button onClick={handleReject} className="btn-danger text-xs sm:text-sm px-4 py-2 cursor-pointer">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizerRegistrationsPage;
