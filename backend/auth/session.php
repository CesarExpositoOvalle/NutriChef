<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * CORS GLOBAL 
 */
$allowedOrigins = [
    getenv("ALLOWED_ORIGIN") ?: "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
];

$origin = $allowedOrigins[0];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    $origin = $_SERVER['HTTP_ORIGIN'];
}

header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$public = [
    "/auth/login.php",
    "/auth/register.php",
    "/auth/logout.php",
];

$uri = $_SERVER['REQUEST_URI'];

$isPublic = false;
foreach ($public as $path) {
    if (str_ends_with($uri, $path)) {
        $isPublic = true;
        break; 
    }
}

if (!$isPublic && !isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "No autenticado",
    ]);
    exit();
}
