<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

$id = $_GET["id"] ?? null;

if (!$id) {
    echo json_encode(["success" => false, "error" => "Missing id"]);
    exit;
}

$stmt = $conn->prepare("SELECT * FROM recetas WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();
$recipe = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$recipe) {
    echo json_encode(["success" => false, "error" => "Recipe not found"]);
    exit;
}

$q = "
SELECT i.nombre, ri.cantidad
FROM receta_ingredientes ri
JOIN ingredientes i ON ri.id_ingrediente = i.id
WHERE ri.id_receta = ?
";
$stmt = $conn->prepare($q);
$stmt->bind_param("i", $id);
$stmt->execute();
$ingredients = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$q = "
SELECT numero_paso AS paso, descripcion
FROM receta_pasos
WHERE id_receta=?
ORDER BY numero_paso ASC
";
$stmt = $conn->prepare($q);
$stmt->bind_param("i", $id);
$stmt->execute();
$steps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode([
    "success" => true,
    "recipe" => $recipe,
    "ingredients" => $ingredients,
    "steps" => $steps
]);
