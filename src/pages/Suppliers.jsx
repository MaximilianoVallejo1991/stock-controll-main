import GenericTableSection from "../components/GenericTableSection";
import { ROLES } from "../constants/roles";

export const Suppliers = () => {
  const columns = [
    { header: "Nombre", accessorKey: "fullName" },
    { header: "CUIT", accessorKey: "cuit" },
    { header: "email", accessorKey: "email" },
    { header: "Teléfono", accessorKey: "phoneNumber" },
    { header: "Dirección", accessorKey: "address" },
    { header: "Ciudad", accessorKey: "city" },
  ];


  const fields = [
    { name: "fullName", label: "Nombre completo" },
    { name: "email", label: "Email", type: "email" },
    { name: "cuit", label: "CUIT" },
    { name: "phoneNumber", label: "Teléfono" },
    { name: "address", label: "Dirección" },
    { name: "city", label: "Ciudad" },
  ];



  return (
    <GenericTableSection
      title="Proveedores"
      endpoint="suppliers"
      exportEndpoint="suppliers"
      fields={fields}
      columns={columns}
      createRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO]}
    />
  );
};
