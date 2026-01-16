import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { CartProvider } from "../context/CartProvider";
import { useAuth } from "../context/useAuth";
import { router } from "./router/routes";
import { SplashScreen } from "./components/SplashScreen";

function App() {
  const { isLoading } = useAuth();

  return (
    <CartProvider>
      <SplashScreen mode="fullscreen" show={isLoading} message="Loading..." />
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