<?php
// backend/config/database.php

$host = getenv("MYSQL_HOST") ?: "db";
$user = getenv("MYSQL_USER") ?: "root";
$pass = getenv("MYSQL_PASSWORD") ?: "root";
$name = getenv("MYSQL_DATABASE") ?: "recetas_web";

$conn = new mysqli($host, $user, $pass, $name);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos.",
        "error" => $conn->connect_error
    ]);
    exit();
}
