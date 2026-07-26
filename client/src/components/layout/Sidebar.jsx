import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineCollection,
  HiOutlineClipboardList, HiOutlineChartBar, HiOutlineLogout,
  HiOutlineStar, HiOutlinePencilAlt, HiOutlineBriefcase,
  HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineUser,
  HiOutlineX,
} from "react-icons/hi";
import { RiRocketLine, RiTrophyLine } from "react-icons/ri";
import toast from "react-hot-toast";

const adminLinks = [
  { label: "Dashboard", href: "/admin", icon: HiOutlineHome, end: true },
  { label: "Organizers", href: "/admin/organizers", icon: HiOutlineStar },
  { label: "Judges", href: "/admin/judges", icon: HiOutlineBriefcase },
  { label: "Participants", href: "/admin/participants", icon: HiOutlineUsers },
  { label: "Teams", href: "/admin/teams", icon: HiOutlineUserGroup },
  { label: "Users (All)", href: "/admin/users", icon: HiOutlineUsers },
  { label: "Hackathons", href: "/admin/hackathons", icon: HiOutlineCollection },
  { label: "Analytics", href: "/admin/analytics", icon: HiOutlineChartBar },
  { label: "My Profile", href: "/profile", icon: HiOutlineUser },
];

const organizerLinks = [
  { label: "Dashboard", href: "/organizer", icon: HiOutlineHome, end: true },
  { label: "My Hackathons", href: "/organizer/hackathons", icon: HiOutlineCollection },
  { label: "Registrations", href: "/organizer/registrations", icon: HiOutlineClipboardList },
  { label: "Teams", href: "/organizer/teams", icon: HiOutlineUserGroup },
  { label: "Submissions", href: "/organizer/submissions", icon: HiOutlineDocumentText },
  { label: "Judges", href: "/organizer/judges", icon: HiOutlineStar },
  { label: "Announce Winners", href: "/organizer/announce-winners", icon: RiTrophyLine },
  { label: "My Profile", href: "/profile", icon: HiOutlineUser },
];

const participantLinks = [
  { label: "Dashboard", href: "/participant", icon: HiOutlineHome, end: true },
  { label: "Hackathons", href: "/hackathons", icon: HiOutlineCollection },
  { label: "My Team", href: "/participant/team", icon: HiOutlineUserGroup },
  { label: "My Submission", href: "/participant/submission", icon: HiOutlinePencilAlt },
  { label: "Results", href: "/participant/results", icon: RiTrophyLine },
  { label: "My Profile", href: "/profile", icon: HiOutlineUser },
];

const judgeLinks = [
  { label: "Dashboard", href: "/judge", icon: HiOutlineHome, end: true },
  { label: "Assigned Projects", href: "/judge/projects", icon: HiOutlineBriefcase },
  { label: "Assigned Hackathons", href: "/judge/hackathons", icon: HiOutlineCollection },
  { label: "Completed", href: "/judge/completed", icon: HiOutlineClipboardList },
  { label: "My Profile", href: "/profile", icon: HiOutlineUser },
];

const roleLinksMap = {
  admin: adminLinks,
  organizer: organizerLinks,
  participant: participantLinks,
  judge: judgeLinks,
};

const roleLabelMap = {
  admin: "Admin Panel",
  organizer: "Organizer",
  participant: "Participant",
  judge: "Judge Panel",
};

const SidebarContent = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = roleLinksMap[user?.role] || [];

  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* Header / Logo */}
      <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10">
            <RiRocketLine className="text-black text-base font-bold" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Hack<span className="text-zinc-400">lytics</span>
            </span>
            <p className="text-xs text-zinc-500 leading-none mt-0.5">{roleLabelMap[user?.role]}</p>
          </div>
        </NavLink>

        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <HiOutlineX className="text-xl" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Navigation</p>
          <ul className="space-y-0.5">
            {links.map((link) => (
              <li key={link.href}>
                <NavLink
                  to={link.href}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className={`text-base flex-shrink-0 ${isActive ? "text-white" : "text-zinc-500"}`} />
                      {link.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Explore Links */}
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Explore</p>
          <ul className="space-y-0.5">
            <li>
              <NavLink
                to="/hackathons"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <HiOutlineCollection className={isActive ? "text-white" : "text-zinc-500"} />
                    Browse Hackathons
                  </>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom Profile & Sign Out */}
      <div className="p-3 border-t border-[#27272a] bg-[#0c0c0e] flex items-center justify-between gap-2">
        <NavLink
          to="/profile"
          onClick={onClose}
          title="View & Edit Profile"
          className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-zinc-500">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xs">{user?.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate transition-colors">{user?.name}</p>
            <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-all flex-shrink-0 cursor-pointer"
        >
          <HiOutlineLogout className="text-lg" />
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-[#09090b] border-r border-[#27272a] flex-col fixed left-0 top-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />

            {/* Slide Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-[#09090b] border-r border-[#27272a] shadow-2xl overflow-hidden"
            >
              <SidebarContent onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
