import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MacrosDonutChart({ macros }) {
  if (!macros) return null;

  const data = {
    labels: ["Proteínas", "Grasas", "Carbohidratos"],
    datasets: [
      {
        data: [
          macros.proteinas_g,
          macros.grasas_g,
          macros.carbohidratos_g,
        ],
        backgroundColor: ["#ff3b30", "#ffcc00", "#007bff"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    cutout: "60%", // donut gap
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ width: "280px", height: "280px", margin: "auto" }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
