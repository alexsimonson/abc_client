import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/authProvider";
import { CartProvider } from "./cart/CartContext";
import { ToastProvider } from "./components/Toast";
import App from "./App";

const el = document.getElementById("root");
if (!el) throw new Error("Missing <div id='root'></div> in index.html");

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
