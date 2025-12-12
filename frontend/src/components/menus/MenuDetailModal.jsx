import { useEffect, useMemo, useState } from "react";
import { getMenu } from "../../api/menus";
import { fetchRecipe } from "../../api/spoonacular";
import { getOwnRecipe } from "../../api/ownRecipes";
import MacrosDonutChart from "../profile/MacrosDonutChart";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const UPLOAD_BASE = `${API_BASE}/uploads/`;

function normalizeImage(src) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${UPLOAD_BASE}${src}`;
}

function useRecipeDetails(item) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!item) return;
      setLoading(true);
      try {
        if (item.origin === "own") {
          const data = await getOwnRecipe(item.id);
          setDetails({ ...data, origin: "own" });
        } else {
          const data = await fetchRecipe(item.id);
          setDetails({ ...data, origin: "spoonacular" });
        }
      } catch (err) {
        console.error("Error loading recipe", err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [item]);

  return { details, loading };
}

function MenuRecipePreview({ recipe }) {
  const { details, loading } = useRecipeDetails(recipe);

  const macros = useMemo(() => {
    if (details?.macros) {
      return {
        proteinas_g: details.macros.protein,
        grasas_g: details.macros.fats,
        carbohidratos_g: details.macros.carbs,
        calorias: details.macros.calories,
      };
    }

    if (details?.nutrition?.nutrients) {
      const getAmount = (label) => {
        const entry = details.nutrition.nutrients.find((n) => n.name === label);
        return entry ? Math.round(entry.amount) : 0;
      };

      return {
        proteinas_g: getAmount("Protein"),
        grasas_g: getAmount("Fat"),
        carbohidratos_g: getAmount("Carbohydrates"),
        calorias: getAmount("Calories"),
      };
    }

    if (recipe?.macros) {
      return {
        proteinas_g: recipe.macros.protein,
        grasas_g: recipe.macros.fats,
        carbohidratos_g: recipe.macros.carbs,
        calorias: recipe.macros.calories,
      };
    }

    return null;
  }, [details, recipe]);

  const prepTime = useMemo(() => {
    if (!recipe) return null;
    return (
      details?.readyInMinutes ||
      details?.time ||
      details?.preparationMinutes ||
      recipe.time ||
      null
    );
  }, [details, recipe]);

  if (!recipe) {
    return (
      <div className="menu-recipe-placeholder">
        <p className="page-subtitle">Elige una receta para ver los detalles.</p>
      </div>
    );
  }

  return (
    <div className="menu-recipe-panel">
      <div className="menu-recipe-header">
        <div>
          <p className="eyebrow">{recipe.origin === "own" ? "Receta propia" : "Spoonacular"}</p>
          <h3>{recipe.title}</h3>
        </div>
        {loading && <span className="tag">Cargando...</span>}
      </div>

      {(details?.image || recipe.image) && (
        <div className="menu-recipe-image">
          <img src={normalizeImage(details?.image || recipe.image)} alt={recipe.title} />
        </div>
      )}

      {(details?.summary || details?.description) && (
        <div className="menu-recipe-summary">
          <p
            className="recipe-description"
            dangerouslySetInnerHTML={{ __html: details.summary || details.description }}
          />
        </div>
      )}

      <div className="menu-recipe-info-grid">
        <div className="menu-recipe-stats">
          {prepTime && (
            <div className="menu-recipe-time">
              <h4>Tiempo</h4>
              <p className="menu-recipe-time-value">{prepTime} min</p>
            </div>
          )}

          {macros && (
            <div className="menu-recipe-macro-card">
              <div className="menu-recipe-macro-head">
                <p className="eyebrow">Calorías</p>
                <h4>{macros.calorias} kcal</h4>
              </div>
              <MacrosDonutChart macros={macros} />
            </div>
          )}
        </div>

        {(details?.extendedIngredients || details?.ingredients) && (
          <div className="menu-recipe-ingredients">
            <h4>Ingredientes</h4>
            <ul>
              {details?.extendedIngredients?.map((ing) => (
                <li key={ing.id || ing.original}>{ing.original}</li>
              ))}
              {details?.ingredients?.map((ing, idx) => (
                <li key={idx}>{ing.nombre} — {ing.cantidad}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(details?.analyzedInstructions?.[0]?.steps || details?.steps || details?.instructions) && (
        <div className="menu-recipe-section">
          <h4>Pasos</h4>
          {details?.analyzedInstructions?.[0]?.steps && (
            <ol>
              {details.analyzedInstructions[0].steps.map((step) => (
                <li key={step.number}>{step.step}</li>
              ))}
            </ol>
          )}

          {details?.steps && (
            <ol>
              {details.steps.map((s, idx) => (
                <li key={idx}>{s.descripcion}</li>
              ))}
            </ol>
          )}

          {details?.instructions &&
            !details?.analyzedInstructions?.[0]?.steps &&
            !details?.steps && (
              <p
                className="recipe-description"
                dangerouslySetInnerHTML={{ __html: details.instructions }}
              />
            )}
        </div>
      )}
    </div>
  );
}

export default function MenuDetailModal({ menuId, onClose }) {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRecipe, setActiveRecipe] = useState(null);

  useEffect(() => {
    let active = true;
    function normalizeMenuItem(item) {
      if (!item) return null;

      const normalizedMacros =
        item.macros ||
        (item.calorias || item.proteinas || item.carbohidratos || item.grasas
          ? {
              calories: Number(item.calorias || 0),
              protein: Number(item.proteinas || 0),
              carbs: Number(item.carbohidratos || 0),
              fats: Number(item.grasas || 0),
            }
          : null);

      const rawOrigin = `${item.origin || item.origen || item.source || ""}`.toLowerCase();
      const explicitOwn =
        rawOrigin.includes("own") ||
        rawOrigin.includes("propia") ||
        rawOrigin.includes("propio") ||
        item.es_propia === true ||
        item.es_propia === 1 ||
        item.es_propia === "1";

      const normalizedOrigin = explicitOwn ? "own" : "spoonacular";

      const resolvedId =
        item.receta_id ||
        item.recipe_id ||
        item.own_recipe_id ||
        item.spoonacular_id ||
        item.recipe?.id ||
        item.receta?.id ||
        item.menuRecipe?.id ||
        item.id;

      if (!resolvedId) return null;

      return {
        ...item,
        id: resolvedId,
        origin: normalizedOrigin,
        title: item.title || item.nombre || item.name,
        image: item.image || item.imagen_url || item.imagen,
        macros: normalizedMacros,
      };
    }

    async function load() {
      try {
        setLoading(true);
        const data = await getMenu(menuId);
        if (active) {
          const normalizedItems = (data.items || []).map(normalizeMenuItem).filter(Boolean);
          setMenu({ ...data, items: normalizedItems });
          setActiveRecipe(normalizedItems?.[0] || null);
        }
      } catch (err) {
        console.error("Error cargando menú", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [menuId]);

  const totals = useMemo(() => {
    if (!menu) return null;
    return {
      calorias: Math.round(
        menu.calorias_total ?? menu.calories_total ??
          (menu.items || []).reduce((acc, it) => acc + Number(it.calorias || it.macros?.calories || 0), 0)
      ),
      proteinas: Math.round(
        menu.proteinas_total ?? menu.protein_total ??
          (menu.items || []).reduce((acc, it) => acc + Number(it.proteinas || it.macros?.protein || 0), 0)
      ),
      carbohidratos: Math.round(
        menu.carbohidratos_total ?? menu.carbs_total ??
          (menu.items || []).reduce((acc, it) => acc + Number(it.carbohidratos || it.macros?.carbs || 0), 0)
      ),
      grasas: Math.round(
        menu.grasas_total ?? menu.fats_total ??
          (menu.items || []).reduce((acc, it) => acc + Number(it.grasas || it.macros?.fats || 0), 0)
      ),
    };
  }, [menu]);

  const totalsForChart = useMemo(() => {
    if (!totals) return null;
    return {
      calorias: totals.calorias,
      proteinas_g: totals.proteinas,
      carbohidratos_g: totals.carbohidratos,
      grasas_g: totals.grasas,
    };
  }, [totals]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="menu-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <p className="eyebrow">Menú</p>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="recipe-modal-body">
            <p className="page-loading">Cargando menú...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="menu-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Menú diario</p>
            <h2>{menu.nombre}</h2>
            {menu.descripcion && <p className="page-subtitle">{menu.descripcion}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        {totals && (
          <div className="menu-summary">
            <div className="menu-summary-text">
              <p className="eyebrow">Macros totales</p>
              <h3>{totals.calorias} kcal</h3>
              <div className="macro-line">
                <span>{totals.proteinas}P</span>
                <span>{totals.carbohidratos}C</span>
                <span>{totals.grasas}G</span>
              </div>
            </div>
            {totalsForChart && <MacrosDonutChart macros={totalsForChart} />}
          </div>
        )}

        <div className="menu-items-list">
          {menu.items?.map((item, idx) => (
            <button
              key={`${item.origin}-${item.id}-${idx}`}
              className={`menu-item-pill ${activeRecipe?.id === item.id ? "is-active" : ""}`}
              onClick={() => setActiveRecipe(item)}
            >
              <span>{item.label || `Receta ${idx + 1}`}</span>
              <small className="profile-sub">{item.title}</small>
            </button>
          ))}
        </div>

        <MenuRecipePreview recipe={activeRecipe} />
      </div>
    </div>
  );
}
