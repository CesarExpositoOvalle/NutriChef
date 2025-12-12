<?php
require_once "../../auth/session.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "No autenticado"]);
    exit();
}

$userId = $_SESSION["user_id"];

$stmt = $conn->prepare("SELECT * FROM planes_semanales WHERE id_usuario = ? ORDER BY fecha_creacion DESC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

$plans = [];
while ($row = $res->fetch_assoc()) {
    $plans[] = $row;
}
$stmt->close();

if (count($plans) === 0) {
    echo json_encode(["success" => true, "plans" => []]);
    exit();
}

$ids = array_column($plans, "id");
$placeholders = implode(",", array_fill(0, count($ids), "?"));
$types = str_repeat("i", count($ids));

$mapStmt = $conn->prepare("SELECT * FROM plan_menus WHERE id_plan IN ($placeholders) ORDER BY dia_index");
$bind = [$types];
foreach ($ids as $i => $val) {
    $ids[$i] = intval($val);
    $bind[] = &$ids[$i];
}
call_user_func_array([$mapStmt, 'bind_param'], $bind);
$mapStmt->execute();
$mapRes = $mapStmt->get_result();

$byPlan = [];
while ($row = $mapRes->fetch_assoc()) {
    $byPlan[$row["id_plan"]][] = $row;
}
$mapStmt->close();

$menuIds = [];
foreach ($byPlan as $entries) {
    foreach ($entries as $entry) {
        $menuIds[] = intval($entry["id_menu"]);
    }
}
$menuIds = array_unique($menuIds);

$menuSummaries = [];
if (count($menuIds) > 0) {
    $menuPlaceholders = implode(",", array_fill(0, count($menuIds), "?"));
    $menuTypes = str_repeat("i", count($menuIds));
    $menuStmt = $conn->prepare("SELECT * FROM menus WHERE id IN ($menuPlaceholders)");
    $menuBind = [$menuTypes];
    foreach ($menuIds as $i => $val) {
        $menuIds[$i] = intval($val);
        $menuBind[] = &$menuIds[$i];
    }
    call_user_func_array([$menuStmt, 'bind_param'], $menuBind);
    $menuStmt->execute();
    $menuRes = $menuStmt->get_result();
    while ($row = $menuRes->fetch_assoc()) {
        $menuSummaries[$row["id"]] = $row;
    }
    $menuStmt->close();
}

foreach ($plans as &$plan) {
    $entries = $byPlan[$plan["id"]] ?? [];
    $plan["menus"] = [];
    $totals = ["calorias_total" => 0, "proteinas_total" => 0, "carbohidratos_total" => 0, "grasas_total" => 0];

    foreach ($entries as $entry) {
        $menu = $menuSummaries[$entry["id_menu"]] ?? null;
        if ($menu) {
            $plan["menus"][] = [
                "day" => intval($entry["dia_index"]),
                "menu" => $menu,
            ];
            $totals["calorias_total"] += intval($menu["calorias_total"]);
            $totals["proteinas_total"] += floatval($menu["proteinas_total"]);
            $totals["carbohidratos_total"] += floatval($menu["carbohidratos_total"]);
            $totals["grasas_total"] += floatval($menu["grasas_total"]);
        }
    }

    $plan["totals"] = $totals;
}

unset($plan);

echo json_encode(["success" => true, "plans" => $plans]);
