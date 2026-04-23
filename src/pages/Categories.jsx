import { GenericTableSection } from "../components/GenericTableSection.jsx";

export const Categories = () => {
  const columns = [
    { header: "Nombre", accessorKey: "name" },
    { header: "Prefijo Barcode", accessorKey: "barcodePrefix" },
    { header: "Descripción", accessorKey: "description" },
  ];

  const fields = [
    { name: "name", label: "Nombre" },
    { name: "description", label: "Descripción" },
  ];

  return (
  <GenericTableSection
    title="Categorías"
    endpoint="categories"
    exportEndpoint="categories"
    fields={fields}
    columns={columns}
/>
  );
};


