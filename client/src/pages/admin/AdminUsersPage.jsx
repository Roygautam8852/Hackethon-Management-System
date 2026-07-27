import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { userAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import {
  HiOutlineSearch, HiOutlineBan, HiOutlineTrash, HiOutlineUser,
  HiOutlinePencil, HiOutlineX, HiOutlineCheck,
} from "react-icons/hi";

const roleColors = {
  admin: "badge-danger",
  organizer: "badge-primary",
  participant: "badge-success",
  judge: "badge-warning",
};

const AdminUsersPage = () => {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);

  // Edit modal state
  const [editUser, setEditUser]       = useState(null); // user being edited
  const [editRole, setEditRole]       = useState("");
  const [editName, setEditName]       = useState("");
  const [saving, setSaving]           = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll({ search, role: roleFilter, page, limit: 20 });
      const d = res.data.data;
      setUsers(d.users);
      setTotal(d.total);
      setPages(d.pages);
    } catch (e) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, roleFilter, page]);

  const handleApprove = async (id, currentApproved) => {
    try {
      await userAPI.toggleApprove(id);
      toast.success(!currentApproved ? "User approved successfully!" : "User approval revoked");
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update approval status");
    }
  };

  const handleBlock = async (id, isBlocked) => {
    try {
      await userAPI.toggleBlock(id);
      toast.success(isBlocked ? "User unblocked" : "User blocked");
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await userAPI.delete(id);
      toast.success("User deleted");
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditName(u.name);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await userAPI.update(editUser._id, { name: editName, role: editRole });
      toast.success("User updated successfully");
      setEditUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Manage Users</h1>
            <p className="text-slate-500 text-sm">{total} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field w-36"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="organizer">Organizer</option>
            <option value="participant">Participant</option>
            <option value="judge">Judge</option>
          </select>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Approval</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j}><div className="skeleton h-4 rounded" /></td>
                        ))}
                      </tr>
                    ))
                  : users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center text-sm font-bold text-indigo-400 overflow-hidden">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-200 text-sm">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                        <td>
                          {u.role === "organizer" || u.role === "judge" ? (
                            u.isApproved !== false ? (
                              <span className="badge badge-success text-[10px]">Approved</span>
                            ) : (
                              <span className="badge badge-warning text-[10px] animate-pulse">Pending</span>
                            )
                          ) : (
                            <span className="text-zinc-600 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${u.isBlocked ? "badge-danger" : "badge-success"}`}>
                            {u.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            {(u.role === "organizer" || u.role === "judge") && (
                              u.isApproved === false ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(u._id, false)}
                                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1 cursor-pointer"
                                    title="Approve Account"
                                  >
                                    <HiOutlineCheck className="text-xs" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleBlock(u._id, false)}
                                    className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 flex items-center gap-1 cursor-pointer"
                                    title="Reject & Block Account"
                                  >
                                    <HiOutlineX className="text-xs" /> Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleApprove(u._id, true)}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                                  title="Revoke Approval"
                                >
                                  <HiOutlineX className="text-xs" /> Revoke
                                </button>
                              )
                            )}
                            <button
                              onClick={() => openEdit(u)}
                              className="btn-ghost btn-sm text-indigo-400"
                              title="Edit Role / Name"
                            >
                              <HiOutlinePencil />
                            </button>
                            <button
                              onClick={() => handleBlock(u._id, u.isBlocked)}
                              className={`btn-ghost btn-sm ${u.isBlocked ? "text-emerald-400" : "text-amber-400"}`}
                              title={u.isBlocked ? "Unblock" : "Block"}
                            >
                              <HiOutlineBan />
                            </button>
                            {u.role !== "admin" && (
                              <button
                                onClick={() => handleDelete(u._id)}
                                className="btn-ghost btn-sm text-red-400"
                                title="Delete"
                              >
                                <HiOutlineTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {!loading && users.length === 0 && (
            <div className="empty-state py-10">
              <HiOutlineUser className="text-4xl" />
              <p>No users found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Prev</button>
            <span className="flex items-center text-sm text-slate-400">Page {page} of {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary btn-sm">Next</button>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-zinc-500 hover:text-zinc-300 p-1"><HiOutlineX /></button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 overflow-hidden">
                {editUser.avatar ? <img src={editUser.avatar} alt="" className="w-full h-full object-cover" /> : editUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{editUser.name}</p>
                <p className="text-xs text-zinc-400">{editUser.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="input-label text-xs mb-1">Display Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-field text-sm"
                  placeholder="User name"
                />
              </div>
              <div>
                <label className="input-label text-xs mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="organizer">Organizer</option>
                  <option value="participant">Participant</option>
                  <option value="judge">Judge</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">⚠ Changing role takes effect immediately on next login.</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setEditUser(null)}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <HiOutlineCheck />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsersPage;
