<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$userId = $_SESSION["user_id"];
$id = $_POST["id"] ?? null;
$origin = $_POST["origin"] ?? "spoonacular";
$origin = in_array($origin, ["own", "spoonacular"], true) ? $origin : "spoonacular";

$id = is_numeric($id) ? (int) $id : null;

if (!$id) {
    echo json_encode(["error" => "Missing id"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT 1 FROM favoritos WHERE id_usuario = ? AND id_receta = ? AND origen = ?
");
$stmt->bind_param("iis", $userId, $id, $origin);
$stmt->execute();
$exists = $stmt->get_result()->num_rows > 0;

if ($exists) {
    $stmt = $conn->prepare("DELETE FROM favoritos WHERE id_usuario = ? AND id_receta = ? AND origen = ?");
    $stmt->bind_param("iis", $userId, $id, $origin);
    $stmt->execute();

    echo json_encode(["favorite" => false, "id" => $id, "origin" => $origin]);
} else {
    $stmt = $conn->prepare("
        INSERT INTO favoritos (id_usuario, id_receta, origen)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("iis", $userId, $id, $origin);
    $stmt->execute();

    echo json_encode(["favorite" => true, "id" => $id, "origin" => $origin]);
}
