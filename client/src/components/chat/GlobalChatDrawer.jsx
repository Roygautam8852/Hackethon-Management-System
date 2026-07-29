import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { messageAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlinePaperAirplane,
  HiOutlineChatAlt2,
  HiOutlineRefresh,
  HiArrowLeft,
  HiOutlineX,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const roleBadgeColor = {
  admin: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  organizer: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  judge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  participant: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  group: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
};

const GlobalChatDrawer = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch categorized contacts list
  const fetchContacts = async () => {
    if (!isAuthenticated) return;
    setLoadingContacts(true);
    try {
      const res = await messageAPI.getContacts();
      const list = res.data.data.contacts || [];
      setContacts(list);

      // Default select first contact if none selected and on wider screen
      if (!activeContact && list.length > 0 && window.innerWidth >= 768) {
        setActiveContact(list[0]);
      }
    } catch (e) {
      console.error("Failed to load contacts", e);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch active conversation messages
  const fetchMessages = async (contact, silent = false) => {
    if (!contact || !isAuthenticated) return;
    if (!silent) setLoadingMessages(true);
    try {
      if (contact.type === "direct") {
        const res = await messageAPI.getDirect(contact._id);
        setMessages(res.data.data.messages || []);
      } else {
        const res = await messageAPI.get(contact.hackathonId);
        setMessages(res.data.data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    fetchContacts();

    const timer = setInterval(() => {
      fetchContacts();
    }, 5000);

    return () => clearInterval(timer);
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (activeContact && isOpen && isAuthenticated) {
      fetchMessages(activeContact, false);
      const timer = setInterval(() => fetchMessages(activeContact, true), 3000);
      return () => clearInterval(timer);
    }
  }, [activeContact, isOpen, isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputContent.trim() || !activeContact || sending) return;

    const text = inputContent.trim();
    setInputContent("");
    setSending(true);

    try {
      if (activeContact.type === "direct") {
        const res = await messageAPI.sendDirect({ recipientId: activeContact._id, content: text });
        setMessages((prev) => [...prev, res.data.data.message]);
      } else {
        const res = await messageAPI.send({ content: text, hackathonId: activeContact.hackathonId });
        setMessages((prev) => [...prev, res.data.data.message]);
      }

      setContacts((prev) => {
        const updated = prev.map((c) =>
          c._id === activeContact._id
            ? { ...c, lastMessage: text, lastMessageTime: new Date().toISOString() }
            : c
        );
        return updated.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!c) return false;
    const nameStr = (c.name || "").toLowerCase();
    const subtextStr = (c.subtext || "").toLowerCase();
    const lastMsgStr = (c.lastMessage || "").toLowerCase();
    const emailStr = (c.email || "").toLowerCase();
    const searchStr = (search || "").toLowerCase();

    const matchesSearch =
      nameStr.includes(searchStr) ||
      subtextStr.includes(searchStr) ||
      lastMsgStr.includes(searchStr) ||
      emailStr.includes(searchStr);

    const matchesCategory =
      categoryFilter === "All" ||
      c.category === categoryFilter ||
      (categoryFilter === "Direct" && c.type === "direct");

    return matchesSearch && matchesCategory;
  });

  const categoryMap = {
    participant: ["All", "Organizers"],
    organizer: ["All", "Judges", "Participants & Teams", "Admins"],
    judge: ["All", "Organizers", "Admins"],
    admin: ["All", "Organizers", "Judges"],
  };

  const categories = categoryMap[user?.role] || ["All", "Organizers"];

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    if (contact.unreadCount > 0) {
      messageAPI.markRead(contact._id).catch(console.error);
      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex justify-end bg-black/75 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="w-full sm:w-[520px] md:w-[680px] lg:w-[760px] max-w-full bg-[#09090b] border-l border-zinc-800/80 flex flex-col h-full shadow-2xl relative z-[10000] overflow-hidden"
        >
          {/* Main Top Header */}
          <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-[#0c0c0e]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-lg shadow-sm">
                <HiOutlineChatAlt2 />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight flex items-center gap-2">
                  Hacklytics Chat 💬
                </h3>
                <p className="text-[11px] text-zinc-400">Direct 1-on-1 & Group Discussion</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close chat"
            >
              <HiOutlineX className="text-xl" />
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl text-indigo-400">
                💬
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Login Required</h3>
                <p className="text-zinc-400 text-xs mt-1 max-w-xs">
                  Please log in to your Hacklytics account to access direct messaging with organizers, judges, and participants.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden relative">
              {/* LEFT SIDEBAR: CONTACTS LIST */}
              <div
                className={`w-full md:w-72 lg:w-80 border-r border-zinc-800/80 flex-col bg-[#0c0c0e] flex-shrink-0 ${
                  activeContact ? "hidden md:flex" : "flex"
                }`}
              >
                {/* User Info Sub-header */}
                <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between bg-[#111113]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-white text-xs leading-tight truncate">{user?.name}</h4>
                      <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider">{user?.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={fetchContacts}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Refresh Contacts"
                  >
                    <HiOutlineRefresh className="text-xs" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="p-3 border-b border-zinc-800/80">
                  <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search chats, organizers, judges…"
                      className="input-field text-xs pl-8 py-1.5 bg-[#141417] text-white rounded-lg w-full outline-none border border-zinc-800 focus:border-indigo-500"
                    />
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto mt-2 no-scrollbar pb-0.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                          categoryFilter === cat
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contacts Feed */}
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
                  {loadingContacts ? (
                    <div className="p-6 text-center">
                      <div className="spinner mx-auto" />
                      <p className="text-zinc-500 text-xs mt-2">Loading messages…</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      <HiOutlineChatAlt2 className="text-3xl mx-auto text-zinc-600 mb-1" />
                      No contacts found in this category
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isActive = activeContact?._id === contact._id;
                      const badgeStyle = roleBadgeColor[contact.role] || roleBadgeColor.participant;

                      return (
                        <button
                          key={contact._id}
                          onClick={() => handleSelectContact(contact)}
                          className={`w-full text-left p-3 flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isActive ? "bg-zinc-800/90 border-l-4 border-indigo-500" : "hover:bg-zinc-900/60"
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden">
                              {contact.avatar ? (
                                <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                contact.name?.[0]?.toUpperCase()
                              )}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c0c0e]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">{contact.name}</h4>
                                {contact.unreadCount > 0 && (
                                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-red-500 shadow-sm animate-bounce flex-shrink-0">
                                    {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {contact.lastMessageTime && (
                                  <span className="text-[9px] text-zinc-500 font-medium">
                                    {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[11px] truncate flex-1">
                                {contact.lastMessage ? (
                                  <span className={contact.unreadCount > 0 ? "font-bold text-zinc-200" : "text-zinc-400"}>
                                    {contact.lastMessage}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500">{contact.subtext}</span>
                                )}
                              </p>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded-full border font-extrabold uppercase flex-shrink-0 ${badgeStyle}`}>
                                {contact.role}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT MAIN PANEL: CHAT WINDOW */}
              <div
                className={`flex-1 flex-col bg-[#09090b] relative ${
                  activeContact ? "flex" : "hidden md:flex"
                }`}
              >
                {activeContact ? (
                  <>
                    {/* Active Chat Header */}
                    <div className="px-3.5 py-2.5 border-b border-zinc-800/80 bg-[#0c0c0e] flex items-center justify-between shadow-md z-10">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => setActiveContact(null)}
                          className="md:hidden w-7 h-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
                          title="Back to contacts"
                        >
                          <HiArrowLeft className="text-xs text-indigo-400" />
                        </button>

                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden">
                            {activeContact.avatar ? (
                              <img src={activeContact.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              activeContact.name?.[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0c0c0e]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-white text-xs truncate">{activeContact.name}</h3>
                            <span
                              className={`text-[8px] px-1.5 py-0.2 rounded-full border font-extrabold uppercase ${
                                roleBadgeColor[activeContact.role] || roleBadgeColor.participant
                              }`}
                            >
                              {activeContact.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-medium">{activeContact.subtext}</p>
                        </div>
                      </div>
                    </div>

                    {/* Message Thread Feed */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#09090b]">
                      {loadingMessages && messages.length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="spinner mx-auto" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-xs space-y-2 max-w-xs mx-auto">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl mx-auto">
                            <HiOutlineChatAlt2 />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">No messages yet</p>
                            <p className="text-zinc-400 text-[11px] mt-0.5">
                              Send a message to start the conversation with{" "}
                              <span className="text-indigo-400 font-semibold">{activeContact.name}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                          const senderRole = msg.senderRole || "participant";
                          const roleBadge = roleBadgeColor[senderRole] || roleBadgeColor.participant;

                          return (
                            <div key={msg._id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                              <div
                                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs shadow-md space-y-1 ${
                                  isMe
                                    ? "bg-indigo-600 text-white rounded-tr-xs"
                                    : "bg-[#18181b] border border-zinc-800/80 text-zinc-100 rounded-tl-xs"
                                }`}
                              >
                                {!isMe && (
                                  <div className="flex items-center justify-between gap-2 mb-1 border-b border-zinc-700/40 pb-0.5">
                                    <span className="font-bold text-indigo-300 text-[10px]">{msg.senderName}</span>
                                    <span className={`text-[8px] px-1 py-0.2 rounded border font-extrabold uppercase ${roleBadge}`}>
                                      {senderRole}
                                    </span>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.content}</p>
                                <div className={`text-[8px] text-right font-medium mt-0.5 ${isMe ? "text-indigo-200" : "text-zinc-500"}`}>
                                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input Footer */}
                    <form onSubmit={handleSendMessage} className="p-2.5 border-t border-zinc-800/80 bg-[#0c0c0e] flex items-center gap-2">
                      <input
                        type="text"
                        value={inputContent}
                        onChange={(e) => setInputContent(e.target.value)}
                        placeholder={`Type a message to ${activeContact.name}…`}
                        className="bg-[#161619] border border-zinc-800 text-xs text-white placeholder-zinc-500 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 flex-1 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!inputContent.trim() || sending}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-xs cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        <HiOutlinePaperAirplane className="rotate-90 text-xs" />
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl text-indigo-400">
                      💬
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">Hacklytics Direct Messaging</h3>
                      <p className="text-zinc-400 text-xs mt-1 max-w-xs">
                        Select a contact, organizer, judge, or admin from the list to start messaging.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default GlobalChatDrawer;
