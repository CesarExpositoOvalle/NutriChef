// src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import axios from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  function normalizeUser(payload) {
    if (!payload) return null;
    return {
      ...payload,
      rol: payload.rol || "usuario",
      requirePasswordChange: !!payload.requirePasswordChange,
    };
  }

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);



  async function login(email, password) {
  try {
    const res = await axios.post(
      "/auth/login.php",
      { email, password },
      { withCredentials: true }
    );

    if (!res.data.success) {
      
      return {
        success: false,
        message: res.data.message,
      };
    }

    setUser(normalizeUser(res.data.user));
    return res.data;

  } catch (err) {
    
    return {
      success: false,
      message: err.response?.data?.message || "Error de conexión",
    };
  }
}



  async function register({ nombre, email, password, password2 }) {
    try {
      const payload = {
        nombre,
        email,
        password,
        password2,   
      };

      const res = await axios.post("/auth/register.php", payload, {
        withCredentials: true,
      });

      if (!res.data.success) throw new Error(res.data.message);

      setUser(normalizeUser(res.data.user));
      return res.data;

    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Error al registrar usuario"
      );
    }
  }



  async function logout() {
    await axios.post("/auth/logout.php", {}, { withCredentials: true });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
