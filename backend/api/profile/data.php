<?php
// /var/www/html/api/profile/data.php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "No autenticado"
    ]);
    exit();
}

$userId = $_SESSION["user_id"];

$stmt = $conn->prepare("
    SELECT 
        id,
        nombre_usuario,
        correo,
        edad,
        altura_cm,
        peso_kg,
        actividad,
        objetivo,
        genero,
        avatar_url,
        rol,
        requiere_cambio_password,
        calorias_diarias,
        proteinas_diarias,
        grasas_diarias,
        carbohidratos_diarias
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

$user["requiere_cambio_password"] = (bool)($user["requiere_cambio_password"] ?? false);


$edad   = $user["edad"];
$peso   = $user["peso_kg"];
$altura = $user["altura_cm"];
$genero = $user["genero"]; 
$actividad = $user["actividad"] ?: "moderado";
$objetivo  = $user["objetivo"] ?: "mantener";

$bmr = null;
$tdee = null;
$caloriasObjetivo = null;
$macros = null;

if ($edad !== null && $peso !== null && $altura !== null) {
    if ($genero === "female") {
        $bmr = 10 * $peso + 6.25 * $altura - 5 * $edad - 161;
    } else {
        $bmr = 10 * $peso + 6.25 * $altura - 5 * $edad + 5;
    }

    $factores = [
        "sedentario"   => 1.2,
        "ligero"       => 1.375,
        "moderado"     => 1.55,
        "intenso"      => 1.725,
        "muy_intenso"  => 1.9
    ];

    $factor = isset($factores[$actividad]) ? $factores[$actividad] : 1.55;

    $tdee = $bmr * $factor;

    switch ($objetivo) {
        case "bajar_peso":
            $caloriasObjetivo = $tdee * 0.8;   
            break;
        case "ganar_musculo":
            $caloriasObjetivo = $tdee * 1.15;  
            break;
        default:
            $caloriasObjetivo = $tdee;         
            break;
    }

    $tdee = round($tdee);
    $caloriasObjetivo = round($caloriasObjetivo);

    
    if ($caloriasObjetivo > 0) {
        $proteinas_g = round(1.8 * $peso);
        $proteinas_kcal = $proteinas_g * 4;

        $grasas_kcal = $caloriasObjetivo * 0.25;
        $grasas_g = round($grasas_kcal / 9);

        $carbos_kcal = $caloriasObjetivo - $proteinas_kcal - $grasas_kcal;
        if ($carbos_kcal < 0) $carbos_kcal = 0;
        $carbos_g = round($carbos_kcal / 4);

        $macros = [
            "proteinas_g"     => $proteinas_g,
            "grasas_g"        => $grasas_g,
            "carbohidratos_g" => $carbos_g
        ];
    }
}

echo json_encode([
    "success" => true,
    "user" => $user,
    "calculos" => [
        "bmr"                => $bmr !== null ? round($bmr) : null,
        "tdee"               => $tdee,
        "calorias_objetivo"  => $caloriasObjetivo,
        "actividad"          => $actividad,
        "objetivo"           => $objetivo,
        "macros"             => $macros
    ]
]);
