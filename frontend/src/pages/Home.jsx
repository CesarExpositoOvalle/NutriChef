// src/pages/Home.jsx
import { Link } from "react-router-dom";
import "../styles/pages/Home.css";

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div>
          <p className="eyebrow">Bienvenido a Nutrichef</p>
          <h1>Tu asistente personal para comer rico y equilibrado</h1>
          <p className="subtitle">
            Busca recetas, crea tus platos, guarda favoritos y controla tu progreso
            nutricional.
          </p>
          <div className="home-cta">
            <Link className="btn-primary" to="/dishes">Explorar recetas</Link>
            <Link className="btn-secondary" to="/profile">Ver mi perfil</Link>
          </div>
          <div className="home-badges">
            <span>🍳 500k+ recetas Spoonacular</span>
            <span>📈 Seguimiento de peso</span>
            <span>⭐ Favoritos y recetas propias</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="stat">
            <p className="label">Calorías objetivo</p>
            <p className="value">2,100 kcal</p>
          </div>
          <div className="stat-grid">
            <div>
              <p className="label">Proteínas</p>
              <p className="value">140 g</p>
            </div>
            <div>
              <p className="label">Carbohidratos</p>
              <p className="value">230 g</p>
            </div>
            <div>
              <p className="label">Grasas</p>
              <p className="value">60 g</p>
            </div>
          </div>
          <p className="hero-note">Personaliza tus objetivos desde el perfil.</p>
        </div>
      </section>

      <section className="home-grid">
        <div className="info-card">
          <h3>Explora</h3>
          <p>Encuentra inspiración con miles de recetas de Spoonacular filtradas por tus gustos.</p>
        </div>
        <div className="info-card">
          <h3>Crea</h3>
          <p>Diseña tus propias recetas, edítalas cuando quieras y controla sus macros.</p>
        </div>
        <div className="info-card">
          <h3>Controla</h3>
          <p>Registra tu peso, revisa tus progresos y mantén la motivación.</p>
        </div>
      </section>
    </div>
  );
}
