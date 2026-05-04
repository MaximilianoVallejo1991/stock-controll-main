import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

const SectionCard = ({ label, icon: Icon, route }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => navigate(route)}


      className="
          relative rounded-3xl overflow-hidden
          cursor-pointer
          flex  items-start
          hover:scale-105 hover:contrast-125
          transition
          group
          w-full md:max-w-xs p-4 md:p-6 min-h-[140px]
        "

      style={{ backgroundColor: hovered ? theme.bg5 : theme.bg2, color: theme.text }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon  className="absolute -right-4 -bottom-4 -rotate-6 size-35 group-hover:-rotate-12 group-hover:scale-125 transition-transform"  />



      <span className="text-lg font-semibold">{label}</span>
    </div>
  );
};

export default SectionCard;
