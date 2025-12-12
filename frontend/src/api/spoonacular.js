// src/api/spoonacular.js

const BASE_URL = "http://localhost:8000/api/spoonacular";
const CACHE_EXPIRATION_HOURS = 24;

/* ================= CACHE ================= */

function isCacheValid(cacheTimestamp) {
  if (!cacheTimestamp) return false;
  const now = Date.now();
  return now - cacheTimestamp < CACHE_EXPIRATION_HOURS * 60 * 60 * 1000;
}

function saveCache(key, data) {
  localStorage.setItem(
    key,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    })
  );
}

function loadCache(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const parsed = JSON.parse(cached);
  if (!isCacheValid(parsed.timestamp)) return null;
  return parsed.data;
}


function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9,.-]+/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function normalizeMacros(source) {
  if (!source) return null;

  const fatValue =
    source.fats ?? source.fat ?? source.totalFat ?? source.fatContent;

  return {
    calories: Math.round(toNumber(source.calories)),
    protein: Math.round(toNumber(source.protein)),
    fats: Math.round(toNumber(fatValue)),
    carbs: Math.round(toNumber(source.carbs)),
  };
}

export function hasPositiveMacro(macros) {
  if (!macros) return false;

  return (
    (macros.calories || 0) > 0 ||
    (macros.protein || 0) > 0 ||
    (macros.fats || 0) > 0 ||
    (macros.carbs || 0) > 0
  );
}

export function getNutrientValue(nutrients, names) {
  const lowercaseNames = names.map((n) => n.toLowerCase());

  const nutrient = nutrients.find((n) => {
    const label = (n.name || n.title || "").toLowerCase();
    return lowercaseNames.includes(label);
  });

  if (!nutrient) return 0;
  return toNumber(nutrient.amount);
}

export function deriveMacrosFromNutrition(nutrition) {
  const nutrients = nutrition?.nutrients;
  if (!Array.isArray(nutrients)) return null;

  const calories = getNutrientValue(nutrients, ["calories"]);
  const protein = getNutrientValue(nutrients, ["protein"]);
  const fat = getNutrientValue(nutrients, ["fat"]);
  const carbs = getNutrientValue(nutrients, [
    "carbohydrates",
    "carbohydrate",
    "net carbohydrates",
    "net carbs",
    "carbs",
  ]);

  return normalizeMacros({ calories, protein, fat, carbs });
}

/* ================= API ================= */

export async function fetchRecipes(
  query = "",
  page = 1,
  number = 8,
  force = false
) {
  const cacheKey = `recipes_${query}_${page}_${number}`;

  if (!force) {
    const cached = loadCache(cacheKey);
    if (cached) return cached;
  }

  const url = `${BASE_URL}/list_recipes.php?query=${encodeURIComponent(
    query
  )}&page=${page}&number=${number}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.success === false) {
    const fallback = loadCache(cacheKey);
    if (fallback) return fallback;
    throw new Error(json.message || "Límite de Spoonacular alcanzado");
  }

  const formatted = {
    ...json,
    results: (json.results || []).map((r) => {
      const existing = normalizeMacros(r.macros);
      const computed = normalizeMacros(r.computedMacros);
      const derived = deriveMacrosFromNutrition(r.nutrition);

      return {
        ...r,
        macros:
          (hasPositiveMacro(existing) && existing) ||
          (hasPositiveMacro(computed) && computed) ||
          derived ||
          existing ||
          computed,
      };
    }),
  };

  saveCache(cacheKey, formatted);
  return formatted;
}

export async function fetchRecipe(id, force = false) {
  const cacheKey = `recipe_${id}`;

  if (!force) {
    const cached = loadCache(cacheKey);
    if (cached) return cached;
  }

  const url = `${BASE_URL}/get_recipe.php?id=${id}`;
  const res = await fetch(url);
  const json = await res.json();

  if (json.success === false) {
    const fallback = loadCache(cacheKey);
    if (fallback) return fallback;
    throw new Error(json.message || "Límite de Spoonacular alcanzado");
  }

  const existing = normalizeMacros(json.macros);
  const computed = normalizeMacros(json.computedMacros);
  const derived = deriveMacrosFromNutrition(json.nutrition);

  const formatted = {
    ...json,
    macros:
      (hasPositiveMacro(existing) && existing) ||
      (hasPositiveMacro(computed) && computed) ||
      derived ||
      existing ||
      computed,
  };

  saveCache(cacheKey, formatted);
  return formatted;
}
