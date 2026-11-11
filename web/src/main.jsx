import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CourseDataProvider } from "./context/CourseDataContext.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <CourseDataProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </CourseDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
