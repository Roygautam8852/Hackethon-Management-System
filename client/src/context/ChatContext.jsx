import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { messageAPI } from "../services/apiServices";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getStorageKey = useCallback(() => {
    return user ? `hacklytics_chat_last_seen_${user._id}` : "hacklytics_chat_last_seen";
  }, [user]);

  // Fetch messages and compute unread count
  const checkNewMessages = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const res = await messageAPI.get();
      const list = res.data.data.messages || [];
      setMessages(list);

      // Get last seen timestamp
      const lastSeenStr = localStorage.getItem(getStorageKey());
      const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;

      // Count unseen messages from other users
      const unseen = list.filter(m => {
        const isOthers = m.sender !== user._id;
        const isNewer = new Date(m.createdAt).getTime() > lastSeen;
        return isOthers && isNewer;
      });

      setUnreadCount(unseen.length);
    } catch (_) {}
  }, [isAuthenticated, user, getStorageKey]);

  // Background polling every 4 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    checkNewMessages();
    const timer = setInterval(() => {
      checkNewMessages();
    }, 4000);

    return () => clearInterval(timer);
  }, [isAuthenticated, user, checkNewMessages]);

  // Open Chat and mark all as seen
  const openChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
    localStorage.setItem(getStorageKey(), new Date().toISOString());
  };

  // Close Chat
  const closeChat = () => {
    setIsChatOpen(false);
    localStorage.setItem(getStorageKey(), new Date().toISOString());
    setUnreadCount(0);
  };

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        openChat,
        closeChat,
        messages,
        unreadCount,
        refreshMessages: checkNewMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
