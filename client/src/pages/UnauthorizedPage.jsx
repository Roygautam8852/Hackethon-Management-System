import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleDashboards = {
  admin: "/admin",
  organizer: "/organizer",
  participant: "/participant",
  judge: "/judge",
};

const UnauthorizedPage = () => {
  const { isAuthenticated, user } = useAuth();
  const targetPath = isAuthenticated && user?.role ? roleDashboards[user.role] : "/login";

  // Instantly auto-redirect away from /unauthorized so user never sees Access Denied page
  return <Navigate to={targetPath} replace />;
};

export default UnauthorizedPage;
