<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$userId = $_SESSION["user_id"];

$name = $_POST["name"] ?? "Menu del día";
$recipes = json_decode($_POST["recipes"] ?? "[]", true);

$stmt = $conn->prepare("
    INSERT INTO menus_diarios (id_usuario, nombre)
    VALUES (?, ?)
");
$stmt->bind_param("is", $userId, $name);
$stmt->execute();

$menuId = $conn->insert_id;

foreach ($recipes as $r) {
    $stmt = $conn->prepare("
        INSERT INTO menus_recetas (id_menu, id_receta, origen)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("iis", $menuId, $r["id"], $r["origen"]);
    $stmt->execute();
}

echo json_encode(["success" => true, "id" => $menuId]);
