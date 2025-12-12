import { useEffect, useState } from "react";
import { getOwnRecipe, listOwnRecipes } from "../api/ownRecipes";
import { fetchRecipe, fetchRecipes } from "../api/spoonacular";
import { createMenu, listMenus } from "../api/menus";
import { listFavorites } from "../api/favorites";
import MenuDetailModal from "../components/menus/MenuDetailModal";
import RecipePickerModal from "../components/menus/RecipePickerModal";
import "../styles/pages/Menus.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const UPLOAD_BASE = `${API_BASE}/uploads/`;

function normalizeOwnRecipe(recipe) {
  const image = recipe.image
    ? recipe.image.startsWith("http")
      ? recipe.image
      : `${UPLOAD_BASE}${recipe.image}`
    : null;

  return {
    id: recipe.id,
    origin: "own",
    title: recipe.title,
    image,
    macros: {
      calories: Number(recipe.calories || 0),
      protein: Number(recipe.protein || 0),
      carbs: Number(recipe.carbs || 0),
      fats: Number(recipe.fats || 0),
    },
  };
}

function normalizeSpoonacular(recipe) {
  return {
    id: recipe.id,
    origin: "spoonacular",
    title: recipe.title,
    image: recipe.image,
    macros: recipe.macros || { calories: 0, protein: 0, carbs: 0, fats: 0 },
  };
}

const DEFAULT_SLOTS = [
  { label: "Comida 1", recipe: null },
  { label: "Comida 2", recipe: null },
];

