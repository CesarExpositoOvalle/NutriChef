<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$userId = $_SESSION["user_id"];

$stmt = $conn->prepare("SELECT * FROM menus WHERE id_usuario = ? ORDER BY fecha_creacion DESC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$menus = [];
while ($row = $result->fetch_assoc()) {
    $menus[] = $row;
}
$stmt->close();

if (count($menus) === 0) {
    echo json_encode(["success" => true, "menus" => []]);
    exit();
}

$ids = array_column($menus, "id");
$placeholders = implode(",", array_fill(0, count($ids), "?"));
$types = str_repeat("i", count($ids));

$itemStmt = $conn->prepare("SELECT * FROM menu_recetas WHERE id_menu IN ($placeholders) ORDER BY id");
$bind = [$types];
foreach ($ids as $i => $val) {
    $ids[$i] = intval($val);
    $bind[] = &$ids[$i];
}
call_user_func_array([$itemStmt, 'bind_param'], $bind);
$itemStmt->execute();
$itemRes = $itemStmt->get_result();

$itemsByMenu = [];
while ($row = $itemRes->fetch_assoc()) {
    $itemsByMenu[$row["id_menu"]][] = $row;
}
$itemStmt->close();

foreach ($menus as &$menu) {
    $items = $itemsByMenu[$menu["id"]] ?? [];
    $menu["items"] = $items;
}

unset($menu);

echo json_encode([
    "success" => true,
    "menus" => $menus,
]);
