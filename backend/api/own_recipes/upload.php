<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$uploadDir = __DIR__ . "/../uploads/";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

if (!isset($_FILES["file"])) {
    echo json_encode(["error" => "No se recibió ningún archivo"]);
    exit;
}

$file = $_FILES["file"];
$ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));

$allowed = ["jpg", "jpeg", "png", "gif", "webp"];

if (!in_array($ext, $allowed)) {
    echo json_encode(["error" => "Formato no permitido"]);
    exit;
}

$filename = uniqid("rec_") . "." . $ext;
$filepath = $uploadDir . $filename;

if (!move_uploaded_file($file["tmp_name"], $filepath)) {
    echo json_encode(["error" => "No se pudo guardar el archivo"]);
    exit;
}

$publicUrl = "http://localhost:8000/uploads/" . $filename;

echo json_encode([
    "ok" => true,
    "url" => $publicUrl
]);
