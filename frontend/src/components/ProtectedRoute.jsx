import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/user_data.php`,
          { withCredentials: true }
        );

        if (!mounted) return;

        if (res.data && !res.data.error) setAuthed(true);
        else setAuthed(false);
      } catch (err) {
        if (!mounted) return;
        setAuthed(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    checkSession();
    return () => (mounted = false);
  }, []);

  if (loading) return <div className="text-gray-300 p-6">Cargando...</div>;
  if (!authed) return <Navigate to="/login" replace />;

  return children;
}
