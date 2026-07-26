import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import GlobalChatDrawer from "../chat/GlobalChatDrawer";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
  HiOutlineHome, HiOutlineChatAlt2, HiOutlineMenuAlt2,
  HiOutlineCollection, HiOutlineUser, HiOutlineSparkles,
} from "react-icons/hi";
import { RiRocketLine } from "react-icons/ri";

const roleDashboards = {
  admin: "/admin",
  organizer: "/organizer",
  participant: "/participant",
  judge: "/judge",
};

/**
 * Mobile Native App-Like Responsive Dashboard Layout
 * Supports Desktop Fixed Sidebar + Mobile Slide-Over Drawer + Mobile Bottom Navigation Bar
 */
const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const { isChatOpen, openChat, closeChat, unreadCount } = useChat();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userDashboard = roleDashboards[user?.role] || "/";

  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar Component (Desktop fixed & Mobile slide drawer) */}
      <Sidebar isMobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1 ml-0 lg:ml-64 min-h-screen overflow-x-hidden flex flex-col"
      >
        {/* Sticky Header Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
              title="Open Navigation Menu"
            >
              <HiOutlineMenuAlt2 className="text-lg" />
            </button>

            {/* Mobile Brand / Workspace Identifier */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:inline">
                Dashboard Workspace
              </span>
              <span className="text-xs font-extrabold text-white sm:hidden tracking-tight">
                Hack<span className="text-zinc-400">lytics</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 💬 GROUP CHAT BUTTON WITH UNREAD COUNTER BADGE */}
            <button
              onClick={openChat}
              className="relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 hover:bg-indigo-500/25 transition-all shadow-sm cursor-pointer"
            >
              <HiOutlineChatAlt2 className="text-base text-indigo-400" />
              <span className="hidden sm:inline">💬 Group Chat</span>
              <span className="sm:hidden font-semibold">Chat</span>

              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-lg shadow-red-500/40 animate-bounce border border-red-300 ml-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Home Link */}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
            >
              <HiOutlineHome className="text-sm text-zinc-400" />
              <span className="hidden sm:inline">← Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </div>

        {/* Mobile Bottom App Bar (One-Thumb Quick Access on Phones) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-t border-[#27272a] px-3 py-2 flex items-center justify-around shadow-2xl">
          <Link
            to={userDashboard}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              location.pathname === userDashboard
                ? "text-white bg-zinc-800/80 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HiOutlineHome className="text-lg" />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            to="/hackathons"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              location.pathname.startsWith("/hackathons")
                ? "text-white bg-zinc-800/80 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HiOutlineCollection className="text-lg" />
            <span className="text-[10px]">Hackathons</span>
          </Link>

          <button
            onClick={openChat}
            className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
          >
            <HiOutlineChatAlt2 className="text-lg" />
            <span className="text-[10px] font-bold">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              location.pathname === "/profile"
                ? "text-white bg-zinc-800/80 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HiOutlineUser className="text-lg" />
            <span className="text-[10px]">Profile</span>
          </Link>
        </div>

        {/* Global Chat Drawer Component */}
        <GlobalChatDrawer isOpen={isChatOpen} onClose={closeChat} />
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
