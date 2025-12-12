<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "No autenticado."
    ]);
    exit;
}

$userId = $_SESSION["user_id"];

$sql = "
    SELECT id, titulo, descripcion, imagen_url,
           calorias, proteinas, carbohidratos, grasas
    FROM recetas
    WHERE fuente = 'usuario' AND id_usuario = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

$recipes = [];

while ($row = $res->fetch_assoc()) {

    if (!empty($row["imagen_url"])) {
        $row["imagen_url"] = "http://localhost:8000/uploads/" . $row["imagen_url"];
    }

    $recipes[] = [
        "id"            => (int)$row["id"],
        "titulo"        => $row["titulo"],
        "descripcion"   => $row["descripcion"],
        "imagen_url"    => $row["imagen_url"],
        "calorias"      => (int)$row["calorias"],
        "proteinas"     => (float)$row["proteinas"],
        "carbohidratos" => (float)$row["carbohidratos"],
        "grasas"        => (float)$row["grasas"]
    ];
}

echo json_encode([
    "success" => true,
    "recipes" => $recipes
]);
