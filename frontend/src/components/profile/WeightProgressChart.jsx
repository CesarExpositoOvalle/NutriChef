import { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";

import "chartjs-adapter-date-fns";
import { es } from "date-fns/locale";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

export default function WeightProgressChart({ history }) {
  const [range, setRange] = useState("month");

  const filtered = useMemo(() => {
    if (!Array.isArray(history)) return [];

    const now = new Date();

    return history.filter((entry) => {
      const date = new Date(entry.fecha);
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);

      if (range === "week") return diffDays <= 7;
      if (range === "month") return diffDays <= 30;
      if (range === "year") return diffDays <= 365;

      return true;
    });
  }, [range, history]);

  const data = {
    labels: filtered.map((e) => new Date(e.fecha)),
    datasets: [
      {
        label: "Peso (kg)",
        data: filtered.map((e) => e.peso_kg),
        borderColor: "#4C6EF5",
        backgroundColor: "rgba(76, 110, 245, 0.3)",
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: {
          unit: range === "year" ? "month" : "day",
        },
        adapters: {
          date: { locale: es },
        },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="profile-card" style={{ minHeight: "350px" }}>
      <div className="chart-header">
        <h3>Progreso de peso</h3>

        <div className="chart-filters">
          <button
            className={range === "week" ? "active" : ""}
            onClick={() => setRange("week")}
          >
            7 días
          </button>
          <button
            className={range === "month" ? "active" : ""}
            onClick={() => setRange("month")}
          >
            30 días
          </button>
          <button
            className={range === "year" ? "active" : ""}
            onClick={() => setRange("year")}
          >
            1 año
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p>No hay suficientes datos para mostrar el gráfico.</p>
      ) : (
        <div style={{ width: "100%", height: "280px" }}>
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
}
