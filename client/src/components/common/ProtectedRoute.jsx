import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";

const roleDashboards = {
  admin: "/admin",
  organizer: "/organizer",
  participant: "/participant",
  judge: "/judge",
};

/**
 * Protects a route — redirects to /login if not authenticated.
 * If user role is not allowed for this route, automatically redirects
 * to their own role dashboard instead of showing an Access Denied error.
 * @param {string[]} roles - allowed roles (empty = any authenticated user)
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const notifiedRef = useRef(false);

  const userRole = user?.role;
  const isAllowed = roles.length === 0 || roles.includes(userRole);
  const userDashboard = roleDashboards[userRole] || "/";

  useEffect(() => {
    if (isAuthenticated && !isAllowed && !notifiedRef.current) {
      toast.error(`Access restricted. Redirected to your ${userRole} dashboard.`);
      notifiedRef.current = true;
    }
  }, [isAuthenticated, isAllowed, userRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAllowed) {
    return <Navigate to={userDashboard} replace />;
  }

  // Redirect unapproved organizers/judges to their root dashboard if attempting to visit subpages
  if (
    (userRole === "organizer" || userRole === "judge") &&
    user?.isApproved === false &&
    location.pathname !== userDashboard &&
    location.pathname !== "/profile"
  ) {
    return <Navigate to={userDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;
