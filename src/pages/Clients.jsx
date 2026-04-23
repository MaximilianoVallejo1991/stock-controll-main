import GenericTableSection from "../components/GenericTableSection";

export const Clients = () => {

  const fields = [
    { name: "firstName", label: "Nombre" },
    { name: "lastName", label: "Apellido" },
    { name: "email", label: "Email", type: "email" },
    { name: "dni", label: "DNI" },
    { name: "address", label: "Dirección" },
    { name: "phoneNumber", label: "Teléfono" },
    { name: "city", label: "Ciudad" },
  ];

  const columns = [
    { header: "Nombre", accessorKey: "firstName" },
    { header: "Apellido", accessorKey: "lastName" },
    { header: "DNI", accessorKey: "dni" },
    { header: "Dirección", accessorKey: "address" },
    { header: "Email", accessorKey: "email" },
    { header: "Teléfono", accessorKey: "phoneNumber" },
    { header: "Ciudad", accessorKey: "city" },

  ];

  return (
    <GenericTableSection
      title="Clientes"
      endpoint="clients"
      exportEndpoint="clients"
      fields={fields}
      columns={columns}
    />
  );
};
export default Clients;