export default function DailyMenus() {
  const [ownRecipes, setOwnRecipes] = useState([]);
  const [spoonacular, setSpoonacular] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [menus, setMenus] = useState([]);

  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [menuName, setMenuName] = useState("Menú personalizado");
  const [menuDesc, setMenuDesc] = useState("");
  const [message, setMessage] = useState(null);
  const [loadingSp, setLoadingSp] = useState(false);
  const [search, setSearch] = useState("");
  const [pickerIndex, setPickerIndex] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadData() {
    const [own, savedMenus] = await Promise.all([listOwnRecipes(), listMenus()]);
    setOwnRecipes(own || []);
    setMenus(savedMenus || []);
  }

  async function loadFavorites() {
    try {
      const data = await listFavorites();
      const raw = Array.isArray(data?.favorites) ? data.favorites : data;

      if (!Array.isArray(raw)) {
        setFavoriteRecipes([]);
        return;
      }

      const detailed = await Promise.all(
        raw.map(async (fav) => {
          const origin = fav.origen ?? fav.origin ?? "spoonacular";
          const id = Number(fav.id_receta ?? fav.id);

          try {
            if (origin === "own") {
              const recipe = await getOwnRecipe(id);
              return normalizeOwnRecipe(recipe);
            }

            const recipe = await fetchRecipe(id);
            return normalizeSpoonacular(recipe);
          } catch (error) {
            console.error("Error cargando favorito", error);
            return null;
          }
        })
      );

      setFavoriteRecipes(detailed.filter(Boolean));
    } catch (error) {
      console.error("No se pudieron cargar los favoritos", error);
      setFavoriteRecipes([]);
    }
  }

  useEffect(() => {
    loadData();
    loadFavorites();
  }, []);

  function updateSlot(idx, patch) {
    setSlots((prev) => prev.map((slot, i) => (i === idx ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    setSlots((prev) => {
      if (prev.length >= 6) return prev;
      return [...prev, { label: `Comida ${prev.length + 1}`, recipe: null }];
    });
  }

  function removeSlot(idx) {
    setSlots((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function searchSpoonacular(term = search) {
    try {
      setLoadingSp(true);
      const res = await fetchRecipes(term, 1, 6);
      setSpoonacular(res.results || []);
    } catch (e) {
      console.error("Error searching Spoonacular", e);
    } finally {
      setLoadingSp(false);
    }
  }

  async function handleCreateMenu() {
    const filled = slots.filter((s) => s.recipe);
    if (filled.length === 0) {
      setMessage("Añade al menos una receta");
      return;
    }

    const payload = {
      name: menuName || "Menú personalizado",
      description: menuDesc,
      items: filled.map((slot) => ({
        id: slot.recipe.id,
        origin: slot.recipe.origin,
        label: slot.label,
        title: slot.recipe.title,
        image: slot.recipe.image,
        macros: slot.recipe.macros,
      })),
    };

    const res = await createMenu(payload);
    if (!res.success) {
      setMessage(res.message || "No se pudo guardar el menú");
      return;
    }

    setMessage("Menú guardado");
    setSlots(DEFAULT_SLOTS);
    setMenuName("Menú personalizado");
    setMenuDesc("");
    loadData();
    setShowCreateModal(false);
  }

  function collageImages(menu) {
    return (menu.items || [])
      .slice(0, 4)
      .map((i) => i.imagen_url || i.image || i.imagen || "")
      .map((url) => {
        if (!url) return null;
        return url.startsWith("http") ? url : `${UPLOAD_BASE}${url}`;
      })
      .filter(Boolean);
  }

  function menuTotals(menu) {
    return {
      calories:
        menu?.calorias_total ??
        (menu?.items || []).reduce((acc, it) => acc + Number(it.calorias || 0), 0),
      protein:
        menu?.proteinas_total ??
        (menu?.items || []).reduce((acc, it) => acc + Number(it.proteinas || 0), 0),
      carbs:
        menu?.carbohidratos_total ??
        (menu?.items || []).reduce((acc, it) => acc + Number(it.carbohidratos || 0), 0),
      fats:
        menu?.grasas_total ??
        (menu?.items || []).reduce((acc, it) => acc + Number(it.grasas || 0), 0),
    };
  }

  function handleSelectFromOptions(recipe) {
    updateSlot(pickerIndex, { recipe });
    setPickerIndex(null);
  }

  return (
    <div className="menus-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Organiza tus comidas</p>
          <h1 className="page-title">Menús diarios</h1>
          <p className="page-subtitle">Diseña menús con tus recetas y consúltalos rápidamente.</p>
        </div>
      </div>

      <div className="menu-card-grid">
        <button
          className="create-card menu-create-card"
          onClick={() => {
            setMessage(null);
            setShowCreateModal(true);
          }}
        >
          <div className="plus">+</div>
          Crear menú diario
        </button>

        {menus.map((menu) => {
          const images = collageImages(menu);
          const totals = menuTotals(menu);
          return (
            <button
              key={menu.id}
              className="menu-card"
              onClick={() => setSelectedMenuId(menu.id)}
            >
              <div className={`collage collage-${images.length || 1}`}>
                {images.length === 0 && <div className="placeholder">🍽️</div>}
                {images.map((src, i) => (
                  <img key={i} src={src} alt={menu.nombre} />
                ))}
              </div>
              <div className="menu-card-body">
                <h4>{menu.nombre}</h4>
                {menu.descripcion && <p className="profile-sub">{menu.descripcion}</p>}
                <div className="menu-card-macros">
                  <span>{Math.round(totals.calories)} kcal</span>
                  <span>{Math.round(totals.protein)}P</span>
                  <span>{Math.round(totals.carbs)}C</span>
                  <span>{Math.round(totals.fats)}G</span>
                </div>
              </div>
            </button>
          );
        })}

        {menus.length === 0 && <div className="empty-card">Crea tu primer menú</div>}
      </div>

      {pickerIndex !== null && (
        <RecipePickerModal
          ownOptions={ownRecipes.map(normalizeOwnRecipe)}
          spoonOptions={spoonacular.map(normalizeSpoonacular)}
          favoriteOptions={favoriteRecipes}
          isOpen={pickerIndex !== null}
          loadingSp={loadingSp}
          searchTerm={search}
          onSearch={(term) => {
            setSearch(term);
            searchSpoonacular(term);
          }}
          onSelect={handleSelectFromOptions}
          onClose={() => setPickerIndex(null)}
        />
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="menu-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Nuevo menú</p>
                <h2>Diseña tu combinación</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            {message && <p className="form-note">{message}</p>}

            <div className="menu-form">
              <input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Nombre del menú"
              />
              <textarea
                value={menuDesc}
                onChange={(e) => setMenuDesc(e.target.value)}
                placeholder="Descripción breve"
              />

              <div className="slot-list">
                {slots.map((slot, idx) => (
                  <div key={idx} className="slot-row">
                    <div className="slot-header">
                      <input
                        value={slot.label}
                        onChange={(e) => updateSlot(idx, { label: e.target.value })}
                        placeholder={`Plato ${idx + 1}`}
                      />
                      {slots.length > 2 && (
                        <button className="text-btn" onClick={() => removeSlot(idx)}>
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="slot-actions">
                      <button className="btn-secondary" onClick={() => setPickerIndex(idx)}>
                        {slot.recipe ? "Cambiar receta" : "Seleccionar receta"}
                      </button>
                      {slot.recipe && (
                        <button className="text-btn" onClick={() => updateSlot(idx, { recipe: null })}>
                          Limpiar
                        </button>
                      )}
                    </div>

                    {slot.recipe && (
                      <div className="slot-preview">
                        <img src={slot.recipe.image} alt={slot.recipe.title} />
                        <div>
                          <p className="slot-title">{slot.recipe.title}</p>
                          <p className="slot-macros">
                            {slot.recipe.macros.calories} kcal · {slot.recipe.macros.protein}P · {slot.recipe.macros.carbs}C · {slot.recipe.macros.fats}G
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="slot-actions">
                <button className="text-btn" onClick={addSlot} disabled={slots.length >= 6}>
                  + Añadir plato
                </button>
                <span className="profile-sub">Máximo 6 platos</span>
              </div>

              <div className="search-inline">
                <input
                  placeholder="Buscar en Spoonacular (opcional)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn-secondary" onClick={searchSpoonacular} disabled={loadingSp}>
                  {loadingSp ? "Buscando..." : "Buscar"}
                </button>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleCreateMenu}>
                  Guardar menú
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMenuId && (
        <MenuDetailModal menuId={selectedMenuId} onClose={() => setSelectedMenuId(null)} />
      )}
    </div>
  );
}
