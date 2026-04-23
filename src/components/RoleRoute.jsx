import { Navigate } from "react-router-dom";
import useUserStore from "../store/userStore";

const RoleRoute = ({ children, allowedRoles }) => {
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const effectiveRole = (simulatedRole || user?.role)?.toUpperCase();

  if (!user || !effectiveRole || !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/mainpanel" replace />;
  }
  return children;
};

export default RoleRoute;
