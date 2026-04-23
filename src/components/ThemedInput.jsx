// src/components/ThemedInput.jsx
import { useTheme } from "../context/ThemeContext";

const ThemedInput = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
  className = "",
}) => {
  const { theme } = useTheme();

  const style = {
    backgroundColor: theme.bg3,
    color: theme.text,
    border: `1px solid ${theme.colorScroll}`,
    padding: "0.5rem",
    borderRadius: "0.375rem", // equivale a Tailwind rounded
    outline: "none",
  };

  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={style}
      className={`w-full ${className}`}
    />
  );
};

export default ThemedInput;
