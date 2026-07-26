import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import GlobalChatDrawer from "../chat/GlobalChatDrawer";
import { useChat } from "../../context/ChatContext";
import { motion } from "framer-motion";
import { HiOutlineHome, HiOutlineChatAlt2 } from "react-icons/hi";

/**
 * Dashboard layout — fixed sidebar + sticky top bar with Group Chat (with Unread Badge) & Back to Home buttons + main content
 */
const DashboardLayout = ({ children }) => {
  const { isChatOpen, openChat, closeChat, unreadCount } = useChat();

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 ml-64 min-h-screen overflow-x-hidden"
      >
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dashboard Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {/* 💬 TOP GLOBAL GROUP CHAT BUTTON WITH UNREAD COUNTER BADGE */}
            <button
              onClick={openChat}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 hover:bg-indigo-500/25 transition-all shadow-sm group cursor-pointer"
            >
              <HiOutlineChatAlt2 className="text-sm text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>💬 Group Chat</span>

              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-lg shadow-red-500/40 animate-bounce border border-red-300 ml-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Top Back to Home Button */}
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
            >
              <HiOutlineHome className="text-sm text-zinc-400" />
              <span>← Back to Home</span>
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>

        {/* Global Chat Drawer Component */}
        <GlobalChatDrawer isOpen={isChatOpen} onClose={closeChat} />
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
