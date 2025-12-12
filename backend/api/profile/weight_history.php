<?php
// /var/www/html/api/profile/wheight_history.php

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
    SELECT peso_kg, fecha
    FROM peso_historial
    WHERE id_usuario = ?
    ORDER BY fecha ASC
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

$history = [];
while ($row = $res->fetch_assoc()) {
    $history[] = $row;
}
$stmt->close();

echo json_encode([
    "success" => true,
    "history" => $history
]);
