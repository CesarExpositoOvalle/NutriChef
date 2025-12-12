// src/components/ownrecipes/OwnRecipeFilters.jsx
import { useState } from "react";

export default function OwnRecipeFilters({ onChange }) {
  const [local, setLocal] = useState({
    minCalories: "",
    maxCalories: "",
    minProtein: "",
    sortBy: "alphabetical",
  });

  function update(field, value) {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    if (onChange) onChange(updated);
  }

  return (
    <div className="filters-bar">
      <div className="filters-row">
        <div className="filters-group">
          <label>Calorías mín.</label>
          <input
            type="number"
            className="input"
            value={local.minCalories}
            onChange={(e) => update("minCalories", e.target.value)}
            placeholder="Ej: 200"
          />
        </div>

        <div className="filters-group">
          <label>Calorías máx.</label>
          <input
            type="number"
            className="input"
            value={local.maxCalories}
            onChange={(e) => update("maxCalories", e.target.value)}
            placeholder="Ej: 800"
          />
        </div>

        <div className="filters-group">
          <label>Proteínas mín. (g)</label>
          <input
            type="number"
            className="input"
            value={local.minProtein}
            onChange={(e) => update("minProtein", e.target.value)}
            placeholder="Ej: 20"
          />
        </div>

        <div className="filters-group">
          <label>Ordenar por</label>
          <select
            className="input"
            value={local.sortBy}
            onChange={(e) => update("sortBy", e.target.value)}
          >
            <option value="alphabetical">Alfabético (A-Z)</option>
            <option value="calories_asc">Calorías (asc)</option>
            <option value="calories_desc">Calorías (desc)</option>
            <option value="protein_desc">Proteínas (desc)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
