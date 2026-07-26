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
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
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

        {/* Table */}
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
          <div className="card p-0 overflow-hidden">
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
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td className="font-semibold text-white">{r.team?.name}</td>
                    <td>
                      <div>
                        <p className="text-zinc-300 text-sm">{r.team?.leader?.name}</p>
                        <p className="text-zinc-500 text-xs">{r.team?.leader?.email}</p>
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
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Reject Registration</h3>
            <p className="text-zinc-400 text-sm">Optionally provide a reason for the team leader.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Team size does not meet requirements…"
              className="input-field resize-none text-sm"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={handleReject} className="btn-danger text-sm px-4 py-2">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizerRegistrationsPage;
