import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, Box, useTheme } from "@mui/material";

import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/dashBoard.jsx";
import NoteEditor from "./pages/noteEditor.jsx";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const theme = useTheme();

  return (
    <Router>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor:
            theme.palette.mode === "dark"
              ? "#121212"
              : theme.palette.background.default,
          color: theme.palette.text.primary,
        }}
      >
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/note/:id" 
            element={
              <ProtectedRoute>
                <NoteEditor />
              </ProtectedRoute>
            } 
          />
          
        </Routes>
      </Box>
    </Router>
  );
}

export default App;