import { useEffect, useState } from "react";
import axios from "axios";
import GenericTableSection from "../components/GenericTableSection";
import { formatCurrency } from "../utils/currency";
import { ROLES } from "../constants/roles";

export const Products = () => {

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios.get("/api/categories")
      .then(res => {
        setCategories(res.data);
        console.log('Categorías cargadas:', res.data);
      })
      .catch(err => {
        console.error("Error cargando categorías", err);
      });
  }, []);

  const categoryOptions = categories.map(c => ({
    label: c.name,
    value: c.id
  }));

  const fields = [
    { name: "name", label: "Nombre" },
    {
      name: "categoryId",
      label: "Categoría",
      type: "select",
      options: categoryOptions
    },
    { name: "description", label: "Descripción" },
    { name: "price", label: "Precio", type: "number" },
    { name: "stock", label: "Stock", type: "number" },
  ];


  const columns = [
    { header: "Nombre", accessorKey: "name" }, {
      header: "Categoría",
      accessorFn: row => row.category?.name || "—"
    },
    { header: "Descripción", accessorKey: "description" },
    { header: "Código de Barras", accessorKey: "barcode" },
    { header: "Precio", accessorFn: row => formatCurrency(row.price) },
    { header: "Stock", accessorKey: "stock" },
  ];



  return (
    <GenericTableSection
      title="Productos"
      endpoint="products"
      exportEndpoint="products"
      fields={fields}
      columns={columns}
      createRoles={[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO]}
    />
  );
};
