import axios from "axios";
import GenericTableSection from "../components/GenericTableSection";
import { ROLES, EMPLOYEE_ROLES_DET } from "../constants/roles";

export const Employees = () => {

  const columns = [
    { header: "Nombre", accessorKey: "firstName" },
    { header: "Apellido", accessorKey: "lastName" },
    { header: "Email", accessorKey: "email" },
    { header: "Rol", accessorKey: "role" },
    { header: "Teléfono", accessorKey: "phoneNumber" },

  ];

  const fields = [
    { name: "firstName", label: "Nombre" },
    { name: "lastName", label: "Apellido" },
    { name: "email", label: "Email", type: "email" },
    {
      name: "role",
      label: "Rol",
      type: "select",
      options: EMPLOYEE_ROLES_DET,
      roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR],
      editableRoles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR]
    },
    { name: "phoneNumber", label: "Teléfono" },
    { name: "address", label: "Dirección" },
    { name: "city", label: "Ciudad" }
  ];

  return (
    <GenericTableSection
      title="Personal"
      endpoint="user"
      exportEndpoint="user"
      fields={fields}
      columns={columns}
    />
  );
};
export default Employees;