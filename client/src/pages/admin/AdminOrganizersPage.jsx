import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { userAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import {
  HiOutlineSearch, HiOutlineBan, HiOutlineTrash, HiOutlinePencil,
  HiOutlineX, HiOutlineCheck, HiOutlineSparkles,
} from "react-icons/hi";

const AdminOrganizersPage = () => {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);

  // Edit modal
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState("organizer");
  const [editName, setEditName] = useState("");
  const [saving, setSaving]     = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { search, role: "organizer", page, limit: 20 };
      if (statusFilter === "approved") params.isApproved = true;
      if (statusFilter === "pending") params.isApproved = false;

      const res = await userAPI.getAll(params);
      const d = res.data.data;
      setUsers(d.users || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
    } catch (e) {
      toast.error("Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter, page]);

  const handleApprove = async (id, currentApproved) => {
    try {
      await userAPI.toggleApprove(id);
      toast.success(!currentApproved ? "Organizer approved successfully!" : "Organizer approval revoked");
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update approval status");
    }
  };

  const handleBlock = async (id, isBlocked) => {
    try {
      await userAPI.toggleBlock(id);
      toast.success(isBlocked ? "Organizer unblocked" : "Organizer blocked");
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete organizer "${name}"? This action cannot be undone.`)) return;
    try {
      await userAPI.delete(id);
      toast.success("Organizer deleted");
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await userAPI.updateRole(editUser._id, editRole);
      toast.success("Organizer role updated successfully");
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <HiOutlineSparkles className="text-purple-400" /> Platform Organizers
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">Manage and approve hackathon organizers and event directors</p>
          </div>
          <span className="badge badge-primary text-[10px]">{total} Organizers</span>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search organizers by name or email…"
              className="input-field text-xs pl-9 py-2"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field text-xs py-2 w-full sm:w-44 font-semibold"
          >
            <option value="all">All Approval Status</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Organizer</th>
                  <th>Approval</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-zinc-500 py-10">No organizers found</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{u.name}</p>
                            <p className="text-[11px] text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.isApproved !== false ? (
                          <span className="badge badge-success text-[10px]">Approved</span>
                        ) : (
                          <span className="badge badge-warning text-[10px] animate-pulse">Pending Approval</span>
                        )}
                      </td>
                      <td>
                        {u.isBlocked ? (
                          <span className="badge badge-danger text-[10px]">Blocked</span>
                        ) : (
                          <span className="badge badge-success text-[10px]">Active</span>
                        )}
                      </td>
                      <td className="text-zinc-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.isApproved === false ? (
                            <>
                              <button
                                onClick={() => handleApprove(u._id, false)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                title="Approve Organizer Account"
                              >
                                <HiOutlineCheck className="text-sm" /> Approve
                              </button>
                              <button
                                onClick={() => handleBlock(u._id, false)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                title="Reject and Block Organizer"
                              >
                                <HiOutlineX className="text-sm" /> Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleApprove(u._id, true)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all"
                              title="Revoke Approval"
                            >
                              <HiOutlineX className="text-xs" /> Revoke
                            </button>
                          )}
                          <button
                            onClick={() => { setEditUser(u); setEditRole(u.role); setEditName(u.name); }}
                            className="btn-ghost text-xs p-1.5 text-zinc-400 hover:text-white"
                            title="Edit Role"
                          >
                            <HiOutlinePencil />
                          </button>
                          <button
                            onClick={() => handleBlock(u._id, u.isBlocked)}
                            className={`btn-ghost text-xs p-1.5 ${u.isBlocked ? "text-emerald-400" : "text-amber-400"}`}
                            title={u.isBlocked ? "Unblock" : "Block"}
                          >
                            <HiOutlineBan />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Role Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4 relative">
              <button onClick={() => setEditUser(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1">
                <HiOutlineX />
              </button>
              <h3 className="font-bold text-white text-sm">Edit User Role — {editName}</h3>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Select Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="input-field text-xs font-semibold"
                >
                  <option value="participant">Participant</option>
                  <option value="organizer">Organizer</option>
                  <option value="judge">Judge</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-zinc-800">
                <button onClick={() => setEditUser(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
                  {saving ? "Saving..." : "Save Role"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganizersPage;
