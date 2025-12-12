<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

$id = $_GET["id"] ?? null;

if (!$id) {
    echo json_encode(["error" => "Missing id"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT r.*
    FROM menus_recetas mr
    LEFT JOIN own_recipes r ON (mr.origen = 'propia' AND r.id = mr.id_receta)
    WHERE mr.id_menu = ?
");
$stmt->bind_param("i", $id);
$stmt->execute();

$res = $stmt->get_result();

$recipes = [];
while ($row = $res->fetch_assoc()) {
    $recipes[] = $row;
}

echo json_encode($recipes);
