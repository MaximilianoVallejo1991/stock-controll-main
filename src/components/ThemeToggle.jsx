import { useTheme } from "../context/ThemeContext";
import ThemedButton from "./ThemedButton";

const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <ThemedButton
      onClick={toggleTheme}
    >
      {isDark ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
    </ThemedButton>
  );
};

export default ThemeToggle;
