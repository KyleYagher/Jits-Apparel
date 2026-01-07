import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/Layout";
import HomeScreen from "../screens/Home";
import ShopScreen from "../screens/Shop";
import AboutScreen from "../screens/About";
import CheckoutScreen from "../screens/Checkout";
import ThemeScreen  from "../screens/Theme";
import { LoginPage } from "../screens/Login";
import { RegisterPage } from "../screens/Register";
import { UserProfile } from "../screens/UserProfile";
import { Dashboard } from "../screens/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: HomeScreen,
      },
      {
        path: "shop",
        Component: ShopScreen,
      },
      {
        path: "about",
        Component: AboutScreen,
      },
      {
        path: "checkout",
        Component: CheckoutScreen,
      },
      {
        path: "theme",
        Component: ThemeScreen,
      },
      {
        path: "profile",
        Component: UserProfile,
      },
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "register",
        Component: RegisterPage,
      }
    ]
  }
]);