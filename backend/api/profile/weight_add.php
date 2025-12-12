<?php
// /var/www/html/api/profile/weight_add.php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$userId = $_SESSION["user_id"];

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) $input = $_POST;

$peso_kg = isset($input["peso_kg"]) ? floatval($input["peso_kg"]) : 0;

if ($peso_kg <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Peso no válido"
    ]);
    exit();
}

$stmt = $conn->prepare("
    SELECT edad, altura_cm, genero, actividad, objetivo
    FROM usuarios
    WHERE id = ?
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
    exit();
}

$edad      = intval($user["edad"] ?? 0);
$altura    = intval($user["altura_cm"] ?? 0);
$genero    = $user["genero"] ?? "male";
$actividad = $user["actividad"] ?? "moderado";
$objetivo  = $user["objetivo"] ?? "mantener";


if ($genero === "female") {
    $bmr = 10 * $peso_kg + 6.25 * $altura - 5 * $edad - 161;
} else {
    $bmr = 10 * $peso_kg + 6.25 * $altura - 5 * $edad + 5;
}

$factores = [
    "sedentario"   => 1.2,
    "ligero"       => 1.375,
    "moderado"     => 1.55,
    "intenso"      => 1.725,
    "muy_intenso"  => 1.9,
];

$factor = $factores[$actividad] ?? 1.55;

$tdee = round($bmr * $factor);

switch ($objetivo) {
    case "bajar_peso":
        $calObjetivo = $tdee - 400;
        break;
    case "ganar_musculo":
        $calObjetivo = $tdee + 300;
        break;
    default:
        $calObjetivo = $tdee;
        break;
}
$calObjetivo = max(1200, $calObjetivo);

$proteinas_g = round($peso_kg * 2.2);
$grasas_g    = round(($calObjetivo * 0.30) / 9);
$carbs_g     = round(($calObjetivo - ($proteinas_g * 4) - ($grasas_g * 9)) / 4);

$stmt = $conn->prepare("
    UPDATE usuarios SET
        peso_kg = ?,
        calorias_diarias = ?,
        proteinas_diarias = ?,
        grasas_diarias = ?,
        carbohidratos_diarias = ?
    WHERE id = ?
");
$stmt->bind_param(
    "diiiis",
    $peso_kg,
    $calObjetivo,
    $proteinas_g,
    $grasas_g,
    $carbs_g,
    $userId
);
$stmt->execute();
$stmt->close();

$stmt = $conn->prepare("
    INSERT INTO peso_historial (id_usuario, peso_kg)
    VALUES (?, ?)
");
$stmt->bind_param("id", $userId, $peso_kg);
$stmt->execute();
$stmt->close();

echo json_encode([
    "success" => true,
    "message" => "Peso registrado",
    "peso_kg" => $peso_kg,
    "calculos" => [
        "bmr"               => round($bmr),
        "tdee"              => $tdee,
        "calorias_objetivo" => $calObjetivo,
        "macros" => [
            "proteinas_g"     => $proteinas_g,
            "grasas_g"        => $grasas_g,
            "carbohidratos_g" => $carbs_g
        ]
    ]
]);
