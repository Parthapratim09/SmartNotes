import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ThemeContextProvider from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <ThemeContextProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeContextProvider>
  </React.StrictMode>
);
