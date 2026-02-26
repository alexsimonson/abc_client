import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/authProvider";
import App from "./App";

const el = document.getElementById("root");
if (!el) throw new Error("Missing <div id='root'></div> in index.html");

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
