<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(["success" => false, "message" => "Datos inválidos"]);
    exit();
}

$name = trim($input["name"] ?? "Plan semanal");
$menuIds = $input["menuIds"] ?? [];

if (!is_array($menuIds) || count($menuIds) !== 7) {
    echo json_encode(["success" => false, "message" => "El plan debe tener 7 menús"]);
    exit();
}

$userId = $_SESSION["user_id"];

$uniqueMenus = array_values(array_unique(array_map("intval", $menuIds)));
$placeholders = implode(",", array_fill(0, count($uniqueMenus), "?"));
$types = str_repeat("i", count($uniqueMenus));

$check = $conn->prepare("SELECT id FROM menus WHERE id IN ($placeholders) AND id_usuario = ?");
$typesWithUser = $types . "i";
$params = array_merge($uniqueMenus, [$userId]);
$check->bind_param($typesWithUser, ...$params);
$check->execute();
$res = $check->get_result();
if ($res->num_rows !== count($uniqueMenus)) {
    echo json_encode(["success" => false, "message" => "Incluye únicamente menús tuyos"]);
    exit();
}
$check->close();

$stmt = $conn->prepare("INSERT INTO planes_semanales (id_usuario, nombre) VALUES (?, ?)");
$stmt->bind_param("is", $userId, $name);
$stmt->execute();
$planId = $stmt->insert_id;
$stmt->close();

$insert = $conn->prepare("INSERT INTO plan_menus (id_plan, dia_index, id_menu) VALUES (?, ?, ?)");

for ($i = 0; $i < 7; $i++) {
    $menuId = intval($menuIds[$i]);
    $insert->bind_param("iii", $planId, $i, $menuId);
    $insert->execute();
}

$insert->close();

echo json_encode(["success" => true, "id" => $planId]);
