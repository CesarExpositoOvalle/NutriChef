<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "error" => "No autorizado"]);
    exit;
}

$id = intval($_POST["id"] ?? 0);
if (!$id) {
    echo json_encode(["success" => false, "error" => "Missing id"]);
    exit;
}

$title = trim($_POST["title"] ?? "");
$description = trim($_POST["description"] ?? "");
$kcal = intval($_POST["kcal"] ?? 0);
$protein = floatval($_POST["protein"] ?? 0);
$carbs = floatval($_POST["carbs"] ?? 0);
$fats = floatval($_POST["fats"] ?? 0);
$timePrep = intval($_POST["time"] ?? 0);

$ingredients = json_decode($_POST["ingredients"] ?? "[]", true);
$steps = json_decode($_POST["steps"] ?? "[]", true);

$imageUrl = null;
if (!empty($_FILES["image"]["name"]) && $_FILES["image"]["error"] === 0) {
    $uploadDir = __DIR__ . "/../../uploads/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $filename = time() . "_" . basename($_FILES["image"]["name"]);
    move_uploaded_file($_FILES["image"]["tmp_name"], $uploadDir . $filename);
    $imageUrl = $filename;
}

$q = "
UPDATE recetas SET titulo=?, descripcion=?, calorias=?, proteinas=?, carbohidratos=?, grasas=?, tiempo_preparacion=?
";

if ($imageUrl) $q .= ", imagen_url=?";
$q .= " WHERE id=?";

$stmt = $conn->prepare($q);

if ($imageUrl) {
    $stmt->bind_param("ssiddiiis",
        $title, $description, $kcal, $protein, $carbs, $fats, $timePrep, $imageUrl, $id
    );
} else {
    $stmt->bind_param("ssiddiii",
        $title, $description, $kcal, $protein, $carbs, $fats, $timePrep, $id
    );
}

$stmt->execute();
$stmt->close();

$conn->query("DELETE FROM receta_ingredientes WHERE id_receta=$id");
$conn->query("DELETE FROM receta_pasos WHERE id_receta=$id");

foreach ($ingredients as $ing) {
    $name = trim($ing["nombre"] ?? "");
    $amount = trim($ing["cantidad"] ?? "");
    if (!$name || !$amount) continue;

    $stmt = $conn->prepare("SELECT id FROM ingredientes WHERE nombre=?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        $stmt2 = $conn->prepare("INSERT INTO ingredientes (nombre) VALUES (?)");
        $stmt2->bind_param("s", $name);
        $stmt2->execute();
        $id_ing = $stmt2->insert_id;
        $stmt2->close();
    } else {
        $id_ing = $res->fetch_assoc()["id"];
    }

    $stmt3 = $conn->prepare("
        INSERT INTO receta_ingredientes (id_receta, id_ingrediente, cantidad)
        VALUES (?, ?, ?)
    ");
    $stmt3->bind_param("iis", $id, $id_ing, $amount);
    $stmt3->execute();
    $stmt3->close();
}

$stepNum = 1;
foreach ($steps as $step) {
    $step = trim($step);
    if (!$step) continue;

    $stmt = $conn->prepare("
        INSERT INTO receta_pasos (id_receta, numero_paso, descripcion)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("iis", $id, $stepNum, $step);
    $stmt->execute();
    $stmt->close();

    $stepNum++;
}

echo json_encode(["success" => true]);
