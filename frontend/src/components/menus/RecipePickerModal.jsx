import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function MacroBadges({ macros }) {
  if (!macros) return null;
  return (
    <div className="macro-line">
      <span>{Math.round(macros.calories)} kcal</span>
      <span>{Math.round(macros.protein)}P</span>
      <span>{Math.round(macros.carbs)}C</span>
      <span>{Math.round(macros.fats)}G</span>
    </div>
  );
}

export default function RecipePickerModal({
  ownOptions = [],
  spoonOptions = [],
  favoriteOptions = [],
  isOpen,
  searchTerm = "",
  loadingSp = false,
  onSearch,
  onSelect,
  onClose,
}) {
  const [term, setTerm] = useState(searchTerm || "");
  const [source, setSource] = useState("own");

  useEffect(() => {
    setTerm(searchTerm || "");
  }, [searchTerm]);

  const sortedOwn = useMemo(
    () => [...ownOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [ownOptions]
  );
  const sortedSpoon = useMemo(
    () => [...spoonOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [spoonOptions]
  );
  const filteredOwn = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return sortedOwn;
    return sortedOwn.filter((recipe) => recipe.title.toLowerCase().includes(q));
  }, [sortedOwn, term]);

  const filteredSpoon = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return sortedSpoon;
    return sortedSpoon.filter((recipe) => recipe.title.toLowerCase().includes(q));
  }, [sortedSpoon, term]);

  const filteredFavs = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return favoriteOptions;
    return favoriteOptions.filter((recipe) =>
      recipe.title.toLowerCase().includes(q)
    );
  }, [favoriteOptions, term]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay picker-overlay" onClick={onClose}>
      <div className="recipe-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Buscar receta</p>
            <h3>Elige qué receta añadir</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="picker-toggle">
          <button
            className={source === "own" ? "tag active" : "tag"}
            onClick={() => setSource("own")}
          >
            Propias ({filteredOwn.length})
          </button>
          <button
            className={source === "spoon" ? "tag active" : "tag"}
            onClick={() => setSource("spoon")}
          >
            Spoonacular ({filteredSpoon.length})
          </button>
          <button
            className={source === "fav" ? "tag active" : "tag"}
            onClick={() => setSource("fav")}
          >
            Favoritos ({filteredFavs.length})
          </button>
        </div>

        <div className="picker-search">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Filtra por nombre o busca en Spoonacular"
          />
          <button
            className="btn-secondary"
            onClick={() => onSearch?.(term)}
            disabled={loadingSp || source !== "spoon"}
            title={source !== "spoon" ? "Cambia a Spoonacular para buscar" : undefined}
          >
            {loadingSp ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {source === "own" && (
          <div className="picker-section">
            <div className="picker-section-head">
              <h4>Recetas propias</h4>
              <span className="tag">{filteredOwn.length}</span>
            </div>
            {filteredOwn.length === 0 ? (
              <p className="profile-sub">
                {sortedOwn.length === 0
                  ? "Aún no tienes recetas creadas."
                  : "No hay coincidencias con ese término."}
              </p>
            ) : (
              <div className="picker-grid">
                {filteredOwn.map((recipe) => (
                  <button
                    key={`own-${recipe.id}`}
                    className="picker-card"
                    onClick={() => onSelect?.(recipe)}
                  >
                    {recipe.image && <img src={recipe.image} alt={recipe.title} />}
                    <div className="picker-card-body">
                      <p className="eyebrow">Propia</p>
                      <h5>{recipe.title}</h5>
                      <MacroBadges macros={recipe.macros} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {source === "spoon" && (
          <div className="picker-section">
            <div className="picker-section-head">
              <h4>Resultados Spoonacular</h4>
              <span className="tag">{filteredSpoon.length}</span>
            </div>
            {filteredSpoon.length === 0 ? (
              <p className="profile-sub">
                {sortedSpoon.length === 0
                  ? "Busca para cargar opciones de Spoonacular."
                  : "No hay coincidencias con ese término."}
              </p>
            ) : (
              <div className="picker-grid">
                {filteredSpoon.map((recipe) => (
                  <button
                    key={`sp-${recipe.id}`}
                    className="picker-card"
                    onClick={() => onSelect?.(recipe)}
                  >
                    {recipe.image && <img src={recipe.image} alt={recipe.title} />}
                    <div className="picker-card-body">
                      <p className="eyebrow">Spoonacular</p>
                      <h5>{recipe.title}</h5>
                      <MacroBadges macros={recipe.macros} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {source === "fav" && (
          <div className="picker-section">
            <div className="picker-section-head">
              <h4>Favoritos</h4>
              <span className="tag">{filteredFavs.length}</span>
            </div>
            {filteredFavs.length === 0 ? (
              <p className="profile-sub">
                {favoriteOptions.length === 0
                  ? "No tienes recetas favoritas aún."
                  : "No hay coincidencias con ese término."}
              </p>
            ) : (
              <div className="picker-grid">
                {filteredFavs.map((recipe) => (
                  <button
                    key={`fav-${recipe.origin}-${recipe.id}`}
                    className="picker-card"
                    onClick={() => onSelect?.(recipe)}
                  >
                    {recipe.image && <img src={recipe.image} alt={recipe.title} />}
                    <div className="picker-card-body">
                      <p className="eyebrow">{recipe.origin === "own" ? "Propia" : "Spoonacular"}</p>
                      <h5>{recipe.title}</h5>
                      <MacroBadges macros={recipe.macros} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
