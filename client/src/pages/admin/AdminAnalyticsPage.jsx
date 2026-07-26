import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { userAPI } from "../../services/apiServices";
import {
  HiOutlineUsers, HiOutlineCollection, HiOutlineUserGroup,
  HiOutlineDocumentText, HiOutlineClipboardList, HiOutlineTrendingUp,
} from "react-icons/hi";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const ROLE_COLORS   = { admin: "#6366f1", organizer: "#8b5cf6", participant: "#10b981", judge: "#f59e0b" };
const STATUS_COLORS = { draft: "#64748b", upcoming: "#6366f1", registration_open: "#10b981", registration_closed: "#f59e0b", ongoing: "#8b5cf6", completed: "#06b6d4", cancelled: "#ef4444" };
const REG_COLORS    = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444", cancelled: "#64748b" };

const FALLBACK_COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-[#111113] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
    <div>
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-lg font-black text-white mt-0.5">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-zinc-500 font-medium">{sub}</p>}
    </div>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${color}`}>
      <Icon />
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b] border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-2xl">
        {label && <p className="text-zinc-400 capitalize mb-1 font-bold">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || p.color }}>
            {p.name}: <span className="font-extrabold text-white">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    userAPI.getAnalytics()
      .then(r => setAnalytics(r.data.data))
      .catch(e => setError(e.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="empty-state py-20">
          <p className="text-red-400 text-sm font-semibold">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  // Build chart data
  const roleData    = analytics?.usersByRole?.map(r => ({ name: r._id, value: r.count, fill: ROLE_COLORS[r._id] || "#6366f1" })) || [];
  const statusData  = analytics?.hackathonsByStatus?.map(s => ({ name: s._id?.replace(/_/g, " "), value: s.count, fill: STATUS_COLORS[s._id] || "#6366f1" })) || [];
  const regData     = analytics?.registrationsByStatus?.map(r => ({ name: r._id, value: r.count, fill: REG_COLORS[r._id] || "#6366f1" })) || [];

  // Bar chart: role distribution
  const roleBarData = roleData.map(r => ({ role: r.name, count: r.value }));

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">Platform Analytics</h1>
            <p className="text-zinc-400 text-xs mt-0.5">Real-time overview of all platform activity and statistics</p>
          </div>
          <span className="badge badge-danger text-[10px]">Administrator</span>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard label="Total Users"         value={analytics?.totalUsers}         icon={HiOutlineUsers}       color="bg-indigo-500/15 text-indigo-400" />
          <StatCard label="Hackathons"           value={analytics?.totalHackathons}    icon={HiOutlineCollection}  color="bg-violet-500/15 text-violet-400" />
          <StatCard label="Teams"                value={analytics?.totalTeams}         icon={HiOutlineUserGroup}   color="bg-emerald-500/15 text-emerald-400" />
          <StatCard label="Submissions"          value={analytics?.totalSubmissions}   icon={HiOutlineDocumentText} color="bg-amber-500/15 text-amber-400" />
          <StatCard label="Total Registrations"  value={analytics?.totalRegistrations} icon={HiOutlineClipboardList} color="bg-cyan-500/15 text-cyan-400" />
          <StatCard
            label="Approval Rate"
            value={(() => {
              const approved = analytics?.registrationsByStatus?.find(r => r._id === "approved")?.count || 0;
              const total    = analytics?.totalRegistrations || 0;
              return total > 0 ? `${Math.round((approved / total) * 100)}%` : "—";
            })()}
            icon={HiOutlineTrendingUp}
            color="bg-rose-500/15 text-rose-400"
            sub="registrations approved"
          />
        </div>

        {/* Charts Row 1: Pie Charts with Sleek Radius & Clean Legends */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Users by Role */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-zinc-800/80 pb-2">Users by Role</h3>
            {roleData.length === 0 ? (
              <div className="empty-state py-8"><p className="text-zinc-500 text-xs">No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="42%"
                    outerRadius={55}
                    innerRadius={30}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {roleData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#a1a1aa", paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hackathons by Status */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-zinc-800/80 pb-2">Hackathons by Status</h3>
            {statusData.length === 0 ? (
              <div className="empty-state py-8"><p className="text-zinc-500 text-xs">No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="42%"
                    outerRadius={55}
                    innerRadius={30}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#a1a1aa", paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts Row 2: Bar Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* User Role Bar Chart */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-zinc-800/80 pb-2">User Distribution by Role</h3>
            {roleBarData.length === 0 ? (
              <div className="empty-state py-8"><p className="text-zinc-500 text-xs">No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={roleBarData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="role" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.04)", radius: 4 }} />
                  <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
                    {roleBarData.map((entry, i) => (
                      <Cell key={i} fill={ROLE_COLORS[entry.role] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Registrations by Status (Pie / Donut Chart) */}
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-zinc-800/80 pb-2">Registrations by Status</h3>
            {regData.length === 0 ? (
              <div className="empty-state py-8"><p className="text-zinc-500 text-xs">No registrations yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={regData}
                    cx="50%"
                    cy="42%"
                    outerRadius={55}
                    innerRadius={30}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {regData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#a1a1aa", paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-zinc-800/80 pb-2">Recently Registered Users</h3>
          <div className="overflow-x-auto">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.recentUsers?.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-zinc-500 py-6">No users yet</td></tr>
                )}
                {analytics?.recentUsers?.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 overflow-hidden border border-zinc-800">
                          {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-[11px] text-zinc-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === "admin" ? "badge-danger" :
                        u.role === "organizer" ? "badge-primary" :
                        u.role === "judge" ? "badge-warning" : "badge-success"
                      } text-[10px]`}>{u.role}</span>
                    </td>
                    <td className="text-zinc-400 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalyticsPage;
