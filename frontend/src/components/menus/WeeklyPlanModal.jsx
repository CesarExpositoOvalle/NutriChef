import { useMemo, useState } from "react";
import { getMenu } from "../../api/menus";
import { getOwnRecipe } from "../../api/ownRecipes";
import { fetchRecipe } from "../../api/spoonacular";
import MenuDetailModal from "./MenuDetailModal";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function WeeklyPlanModal({ plan, onClose }) {
  const [menuToView, setMenuToView] = useState(null);
  const [shoppingList, setShoppingList] = useState([]);
  const [listStatus, setListStatus] = useState("idle");
  const [listError, setListError] = useState(null);

  function normalizeMenuItem(item) {
    if (!item) return null;

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
      id: resolvedId,
      origin: normalizedOrigin,
      title: item.title || item.nombre || item.name,
    };
  }

  function extractIngredients(details) {
    if (!details) return [];

    const normalizeQuantity = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const baseMapper = (raw) => {
      if (!raw) return null;
      const name = raw.name || raw.nombre || raw.originalName || raw.original || raw.title;
      if (!name) return null;

      const unit = raw.unit || raw.unidad || raw.unitShort || raw.unitLong || "";
      const quantity = normalizeQuantity(raw.amount ?? raw.cantidad ?? raw.quantity);
      const label = raw.original || raw.originalName || raw.label || name;

      return {
        name,
        unit,
        quantity,
        label,
      };
    };

    if (Array.isArray(details.extendedIngredients)) {
      return details.extendedIngredients.map(baseMapper).filter(Boolean);
    }

    if (Array.isArray(details.ingredients)) {
      return details.ingredients.map(baseMapper).filter(Boolean);
    }

    return [];
  }

  async function buildShoppingList() {
    setListStatus("loading");
    setListError(null);

    try {
      const menuCounts = new Map();
      (plan.menus || []).forEach((day) => {
        const menuId = day.menu?.id || day.menu_id || day.menuId;
        if (!menuId) return;
        menuCounts.set(menuId, (menuCounts.get(menuId) || 0) + 1);
      });

      const menuIds = Array.from(menuCounts.keys());

      if (menuIds.length === 0) {
        setShoppingList([]);
        setListStatus("ready");
        return;
      }

      const menus = await Promise.all(
        menuIds.map(async (id) => {
          try {
            const data = await getMenu(id);
            return { id, data };
          } catch (err) {
            console.error("No se pudo obtener el menú", id, err);
            return null;
          }
        })
      );

      const recipes = menus
        .filter((entry) => entry?.data)
        .flatMap(({ id, data }) => {
          const repeat = menuCounts.get(id) || 1;
          const menuItems = (data.items || []).map(normalizeMenuItem).filter(Boolean);
          if (repeat <= 1) return menuItems;
          return Array.from({ length: repeat }, () => menuItems).flat();
        });

      const recipeCache = new Map();
      const ingredientMap = new Map();

      for (const recipe of recipes) {
        const cacheKey = `${recipe.origin}:${recipe.id}`;
        if (!recipeCache.has(cacheKey)) {
          try {
            const details =
              recipe.origin === "own" ? await getOwnRecipe(recipe.id) : await fetchRecipe(recipe.id);
            recipeCache.set(cacheKey, details || null);
          } catch (err) {
            console.error("No se pudo obtener la receta", recipe.id, err);
            recipeCache.set(cacheKey, null);
          }
        }

        const details = recipeCache.get(cacheKey);
        const ingredients = extractIngredients(details);

        ingredients.forEach((ing) => {
          const nameKey = ing.name?.toLowerCase().trim();
          if (!nameKey) return;

          const key = `${nameKey}|${(ing.unit || "").toLowerCase().trim()}`;
          const existing = ingredientMap.get(key);
          const quantity = Number.isFinite(ing.quantity) ? ing.quantity : null;

          ingredientMap.set(key, {
            key,
            name: ing.name,
            unit: ing.unit,
            label: ing.label || ing.name,
            totalQuantity:
              quantity !== null
                ? (Number.isFinite(existing?.totalQuantity) ? existing.totalQuantity : 0) + quantity
                : existing?.totalQuantity ?? null,
            count: (existing?.count ?? 0) + 1,
          });
        });
      }

      setShoppingList(Array.from(ingredientMap.values()));
      setListStatus("ready");
    } catch (err) {
      console.error("Error generando la lista de compra", err);
      setListError("No se pudo generar la lista de compra");
      setListStatus("error");
    }
  }

  const totals = useMemo(() => {
    if (!plan) return null;
    return {
      calorias: Math.round(
        plan.totals?.calorias_total ??
          (plan.menus || []).reduce(
            (acc, d) => acc + Number(d.menu?.totals?.calorias_total ?? d.menu?.calorias_total ?? 0),
            0
          )
      ),
      proteinas: Math.round(
        plan.totals?.proteinas_total ??
          (plan.menus || []).reduce(
            (acc, d) => acc + Number(d.menu?.totals?.proteinas_total ?? d.menu?.proteinas_total ?? 0),
            0
          )
      ),
      carbohidratos: Math.round(
        plan.totals?.carbohidratos_total ??
          (plan.menus || []).reduce(
            (acc, d) => acc + Number(d.menu?.totals?.carbohidratos_total ?? d.menu?.carbohidratos_total ?? 0),
            0
          )
      ),
      grasas: Math.round(
        plan.totals?.grasas_total ??
          (plan.menus || []).reduce(
            (acc, d) => acc + Number(d.menu?.totals?.grasas_total ?? d.menu?.grasas_total ?? 0),
            0
          )
      ),
    };
  }, [plan]);

  if (!plan) return null;

  const formatQuantity = (item) => {
    if (Number.isFinite(item.totalQuantity)) {
      const formatted = Number.isInteger(item.totalQuantity)
        ? item.totalQuantity
        : Number(item.totalQuantity.toFixed(2));
      return `${formatted}${item.unit ? ` ${item.unit}` : ""}`;
    }

    return `x${item.count}`;
  };

  const generatePdf = () => {
    if (!shoppingList.length) return;

    const opened = window.open("", "_blank", "width=900,height=1200");
    if (!opened) return;

    const createdAt = new Date().toLocaleString("es-ES");
    const title = `Lista de la compra - ${plan.nombre}`;
    const listItems = shoppingList
      .map(
        (item) => `
        <li style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #ddd;padding:8px 0;">
          <span style="font-weight:600;">${item.label}</span>
          <span>${formatQuantity(item)}</span>
        </li>
      `
      )
      .join("\n");

    opened.document.open();
    opened.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin-bottom: 4px; }
            .subtitle { color: #555; margin-top: 0; }
            ul { list-style: none; padding: 0; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">Generado el ${createdAt}</p>
          <ul>
            ${listItems}
          </ul>
        </body>
      </html>
    `);
    opened.document.close();
    opened.focus();
    opened.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="menu-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Plan semanal</p>
            <h2>{plan.nombre}</h2>
            <p className="page-subtitle">{plan.menus?.length || 0} menús asignados</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {totals && (
          <div className="menu-totals-box">
            <div>
              <p className="eyebrow">Calorías semanales</p>
              <h3>{totals.calorias} kcal</h3>
            </div>
            <div className="macro-line">
              <span>{totals.proteinas}P</span>
              <span>{totals.carbohidratos}C</span>
              <span>{totals.grasas}G</span>
            </div>
          </div>
        )}

        <div className="plan-shopping-actions">
          <div>
            <p className="eyebrow">Lista de la compra</p>
            <p className="profile-sub">
              Genera un resumen con los ingredientes de todas las recetas del plan semanal.
            </p>
          </div>
          <div className="shopping-actions-buttons">
            <button
              className="btn-secondary"
              onClick={generatePdf}
              disabled={shoppingList.length === 0}
            >
              Descargar PDF
            </button>
            <button
              className="btn-primary"
              onClick={buildShoppingList}
              disabled={listStatus === "loading" || (plan.menus || []).length === 0}
            >
              {listStatus === "loading" ? "Generando..." : "Generar lista"}
            </button>
          </div>
        </div>

        {listError && <p className="form-note is-error">{listError}</p>}

        {listStatus === "ready" && shoppingList.length === 0 && (
          <div className="empty-card">No se encontraron ingredientes.</div>
        )}

        {shoppingList.length > 0 && (
          <div className="shopping-list-box">
            <div className="shopping-list-head">
              <div>
                <p className="eyebrow">Lista de ingredientes</p>
                <h4>Todos los menús del plan</h4>
              </div>
              <span className="tag">{shoppingList.length} ingredientes</span>
            </div>
            <ul className="shopping-list-grid">
              {shoppingList.map((item) => (
                <li key={item.key || item.label} className="shopping-list-item">
                  <span>{item.label}</span>
                  <span className="tag subtle">{formatQuantity(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="weekly-days-grid">
          {(plan.menus || []).map((day) => (
            <div key={day.day} className="weekly-day-card">
              <div className="weekly-day-head">
                <span className="tag">{DAYS[day.day]}</span>
                <h4>{day.menu?.nombre || "Sin menú"}</h4>
              </div>
              <div className="macro-line">
                <span>{Math.round(day.menu?.calorias_total ?? 0)} kcal</span>
                <span>{Math.round(day.menu?.proteinas_total ?? 0)}P</span>
                <span>{Math.round(day.menu?.carbohidratos_total ?? 0)}C</span>
                <span>{Math.round(day.menu?.grasas_total ?? 0)}G</span>
              </div>
              <button className="btn-secondary" onClick={() => setMenuToView(day.menu?.id)}>
                Ver menú
              </button>
            </div>
          ))}
        </div>
      </div>

      {menuToView && (
        <MenuDetailModal menuId={menuToView} onClose={() => setMenuToView(null)} />
      )}
    </div>
  );
}
