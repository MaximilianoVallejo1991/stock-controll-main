import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const ThemedButton = ({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false
}) => {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  const style = {
    backgroundColor: disabled
      ? theme.bg2 || "#ccc"
      : hovered
        ? theme.bg5
        : theme.bg4,
    color: disabled ? "#888" : theme.text,
    border: "none",
    transition: "background-color 0.3s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
      className={`rounded px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
};

export default ThemedButton;
