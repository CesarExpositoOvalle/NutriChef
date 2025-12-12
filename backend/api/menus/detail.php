<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

$id = intval($_GET["id"] ?? 0);
if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "ID inválido"]);
    exit();
}

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$userId = $_SESSION["user_id"];

$stmt = $conn->prepare("SELECT * FROM menus WHERE id = ? AND id_usuario = ?");
$stmt->bind_param("ii", $id, $userId);
$stmt->execute();
$menu = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$menu) {
    echo json_encode(["success" => false, "message" => "Menú no encontrado"]);
    exit();
}

$itemStmt = $conn->prepare("SELECT * FROM menu_recetas WHERE id_menu = ? ORDER BY id");
$itemStmt->bind_param("i", $id);
$itemStmt->execute();
$res = $itemStmt->get_result();

$items = [];
while ($row = $res->fetch_assoc()) {
    $items[] = $row;
}
$itemStmt->close();

$menu["items"] = $items;

echo json_encode([
    "success" => true,
    "menu" => $menu,
]);
