<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

// Solo usuarios logueados
if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autorizado"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) $input = $_POST;

$userId = $_SESSION["user_id"];

// Datos recibidos
$edad       = intval($input["edad"] ?? 0);
$altura     = intval($input["altura_cm"] ?? 0);
$peso       = floatval($input["peso_kg"] ?? 0);
$actividad  = $input["actividad"] ?? "";
$objetivo   = $input["objetivo"] ?? "";
$genero     = $input["genero"] ?? "male";

if ($edad <= 0 || $altura <= 0 || $peso <= 0 || !$actividad || !$objetivo) {
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos"]);
    exit();
}

/* --------------------------------------------------------------------------
   1. Calcular BMR (Mifflin-St Jeor)
-------------------------------------------------------------------------- */
if ($genero === "male") {
    $bmr = 10 * $peso + 6.25 * $altura - 5 * $edad + 5;
} else {
    $bmr = 10 * $peso + 6.25 * $altura - 5 * $edad - 161;
}

/* --------------------------------------------------------------------------
   2. Factor actividad
-------------------------------------------------------------------------- */
$factores = [
    "sedentario"   => 1.2,
    "ligero"       => 1.375,
    "moderado"     => 1.55,
    "intenso"      => 1.725,
    "muy_intenso"  => 1.9
];

$factorActividad = $factores[$actividad] ?? 1.55;

$tdee = round($bmr * $factorActividad);

/* --------------------------------------------------------------------------
   3. Calorías según objetivo
-------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   4. Calcular macronutrientes
-------------------------------------------------------------------------- */
$proteinas_g = round($peso * 2.2); // 2.2g / kg
$grasas_g = round(($calObjetivo * 0.30) / 9);
$carbs_g  = round(($calObjetivo - ($proteinas_g * 4) - ($grasas_g * 9)) / 4);

/* --------------------------------------------------------------------------
   5. Guardar en la base de datos
-------------------------------------------------------------------------- */
$stmt = $conn->prepare("
    UPDATE usuarios SET 
        edad = ?, 
        altura_cm = ?, 
        peso_kg = ?, 
        actividad = ?, 
        objetivo = ?, 
        genero = ?,
        calorias_diarias = ?, 
        proteinas_diarias = ?, 
        grasas_diarias = ?, 
        carbohidratos_diarias = ?
    WHERE id = ?
");

$stmt->bind_param(
    "iidsssiiiii",
    $edad,            
    $altura,          
    $peso,           
    $actividad,      
    $objetivo,        
    $genero,         
    $calObjetivo,    
    $proteinas_g,     
    $grasas_g,         
    $carbs_g,        
    $userId           
);


if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "Error guardando los datos"]);
    exit();
}

/* --------------------------------------------------------------------------
   6. Registrar peso en historial (solo si cambia)
-------------------------------------------------------------------------- */
$hist = $conn->prepare("SELECT peso_kg FROM peso_historial WHERE id_usuario = ? ORDER BY fecha DESC LIMIT 1");
$hist->bind_param("i", $userId);
$hist->execute();
$res = $hist->get_result()->fetch_assoc();

if (!$res || floatval($res["peso_kg"]) !== $peso) {
    $ins = $conn->prepare("INSERT INTO peso_historial (id_usuario, peso_kg) VALUES (?, ?)");
    $ins->bind_param("id", $userId, $peso);
    $ins->execute();
}

/* --------------------------------------------------------------------------
   7. Respuesta al frontend
-------------------------------------------------------------------------- */
echo json_encode([
    "success" => true,
    "message" => "Perfil actualizado",
    "calculos" => [
        "bmr" => $bmr,
        "tdee" => $tdee,
        "calorias_objetivo" => $calObjetivo,
        "macros" => [
            "proteinas_g" => $proteinas_g,
            "grasas_g" => $grasas_g,
            "carbohidratos_g" => $carbs_g
        ]
    ]
]);
