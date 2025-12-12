<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$userId = $_SESSION["user_id"];

$input = $_POST;
if (empty($input)) {
    $json = json_decode(file_get_contents("php://input"), true);
    if ($json) $input = $json;
}

$name = trim($input["nombre"] ?? "");
$email = trim($input["email"] ?? "");
$currentPassword = $input["current_password"] ?? "";
$newPassword = $input["new_password"] ?? "";

if ($email !== "") {
    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ? AND id != ?");
    $stmt->bind_param("si", $email, $userId);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Ya existe otra cuenta con este correo"]);
        exit();
    }
    $stmt->close();
}

$current = $conn->prepare("SELECT nombre_usuario, correo, contrasena, avatar_url, rol, requiere_cambio_password FROM usuarios WHERE id = ?");
$current->bind_param("i", $userId);
$current->execute();
$user = $current->get_result()->fetch_assoc();
$current->close();

if (!$user) {
    echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
    exit();
}

$newAvatar = $user["avatar_url"];
$requireChange = $user["requiere_cambio_password"] ?? 0;

if (!empty($_FILES["avatar"]) && $_FILES["avatar"]["error"] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . "/../../uploads/avatars/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $file = $_FILES["avatar"];
    $ext = pathinfo($file["name"], PATHINFO_EXTENSION);
    $filename = "avatar_" . $userId . "_" . time() . ($ext ? "." . $ext : "");
    $filepath = $uploadDir . $filename;
    move_uploaded_file($file["tmp_name"], $filepath);
    $newAvatar = "avatars/" . $filename;
}

$changePassword = false;
$passwordHash = $user["contrasena"];

if ($newPassword !== "") {
    if ($currentPassword === "" || !password_verify($currentPassword, $user["contrasena"])) {
        echo json_encode(["success" => false, "message" => "Contraseña actual incorrecta"]);
        exit();
    }
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $changePassword = true;
    $requireChange = 0;
}

$finalName = $name !== "" ? $name : $user["nombre_usuario"];
$finalEmail = $email !== "" ? $email : $user["correo"];

$stmt = $conn->prepare("UPDATE usuarios SET nombre_usuario = ?, correo = ?, contrasena = ?, avatar_url = ?, requiere_cambio_password = ? WHERE id = ?");
$stmt->bind_param("ssssii", $finalName, $finalEmail, $passwordHash, $newAvatar, $requireChange, $userId);
$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
    echo json_encode(["success" => false, "message" => "No se pudo actualizar la cuenta"]);
    exit();
}

$_SESSION["user_name"] = $finalName;
$_SESSION["user_email"] = $finalEmail;

unset($user["contrasena"]);

echo json_encode([
    "success" => true,
    "user" => [
        "id" => $userId,
        "nombre" => $finalName,
        "email" => $finalEmail,
        "avatar" => $newAvatar,
        "rol" => $user["rol"] ?? "usuario",
        "requirePasswordChange" => (bool)$requireChange
    ],
]);
