import { createContext, useContext, useState } from "react";
import { Light, Dark } from "../styles/themes"; 
import useThemeStore from "../store/userStore";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const theme = isDark ? Dark : Light;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

function useThemeContext() {
  return useContext(ThemeContext);
}

export { useThemeContext as useTheme };