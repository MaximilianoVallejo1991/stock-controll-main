import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";


const PrivateRoute = ({ children }) => {
  // return isAuthenticated() ? children : <Navigate to="/" replace />;

  return isAuthenticated() ? children : <Navigate to="/" replace />;  // era "/"
};

export default PrivateRoute;
