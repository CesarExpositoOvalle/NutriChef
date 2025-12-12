<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autorizado"]);
    exit();
}

$userId = $_SESSION["user_id"];

$title       = trim($_POST["title"] ?? "");
$description = trim($_POST["description"] ?? "");

$ingredients = json_decode($_POST["ingredients"] ?? "[]", true);
$steps       = json_decode($_POST["steps"] ?? "[]", true);

$kcal     = intval($_POST["kcal"] ?? $_POST["calories"] ?? 0);
$protein  = floatval($_POST["protein"] ?? 0);
$carbs    = floatval($_POST["carbs"] ?? 0);
$fats     = floatval($_POST["fats"] ?? 0);
$timePrep = intval($_POST["time"] ?? 0);

if (!$title) {
    echo json_encode(["success" => false, "error" => "El título es obligatorio"]);
    exit;
}

$imageUrl = null;

if (!empty($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {

    $uploadDir = __DIR__ . "/../../uploads/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $file = $_FILES["image"];
    $filename = time() . "_" . basename($file["name"]);
    $filepath = $uploadDir . $filename;

    move_uploaded_file($file["tmp_name"], $filepath);

    $imageUrl = $filename;
}

$stmt = $conn->prepare("
    INSERT INTO recetas
    (titulo, descripcion, imagen_url, calorias, proteinas, carbohidratos, grasas, tiempo_preparacion, fuente, id_usuario)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usuario', ?)
");

$stmt->bind_param(
    "sssiddiii",
    $title,
    $description,
    $imageUrl,
    $kcal,
    $protein,
    $carbs,
    $fats,
    $timePrep,
    $userId
);

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "error" => "Error DB", "details" => $stmt->error]);
    exit;
}

$recipeId = $stmt->insert_id;
$stmt->close();



foreach ($ingredients as $ing) {

    $name   = trim($ing["nombre"]   ?? "");
    $amount = trim($ing["cantidad"] ?? "");

    
    if ($name === "" || $amount === "") continue;

    $stmt = $conn->prepare("SELECT id FROM ingredientes WHERE nombre=?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        $stmt2 = $conn->prepare("INSERT INTO ingredientes (nombre) VALUES (?)");
        $stmt2->bind_param("s", $name);
        $stmt2->execute();
        $id_ingrediente = $stmt2->insert_id;
        $stmt2->close();
    } else {
        $row = $res->fetch_assoc();
        $id_ingrediente = $row["id"];
    }

    $stmt3 = $conn->prepare("
        INSERT INTO receta_ingredientes (id_receta, id_ingrediente, cantidad)
        VALUES (?, ?, ?)
    ");
    $stmt3->bind_param("iis", $recipeId, $id_ingrediente, $amount);
    $stmt3->execute();
    $stmt3->close();
}



$stepNum = 1;

foreach ($steps as $step) {

    $text = trim($step);
    if ($text === "") continue;

    $stmt = $conn->prepare("
        INSERT INTO receta_pasos (id_receta, numero_paso, descripcion)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("iis", $recipeId, $stepNum, $text);
    $stmt->execute();
    $stmt->close();

    $stepNum++;
}

echo json_encode(["success" => true, "id" => $recipeId]);
