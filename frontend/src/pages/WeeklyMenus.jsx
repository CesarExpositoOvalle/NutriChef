import { useEffect, useMemo, useState } from "react";
import { createWeeklyPlan, listMenus, listWeeklyPlans } from "../api/menus";
import MenuDetailModal from "../components/menus/MenuDetailModal";
import WeeklyPlanModal from "../components/menus/WeeklyPlanModal";
import "../styles/pages/Menus.css";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function WeeklyMenus() {
  const [menus, setMenus] = useState([]);
  const [weeklyPlans, setWeeklyPlans] = useState([]);

  const [planName, setPlanName] = useState("Plan semanal");
  const [weekSelection, setWeekSelection] = useState(Array(7).fill(""));
  const [planMessage, setPlanMessage] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedMenus = useMemo(
    () => weekSelection.map((id) => menus.find((m) => String(m.id) === String(id))),
    [menus, weekSelection]
  );

  const favoriteMenus = useMemo(
    () => menus.filter((m) => m.favorite || m.is_favorite || m.es_favorito),
    [menus]
  );

  useEffect(() => {
    async function load() {
      const [savedMenus, plans] = await Promise.all([listMenus(), listWeeklyPlans()]);
      setMenus(savedMenus || []);
      setWeeklyPlans(plans || []);
    }
    load();
  }, []);

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

  function handleAssignMenu(menuId) {
    setWeekSelection((prev) => prev.map((val, i) => (i === activeDay ? String(menuId) : val)));
    setPlanMessage(null);
  }

  async function handleCreatePlan() {
    if (weekSelection.some((v) => !v)) {
      setPlanMessage("Completa los 7 menús");
      return;
    }

    const res = await createWeeklyPlan({
      name: planName || "Plan semanal",
      menuIds: weekSelection.map((v) => Number(v)),
    });

    if (!res.success) {
      setPlanMessage(res.message || "No se pudo guardar el plan");
      return;
    }

    setPlanMessage("Plan guardado");
    setWeekSelection(Array(7).fill(""));
    setPlanName("Plan semanal");

    const plans = await listWeeklyPlans();
    setWeeklyPlans(plans || []);
    setShowCreateModal(false);
  }

  return (
    <div className="menus-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Planifica la semana</p>
          <h1 className="page-title">Menús semanales</h1>
          <p className="page-subtitle">Reutiliza tus menús diarios para cada día de la semana.</p>
        </div>
      </div>

      <div className="menu-card-grid">
        <button
          className="create-card menu-create-card"
          onClick={() => {
            setPlanMessage(null);
            setShowCreateModal(true);
          }}
        >
          <div className="plus">+</div>
          Crear plan semanal
        </button>

        {weeklyPlans.map((plan) => (
          <button key={plan.id} className="plan-card" onClick={() => setSelectedPlan(plan)}>
            <div className="plan-card-head">
              <h4>{plan.nombre}</h4>
              <span className="tag">{plan.menus?.length || 0} menús</span>
            </div>
            <div className="plan-card-days">
              {(plan.menus || []).slice(0, 4).map((day) => (
                <span key={day.day} className="plan-card-day">
                  {DAYS[day.day]?.slice(0, 3)}
                </span>
              ))}
              {(plan.menus || []).length > 4 && <span className="profile-sub">+{(plan.menus || []).length - 4} más</span>}
            </div>
            <div className="menu-card-macros">
              <span>{plan.totals?.calorias_total || 0} kcal</span>
              <span>{Math.round(plan.totals?.proteinas_total || 0)}P</span>
              <span>{Math.round(plan.totals?.carbohidratos_total || 0)}C</span>
              <span>{Math.round(plan.totals?.grasas_total || 0)}G</span>
            </div>
          </button>
        ))}

        {weeklyPlans.length === 0 && <div className="empty-card">Aún no hay planes</div>}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="menu-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Plan semanal</p>
                <h2>Elige un menú por día</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            {planMessage && <p className="form-note">{planMessage}</p>}

            <div className="plan-designer">
              <div className="plan-days-column">
                {DAYS.map((day, idx) => {
                  const menu = selectedMenus[idx];
                  const totals = menuTotals(menu || {});
                  return (
                    <button
                      key={day}
                      className={`plan-day-row ${activeDay === idx ? "is-active" : ""}`}
                      onClick={() => setActiveDay(idx)}
                    >
                      <div>
                        <p className="eyebrow">{day}</p>
                        <h4>{menu?.nombre || "Sin menú"}</h4>
                        <div className="macro-line">
                          <span>{Math.round(totals.calories || 0)} kcal</span>
                          <span>{Math.round(totals.protein || 0)}P</span>
                          <span>{Math.round(totals.carbs || 0)}C</span>
                          <span>{Math.round(totals.fats || 0)}G</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="plan-menu-selector">
                <div className="selector-head">
                  <div>
                    <p className="eyebrow">Menús disponibles</p>
                    <h4>Asigna a {DAYS[activeDay]}</h4>
                  </div>
                  <p className="profile-sub">Propios y favoritos</p>
                </div>

                <div className="menus-list plan-select-list">
                  {menus.length === 0 && <div className="empty-card">Crea un menú para comenzar.</div>}
                  {menus.map((menu) => {
                    const totals = menuTotals(menu);
                    return (
                      <div key={menu.id} className="menu-tile">
                        <div className="menu-meta">
                          <h4>{menu.nombre}</h4>
                          {menu.descripcion && <p className="profile-sub">{menu.descripcion}</p>}
                          <div className="macro-line">
                            <span>{Math.round(totals.calories)} kcal</span>
                            <span>{Math.round(totals.protein)}P</span>
                            <span>{Math.round(totals.carbs)}C</span>
                            <span>{Math.round(totals.fats)}G</span>
                          </div>
                        </div>
                        <div className="menu-tile-actions">
                          <button className="btn-secondary" onClick={() => handleAssignMenu(menu.id)}>
                            Usar en {DAYS[activeDay]}
                          </button>
                          <button className="text-btn" onClick={() => setSelectedMenuId(menu.id)}>
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {favoriteMenus.length > 0 && (
                    <div className="favorite-menus-note">
                      <p className="eyebrow">Favoritos</p>
                      <div className="plan-favorite-grid">
                        {favoriteMenus.map((menu) => (
                          <button
                            key={`fav-${menu.id}`}
                            className="plan-favorite-pill"
                            onClick={() => handleAssignMenu(menu.id)}
                          >
                            ⭐ {menu.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Nombre del plan"
              />
              <div className="modal-actions-buttons">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleCreatePlan} disabled={menus.length === 0}>
                  Guardar plan semanal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMenuId && (
        <MenuDetailModal menuId={selectedMenuId} onClose={() => setSelectedMenuId(null)} />
      )}

      {selectedPlan && <WeeklyPlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </div>
  );
}
