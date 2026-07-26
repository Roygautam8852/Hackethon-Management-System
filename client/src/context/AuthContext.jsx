import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/apiServices";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []); // eslint-disable-line

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    const { user: userData, token: newToken } = res.data.data;
    setUser(userData);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await authAPI.signup(data);
    const { user: userData, token: newToken } = res.data.data;
    setUser(userData);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (_) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const isAdmin = user?.role === "admin";
  const isOrganizer = user?.role === "organizer";
  const isParticipant = user?.role === "participant";
  const isJudge = user?.role === "judge";
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isOrganizer,
        isParticipant,
        isJudge,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
