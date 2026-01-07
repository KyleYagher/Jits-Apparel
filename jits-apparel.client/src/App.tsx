import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { CartProvider } from "../context/CartProvider";
import { router } from "./router/routes";
import './App.css';

function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        className="bg-dark"
      />
    </CartProvider>
  );
}

export default App;