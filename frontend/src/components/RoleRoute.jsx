import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function RoleRoute({ allowedRoles, children }) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default RoleRoute;
