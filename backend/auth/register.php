<?php
require_once "../auth/session.php";
require_once "../config/database.php";

$raw = file_get_contents("php://input");
$input = json_decode($raw, true);

if (!$input) {
    echo json_encode(["success" => false, "message" => "Datos inválidos"]);
    exit();
}

$nombre = trim($input["nombre"] ?? "");
$email  = trim($input["email"] ?? "");
$pass   = $input["password"] ?? "";
$pass2  = $input["password2"] ?? "";

/* Validaciones */
if ($nombre === "" || $email === "" || $pass === "" || $pass2 === "") {
    echo json_encode(["success" => false, "message" => "Todos los campos son obligatorios"]);
    exit();
}

if ($pass !== $pass2) {
    echo json_encode(["success" => false, "message" => "Las contraseñas no coinciden"]);
    exit();
}

/* Email duplicado */
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Ya existe una cuenta con este correo"]);
    exit();
}
$stmt->close();

/* Crear usuario */
$hash = password_hash($pass, PASSWORD_DEFAULT);

$stmt = $conn->prepare("
    INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol, requiere_cambio_password)
    VALUES (?, ?, ?, 'usuario', 0)
");
$stmt->bind_param("sss", $nombre, $email, $hash);
$stmt->execute();
$userId = $stmt->insert_id;
$stmt->close();

/* Login automático */
$_SESSION["user_id"] = $userId;
$_SESSION["user_name"] = $nombre;
$_SESSION["user_email"] = $email;
$_SESSION["user_role"] = "usuario";

echo json_encode([
    "success" => true,
    "message" => "Registrado correctamente",
    "user" => [
        "id" => $userId,
        "nombre" => $nombre,
        "email" => $email,
        "avatar" => null,
        "rol" => "usuario",
        "requirePasswordChange" => false
    ]
]);
