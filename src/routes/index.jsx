import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import PasswordSetup from "../pages/PasswordSetup";
import PrivateRoute from "../components/PrivateRoute";
import MainLayout from "../layouts/MainLayout";
import { Home } from "../pages/Home";
import MainPanel from "../pages/MainPanel";
import { Estadistics } from "../pages/Estadistics";
import { Calculator } from "../pages/Calculator";
import { Chat } from "../pages/Chat";
import { Profile } from "../pages/Profile";
import { Clients } from "../pages/Clients";
import { Employees } from "../pages/Employees";
import { Suppliers } from "../pages/Suppliers";
import Stock from "../pages/Stock";
import { Categories } from "../pages/Categories";
import { Products } from "../pages/Products";
import { SalesDashboard } from "../pages/sales/SalesDashboard";
import { SalesHistory } from "../pages/Reportes/SalesHistory";
import Details from "../pages/Details";
import RoleRoute from "../components/RoleRoute";
import { Stores } from "../pages/Stores";
import { RegisterHistory } from "../pages/Reportes/RegisterHistory";
import { StockHistory } from "../pages/Reportes/StockHistory";
import { SellerPerformance } from "../pages/Reportes/SellerPerformance";
import { ROLES } from "../constants/roles";
import { DiscountsMainPage } from "../pages/Discounts/DiscountsMainPage";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/setup-password",
    element: <PasswordSetup />,
  },
  {
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "home", element: <MainPanel /> },
      { path: "mainpanel", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR]}><MainPanel /></RoleRoute> },
      { path: "estadistics", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR]}><Estadistics /></RoleRoute> },
      { path: "calculator", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR]}><Calculator /></RoleRoute> },
      { path: "chat", element: <Chat /> },
      { path: "profile", element: <Profile /> },
      { path: "stores", element: <RoleRoute allowedRoles={[ROLES.SISTEMA]}><Stores /></RoleRoute> },
      { path: "clients", element: <Clients /> },
      { path: "employees", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR]}><Employees /></RoleRoute> },
      { path: "stock", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR]}><Stock /></RoleRoute> },
      { path: "suppliers", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR]}><Suppliers /></RoleRoute> },
      { path: "categories", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO]}><Categories /></RoleRoute> },
      { path: "products", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR]}><Products /></RoleRoute> },
      { path: "sells", element: <SalesDashboard /> },
      { path: "sales-history", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR]}><SalesHistory /></RoleRoute> },
      { path: "registers-history", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR]}><RegisterHistory /></RoleRoute> },
      { path: "stock-history", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO]}><StockHistory /></RoleRoute> },
      { path: "seller-performance", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR]}><SellerPerformance /></RoleRoute> },
      { path: ":entity/details/:id", element: <Details /> },
      { path: "discounts", element: <RoleRoute allowedRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR]}><DiscountsMainPage /></RoleRoute> },

    ],
  },
]);
