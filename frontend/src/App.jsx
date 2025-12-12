// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Layout/Sidebar";
import { AdminRoute, PrivateRoute } from "./routes/RouteGuards";

import Home from "./pages/Home";
import AllDishes from "./pages/AllDishes";
import Recipe from "./pages/Recipe";
import MyDishes from "./pages/MyDishes";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Menus from "./pages/Menus";
import DailyMenus from "./pages/DailyMenus";
import WeeklyMenus from "./pages/WeeklyMenus";
import AdminUsers from "./pages/AdminUsers";

const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/dishes", element: <AllDishes /> },
  { path: "/recipe/:id", element: <Recipe /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
];

const privateRoutes = [
  { path: "/my-dishes", element: <MyDishes /> },
  { path: "/favorites", element: <Favorites /> },
  { path: "/menus", element: <Menus /> },
  { path: "/menus/daily", element: <DailyMenus /> },
  { path: "/menus/weekly", element: <WeeklyMenus /> },
  { path: "/profile", element: <Profile /> },
];

const adminRoutes = [
  { path: "/admin/users", element: <AdminUsers /> },
];

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <Routes>
          {publicRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {privateRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<PrivateRoute>{element}</PrivateRoute>}
            />
          ))}

          {adminRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<AdminRoute>{element}</AdminRoute>}
            />
          ))}

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
