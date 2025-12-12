<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

$id = intval($_POST["id"] ?? 0);

if (!$id) {
    echo json_encode(["deleted" => false]);
    exit;
}

$conn->query("DELETE FROM receta_ingredientes WHERE id_receta=$id");
$conn->query("DELETE FROM receta_pasos WHERE id_receta=$id");
$conn->query("DELETE FROM recetas WHERE id=$id");

echo json_encode(["deleted" => true]);
