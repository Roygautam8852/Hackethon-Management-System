import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import {
  HiOutlineMenuAlt3, HiOutlineX,
  HiOutlineUser, HiOutlineLogout, HiOutlineCog, HiOutlineChatAlt2,
  HiOutlineCollection, HiOutlineUserGroup,
} from "react-icons/hi";
import { RiRocketLine, RiTrophyLine } from "react-icons/ri";
import toast from "react-hot-toast";
import GlobalChatDrawer from "../chat/GlobalChatDrawer";

const navLinks = [
  { label: "Hackathons", href: "/hackathons", icon: HiOutlineCollection, iconColor: "text-indigo-400" },
  { label: "Leaderboard", href: "/leaderboard", icon: RiTrophyLine, iconColor: "text-amber-400" },
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isChatOpen, openChat, closeChat, unreadCount } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    const map = {
      admin: "/admin",
      organizer: "/organizer",
      participant: "/participant",
      judge: "/judge",
    };
    return map[user.role] || "/";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] shadow-2xl"
          : "bg-[#050505]/80 backdrop-blur-sm sm:bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-transform">
              <RiRocketLine className="text-black text-base font-bold" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Hack<span className="text-zinc-400">lytics</span>
            </span>
          </Link>

          {/* Right Desktop Nav & Auth Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              to="/hackathons"
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                location.pathname.startsWith("/hackathons")
                  ? "text-white bg-zinc-800 border-zinc-700 shadow-sm"
                  : "text-zinc-300 hover:text-white border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700"
              }`}
            >
              Hackathons
            </Link>

            <Link
              to="/leaderboard"
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                location.pathname.startsWith("/leaderboard")
                  ? "text-white bg-zinc-800 border-zinc-700 shadow-sm"
                  : "text-zinc-300 hover:text-white border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700"
              }`}
            >
              Leaderboard
            </Link>

            {/* 💬 GROUP CHAT BUTTON */}
            {isAuthenticated && (
              <button
                onClick={openChat}
                className="relative px-3.5 py-2 text-xs font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 hover:bg-indigo-500/25 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <HiOutlineChatAlt2 className="text-sm text-indigo-400" />
                <span>💬 Group Chat</span>

                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-lg shadow-red-500/40 animate-bounce border border-red-300 ml-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  title={user?.name}
                  className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 hover:border-white hover:scale-105 transition-all flex items-center justify-center overflow-hidden cursor-pointer shadow-md shadow-black/40"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white text-xs font-extrabold uppercase">
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-zinc-800">
                        <p className="text-xs text-zinc-500 font-medium">Signed in as</p>
                        <p className="text-sm text-zinc-200 font-semibold truncate">{user?.email}</p>
                        <span className="badge badge-primary mt-1 text-[9px] uppercase font-bold">{user?.role}</span>
                      </div>
                      <div className="py-1">
                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <HiOutlineCog className="text-zinc-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <HiOutlineUser className="text-zinc-400" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <HiOutlineLogout />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary btn-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={openChat}
                className="p-2 rounded-xl text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <HiOutlineChatAlt2 className="text-base" />
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            )}

            <button
              className="p-2.5 rounded-xl text-zinc-200 hover:text-white bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              title="Toggle Navigation Menu"
            >
              {mobileOpen ? <HiOutlineX size={20} /> : <HiOutlineMenuAlt3 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Animated Dropdown Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#09090b]/98 backdrop-blur-2xl border-b border-[#27272a] shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-5 space-y-4">
              {/* Primary Navigation Links with Icons */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest px-2 mb-1">Navigation</p>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all ${
                        isActive
                          ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
                          : "text-zinc-300 hover:text-white bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className={`text-lg ${link.iconColor}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Auth User Info & Quick Action Buttons */}
              <div className="pt-3 border-t border-[#27272a] space-y-2.5">
                {isAuthenticated ? (
                  <>
                    {/* User Identity Card */}
                    <div className="px-3.5 py-3 bg-gradient-to-r from-zinc-900 to-[#111113] rounded-xl border border-zinc-800 flex items-center justify-between gap-3 shadow-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-black text-xs">{user?.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                        </div>
                      </div>

                      <span className="badge badge-primary text-[9px] uppercase font-extrabold flex-shrink-0">
                        {user?.role}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <Link
                        to={getDashboardLink()}
                        className="btn-primary text-xs py-3 w-full flex items-center justify-center gap-2 font-extrabold shadow-lg shadow-white/10 rounded-xl"
                      >
                        <HiOutlineCog className="text-base text-black" />
                        <span>Go to Dashboard</span>
                      </Link>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/profile"
                          className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold rounded-xl"
                        >
                          <HiOutlineUser className="text-zinc-400 text-sm" />
                          <span>My Profile</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="btn-danger text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold rounded-xl cursor-pointer"
                        >
                          <HiOutlineLogout className="text-sm" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to="/login" className="btn-secondary text-xs py-3 text-center justify-center font-bold rounded-xl">
                      Sign In
                    </Link>
                    <Link to="/signup" className="btn-primary text-xs py-3 text-center justify-center font-bold rounded-xl">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Group Chat Drawer */}
      <GlobalChatDrawer isOpen={isChatOpen} onClose={closeChat} />
    </nav>
  );
};

export default Navbar;
