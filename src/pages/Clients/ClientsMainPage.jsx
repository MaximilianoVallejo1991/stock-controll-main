import { useTheme } from "../../context/ThemeContext";
import SectionCard from "../../components/SectionCard";
import { Users, CreditCard } from "lucide-react";

const ClientsMainPage = () => {
  const { theme } = useTheme();

  const sections = [
    { label: "Listado", icon: Users, route: "/clients/list" },
    { label: "Cuentas Corrientes", icon: CreditCard, route: "/accounts" },
  ];

  return (
    <main className="flex" style={{ backgroundColor: theme.bg }}>
      <div
        className="min-h-screen w-full p-8 flex justify-center items-center flex-col gap-6"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <div className="w-full flex justify-between items-center max-w-4xl">
          <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl h-2/5">
          {sections.map((section) => (
            <SectionCard
              key={section.route}
              label={section.label}
              icon={section.icon}
              route={section.route}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default ClientsMainPage;
