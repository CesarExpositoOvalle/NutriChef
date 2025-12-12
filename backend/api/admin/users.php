<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"]) || ($_SESSION["user_role"] ?? "usuario") !== "admin") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Acceso restringido a administradores",
    ]);
    exit();
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

switch ($method) {
    case "GET":
        $query = "SELECT id, nombre_usuario, correo, rol, edad, altura_cm, peso_kg, actividad, objetivo, genero, avatar_url, fecha_registro, requiere_cambio_password FROM usuarios ORDER BY fecha_registro DESC";
        $result = $conn->query($query);

        $users = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row["requiere_cambio_password"] = (bool)$row["requiere_cambio_password"];
                $users[] = $row;
            }
        }

        echo json_encode([
            "success" => true,
            "users" => $users,
        ]);
        break;

    case "PUT":
        $input = json_decode(file_get_contents("php://input"), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Datos inválidos"]);
            break;
        }

        $userId = intval($input["id"] ?? 0);
        $name = trim($input["nombre_usuario"] ?? "");
        $email = trim($input["correo"] ?? "");
        $role = $input["rol"] ?? "usuario";

        if ($userId <= 0 || $name === "" || $email === "") {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
            break;
        }

        $allowedRoles = ["usuario", "admin"];
        if (!in_array($role, $allowedRoles, true)) $role = "usuario";

        $edad = isset($input["edad"]) && $input["edad"] !== "" ? intval($input["edad"]) : null;
        $altura = isset($input["altura_cm"]) && $input["altura_cm"] !== "" ? intval($input["altura_cm"]) : null;
        $peso = isset($input["peso_kg"]) && $input["peso_kg"] !== "" ? floatval($input["peso_kg"]) : null;

        $actividades = ["sedentario", "ligero", "moderado", "intenso", "muy_intenso"];
        $objetivos = ["bajar_peso", "mantener", "ganar_musculo"];
        $generos = ["male", "female"];

        $actividad = isset($input["actividad"]) && in_array($input["actividad"], $actividades, true) ? $input["actividad"] : null;
        $objetivo = isset($input["objetivo"]) && in_array($input["objetivo"], $objetivos, true) ? $input["objetivo"] : null;
        $genero = isset($input["genero"]) && in_array($input["genero"], $generos, true) ? $input["genero"] : null;

        $exists = $conn->prepare("SELECT id FROM usuarios WHERE id = ?");
        $exists->bind_param("i", $userId);
        $exists->execute();
        $found = $exists->get_result()->fetch_assoc();
        $exists->close();

        if (!$found) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
            break;
        }

        $dup = $conn->prepare("SELECT id FROM usuarios WHERE correo = ? AND id != ?");
        $dup->bind_param("si", $email, $userId);
        $dup->execute();
        $dup->store_result();
        if ($dup->num_rows > 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "El correo ya está en uso"]);
            $dup->close();
            break;
        }
        $dup->close();

        $stmt = $conn->prepare("UPDATE usuarios SET nombre_usuario = ?, correo = ?, rol = ?, edad = ?, altura_cm = ?, peso_kg = ?, actividad = ?, objetivo = ?, genero = ? WHERE id = ?");
        $stmt->bind_param(
            "sssiidsssi",
            $name,
            $email,
            $role,
            $edad,
            $altura,
            $peso,
            $actividad,
            $objetivo,
            $genero,
            $userId
        );

        $ok = $stmt->execute();
        $stmt->close();

        if (!$ok) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "No se pudo actualizar el usuario"]);
            break;
        }

        echo json_encode([
            "success" => true,
            "message" => "Usuario actualizado",
            "user" => [
                "id" => $userId,
                "nombre_usuario" => $name,
                "correo" => $email,
                "rol" => $role,
                "edad" => $edad,
                "altura_cm" => $altura,
                "peso_kg" => $peso,
                "actividad" => $actividad,
                "objetivo" => $objetivo,
                "genero" => $genero,
            ]
        ]);
        break;

    case "DELETE":
        $input = json_decode(file_get_contents("php://input"), true);
        $userId = isset($_GET["id"]) ? intval($_GET["id"]) : intval($input["id"] ?? 0);

        if ($userId <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID inválido"]);
            break;
        }

        if ($userId === ($_SESSION["user_id"] ?? 0)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "No puedes eliminar tu propia cuenta"]);
            break;
        }

        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $ok = $stmt->execute();
        $stmt->close();

        if (!$ok) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "No se pudo eliminar el usuario"]);
            break;
        }

        echo json_encode(["success" => true, "message" => "Usuario eliminado"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}
