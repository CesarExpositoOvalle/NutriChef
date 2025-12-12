<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$raw = file_get_contents("php://input");
$input = json_decode($raw, true);

if (!$input) {
    echo json_encode(["success" => false, "message" => "Datos inválidos"]);
    exit();
}

$userId = $_SESSION["user_id"];
$name = trim($input["name"] ?? "");
$description = trim($input["description"] ?? "");
$items = $input["items"] ?? [];

if ($name === "") {
    echo json_encode(["success" => false, "message" => "El menú necesita un nombre"]);
    exit();
}

if (!is_array($items) || count($items) < 2 || count($items) > 6) {
    echo json_encode(["success" => false, "message" => "El menú debe tener entre 2 y 6 recetas"]);
    exit();
}

$totalCalories = 0;
$totalProtein = 0;
$totalCarbs = 0;
$totalFats = 0;

$cleanItems = [];

foreach ($items as $it) {
    $recipeId = isset($it["id"]) ? intval($it["id"]) : null;
    $origin = $it["origin"] === "own" ? "own" : "spoonacular";
    $label = trim($it["label"] ?? "");
    $title = trim($it["title"] ?? "");
    $image = trim($it["image"] ?? "");

    $cal = round(floatval($it["macros"]["calories"] ?? 0));
    $pro = round(floatval($it["macros"]["protein"] ?? 0), 2);
    $car = round(floatval($it["macros"]["carbs"] ?? 0), 2);
    $fat = round(floatval($it["macros"]["fats"] ?? 0), 2);

    if (!$recipeId || $title === "") continue;

    $totalCalories += $cal;
    $totalProtein += $pro;
    $totalCarbs += $car;
    $totalFats += $fat;

    $cleanItems[] = [
        "id" => $recipeId,
        "origin" => $origin,
        "label" => $label ?: null,
        "title" => $title,
        "image" => $image ?: null,
        "calories" => $cal,
        "protein" => $pro,
        "carbs" => $car,
        "fats" => $fat,
    ];
}

if (count($cleanItems) < 2) {
    echo json_encode(["success" => false, "message" => "Faltan recetas válidas"]);
    exit();
}

$stmt = $conn->prepare("INSERT INTO menus (id_usuario, nombre, descripcion, calorias_total, proteinas_total, carbohidratos_total, grasas_total) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("issiddd", $userId, $name, $description, $totalCalories, $totalProtein, $totalCarbs, $totalFats);

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "No se pudo guardar el menú"]);
    exit();
}

$menuId = $stmt->insert_id;
$stmt->close();

$itemStmt = $conn->prepare("INSERT INTO menu_recetas (id_menu, receta_id, origen, etiqueta, titulo, imagen_url, calorias, proteinas, carbohidratos, grasas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

foreach ($cleanItems as $it) {
    $itemStmt->bind_param(
        "iissssdddd",
        $menuId,
        $it["id"],
        $it["origin"],
        $it["label"],
        $it["title"],
        $it["image"],
        $it["calories"],
        $it["protein"],
        $it["carbs"],
        $it["fats"]
    );
    $itemStmt->execute();
}

$itemStmt->close();

echo json_encode([
    "success" => true,
    "id" => $menuId,
]);
