import GenericTableSection from "../components/GenericTableSection";
import useUserStore from "../store/userStore";

export const Stores = () => {
  const user = useUserStore(state => state.user);
  const isSistema = user?.role === 'SISTEMA' || user?.rbacRole === 'SISTEMA';

  const fields = [
    { name: "name", label: "Nombre" },
    { name: "address", label: "Dirección" },
    { name: "phone", label: "Teléfono" }
  ];

  const columns = [
    { header: "Nombre", accessorKey: "name" },
    { header: "Dirección", accessorKey: "address" },
    { header: "Teléfono", accessorKey: "phone" },
  ];

  if (isSistema) {
    fields.push({ name: "maxDiscountPct", label: "Tope máximo de descuento (%)", type: "number", min: 1, max: 100 });
    columns.push({ header: "Tope Desc. (%)", accessorKey: "maxDiscountPct" });
  }

  return (
    <GenericTableSection
      title="Tiendas"
      endpoint="stores"
      fields={fields}
      columns={columns}
    />
  );
};
export default Stores;
