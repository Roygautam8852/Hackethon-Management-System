import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import GlobalChatDrawer from "../chat/GlobalChatDrawer";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
  HiOutlineHome, HiOutlineChatAlt2, HiOutlineMenuAlt2,
  HiOutlineCollection, HiOutlineUser,
} from "react-icons/hi";

const roleDashboards = {
  admin: "/admin",
  organizer: "/organizer",
  participant: "/participant",
  judge: "/judge",
};

/**
 * Universal Responsive SaaS Dashboard Layout
 * Pixel-Perfect for Desktop / Laptop Screens + Mobile Native App Experience
 */
const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const { isChatOpen, openChat, closeChat, unreadCount } = useChat();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userDashboard = roleDashboards[user?.role] || "/";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex relative overflow-x-hidden">
      {/* Sidebar Component (Desktop Fixed 256px & Mobile Slide Drawer) */}
      <Sidebar isMobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* Main Workspace Canvas */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1 lg:pl-64 min-h-screen flex flex-col w-full min-w-0"
      >
        {/* Desktop & Mobile Sticky Header Bar */}
        <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-xl border-b border-[#27272a] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg shadow-black/20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger Toggle (Visible only on screens < lg) */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
              title="Open Navigation Menu"
            >
              <HiOutlineMenuAlt2 className="text-lg" />
            </button>

            {/* Status & Panel Breadcrumb Indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Workspace Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 💬 GROUP CHAT BUTTON (Desktop / Laptop Only; Mobile uses Lower Bottom Navigation Bar) */}
            {/* 💬 CHAT LINK (Desktop / Laptop Only) */}
            <Link
              to="/chat"
              className="hidden lg:flex relative items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 hover:bg-indigo-500/25 transition-all shadow-sm"
            >
              <HiOutlineChatAlt2 className="text-base text-indigo-400" />
              <span>💬 Messages & Chat</span>
            </Link>

            {/* Back to Home Button */}
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
            >
              <HiOutlineHome className="text-sm text-zinc-400" />
              <span className="hidden sm:inline">← Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </header>

        {/* Pending Approval Warning Banner for Organizers and Judges */}
        {(user?.role === "organizer" || user?.role === "judge") && user?.isApproved === false && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 sm:px-8 py-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2.5 max-w-5xl">
              <span className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 font-bold text-base flex-shrink-0">⚠️</span>
              <div>
                <span className="font-bold text-amber-300">Account Pending Admin Approval: </span>
                <span>Your request to register as an <strong className="capitalize">{user?.role}</strong> is currently pending administrator approval. Dashboard management features remain locked until an admin approves your account.</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Content Body */}
        <div className="flex-1 p-4 sm:p-8 lg:p-10 w-full max-w-[1600px] mx-auto pb-24 lg:pb-12">
          {children}
        </div>

        {/* Mobile Bottom App Bar (One-Thumb Quick Access on Phones < lg) */}
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

          <Link
            to="/chat"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              location.pathname === "/chat"
                ? "text-indigo-300 bg-indigo-500/20 font-bold"
                : "text-indigo-400 hover:text-indigo-300"
            }`}
          >
            <HiOutlineChatAlt2 className="text-lg" />
            <span className="text-[10px] font-bold">Chat</span>
          </Link>

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
