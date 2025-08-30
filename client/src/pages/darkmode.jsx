import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { IconButton } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";

const DarkModeToggle = () => {
  const { toggleTheme, mode } = useContext(ThemeContext);

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {mode === "light" ? <DarkMode /> : <LightMode />}
    </IconButton>
  );
};

export default DarkModeToggle;