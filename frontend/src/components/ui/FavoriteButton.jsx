// src/components/ui/FavoriteButton.jsx
import { useContext, useEffect, useState } from "react";
import { FiHeart } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { AuthContext } from "../../context/AuthContext";
import { listFavorites, toggleFavorite } from "../../api/favorites";

export default function FavoriteButton({ recipeId, origin = "spoonacular", onToggle, compact }) {
  const { user } = useContext(AuthContext);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkFavorite() {
      if (!user) {
        setIsFavorite(false);
        return;
      }
      try {
        const data = await listFavorites();
        const items = Array.isArray(data?.favorites) ? data.favorites : data;

        if (Array.isArray(items)) {
          const found = items.some(
            (f) =>
              String(f.id_receta) === String(recipeId) &&
              (f.origen ?? f.origin ?? "spoonacular") === origin
          );
          if (active) setIsFavorite(found);
        }
      } catch (err) {
        console.error("Error checking favorite", err);
      }
    }

    checkFavorite();
    return () => {
      active = false;
    };
  }, [recipeId, origin, user]);

  async function handleToggle(e) {
    e.stopPropagation();
    if (!user) {
      setError("Inicia sesión para guardar favoritos.");
      return;
    }
    try {
      setLoading(true);
      const data = await toggleFavorite(recipeId, origin);
      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const newState = Boolean(data?.favorite);
      setIsFavorite(newState);
      setError(null);
      onToggle?.(newState);
    } catch (err) {
      console.error("Toggle favorite error", err);
      setError("No se pudo actualizar el favorito.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="favorite-button-wrapper">
      <button
        className={`favorite-button ${isFavorite ? "is-favorite" : ""} ${compact ? "compact" : ""}`}
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={isFavorite}
        title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      >
        {isFavorite ? <AiFillHeart /> : <FiHeart />}
        {!compact && <span>{isFavorite ? "En favoritos" : "Guardar"}</span>}
      </button>
      {error && !compact && <p className="favorite-error">{error}</p>}
    </div>
  );
}
