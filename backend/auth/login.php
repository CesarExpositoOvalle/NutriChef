<?php
require_once "../auth/session.php";
require_once "../config/database.php";

header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents("php://input"), true);


if (!$input || !is_array($input)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Solicitud inválida"]);
    exit();
}

$email = trim($input["email"] ?? "");
$password = $input["password"] ?? "";

if ($email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Todos los campos son obligatorios"
    ]);
    exit();
}

$stmt = $conn->prepare("
    SELECT id, nombre_usuario, correo, contrasena, avatar_url, rol, requiere_cambio_password
    FROM usuarios
    WHERE correo = ?
");
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "El correo no corresponde a ninguna cuenta"
    ]);
    exit();
}

if (!password_verify($password, $user["contrasena"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "La contraseña es incorrecta"
    ]);
    exit();
}

$_SESSION["user_id"] = $user["id"];
$_SESSION["user_email"] = $user["correo"];
$_SESSION["user_name"] = $user["nombre_usuario"];
$_SESSION["user_role"] = $user["rol"] ?? "usuario";

$payload = [
    "id" => $user["id"],
    "nombre" => $user["nombre_usuario"],
    "email" => $user["correo"],
    "avatar" => $user["avatar_url"] ?? null,
    "rol" => $user["rol"] ?? "usuario",
    "requirePasswordChange" => (bool)($user["requiere_cambio_password"] ?? false),
];

echo json_encode([
    "success" => true,
    "message" => "Inicio de sesión correcto",
    "user" => $payload
]);
