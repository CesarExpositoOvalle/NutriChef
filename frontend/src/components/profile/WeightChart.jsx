import { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function WeightChart({ history }) {
  const [range, setRange] = useState("month");

  if (!history || history.length === 0)
    return <p>No hay suficientes datos para mostrar el gráfico.</p>;

  const filtered = useMemo(() => {
    const now = new Date();

    return history.filter((item) => {
      const date = new Date(item.fecha);

      if (range === "week") {
        const diff = (now - date) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (range === "month") {
        const diff = (now - date) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      }
      if (range === "year") {
        const diff = (now - date) / (1000 * 60 * 60 * 24);
        return diff <= 365;
      }

      return true;
    });
  }, [history, range]);

  const data = {
    labels: filtered.map((h) =>
      new Date(h.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Peso (kg)",
        data: filtered.map((h) => h.peso_kg),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.3)",
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: "#007bff",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setRange("week")}
          className={range === "week" ? "btn-primary" : "btn-secondary"}
        >
          Semana
        </button>

        <button
          onClick={() => setRange("month")}
          className={range === "month" ? "btn-primary" : "btn-secondary"}
        >
          Mes
        </button>

        <button
          onClick={() => setRange("year")}
          className={range === "year" ? "btn-primary" : "btn-secondary"}
        >
          Año
        </button>
      </div>

      <Line data={data} options={options} />
    </div>
  );
}
