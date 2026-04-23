import { useTheme } from "../context/ThemeContext";
import SectionCard from "../components/SectionCard";
import {
    User,
    Box,
    ShoppingCart,
    Users,
    Building2,
    LayoutGrid,
} from "lucide-react";

const Stock = () => {
    const { theme } = useTheme();

    const sections = [


        { label: "Categorías", icon: LayoutGrid, route: "/categories" },
        { label: "Productos", icon: Box, route: "/products" },

    ];

    return (
        <main className="flex" style={{ backgroundColor: theme.bg }}>
            <div
                className="min-h-screen w-full p-8 flex justify-center items-center flex-col gap-6"
                style={{ backgroundColor: theme.bg, color: theme.text }}
            >
                <div className="w-full flex justify-between items-center max-w-4xl">
                    <h1 className="text-3xl font-bold">Categorias y Productos</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl h-2/7">
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

export default Stock;







