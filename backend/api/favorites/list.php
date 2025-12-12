<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$userId = $_SESSION["user_id"];

$stmt = $conn->prepare("
    SELECT id_usuario, id_receta, origen FROM favoritos WHERE id_usuario = ?
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$favs = [];

while ($row = $result->fetch_assoc()) {
    $favs[] = $row;
}

echo json_encode(["favorites" => $favs]);
