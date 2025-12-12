<?php
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

$apiKey = getenv("SPOONACULAR_API_KEY");

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(["error" => "Spoonacular API key is not configured"]);
    exit;
}

$query  = $_GET["query"]  ?? "";
$page   = intval($_GET["page"] ?? 1);
$number = intval($_GET["number"] ?? 24);

if ($page < 1) $page = 1;
if ($number < 1) $number = 8;
if ($number > 8) $number = 8; 

$offset = ($page - 1) * $number;

function extractMacrosFromNutrition($nutrition)
{
    $macros = [
        "calories" => 0,
        "protein" => 0,
        "fat" => 0,
        "carbs" => 0,
    ];

    if (!isset($nutrition["nutrients"]) || !is_array($nutrition["nutrients"])) {
        return $macros;
    }

    foreach ($nutrition["nutrients"] as $nutrient) {
        $label = $nutrient["name"] ?? $nutrient["title"] ?? null;
        if (!$label || !isset($nutrient["amount"])) {
            continue;
        }

        $name = strtolower($label);
        $amount = (float) $nutrient["amount"];

        if ($name === "calories") {
            $macros["calories"] = $amount;
        } elseif ($name === "protein") {
            $macros["protein"] = $amount;
        } elseif ($name === "fat") {
            $macros["fat"] = $amount;
        } elseif ($name === "carbohydrates" || $name === "carbohydrate" || $name === "net carbohydrates" || $name === "net carbs") {
            $macros["carbs"] = $amount;
        }
    }

    return $macros;
}

$url = "https://api.spoonacular.com/recipes/complexSearch?"
     . "apiKey=" . urlencode($apiKey)
     . "&query=" . urlencode($query)
     . "&number=$number"
     . "&offset=$offset"
     . "&addRecipeInformation=true"
     . "&includeNutrition=true"
     . "&instructionsRequired=true";

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error || !$response) {
    http_response_code(500);
    echo json_encode([
        "error" => "Failed to fetch data",
        "details" => $error ?: "Empty response"
    ]);
    exit;
}

if ($httpCode === 402 || $httpCode === 429) {
    http_response_code(200);
    echo json_encode([
        "success" => false,
        "message" => "Límite de Spoonacular alcanzado. Inténtalo más tarde.",
        "results" => [],
        "totalResults" => 0
    ]);
    exit;
}

if ($httpCode >= 400) {
    http_response_code($httpCode);
    echo json_encode([
        "error" => "Spoonacular API error",
        "status" => $httpCode
    ]);
    exit;
}

$data = json_decode($response, true);

if (!$data) {
    http_response_code(500);
    echo json_encode(["error" => "Invalid response from Spoonacular"]);
    exit;
}

if (isset($data["results"]) && is_array($data["results"])) {
    foreach ($data["results"] as &$recipe) {
        $recipe["computedMacros"] = extractMacrosFromNutrition($recipe["nutrition"] ?? []);
    }
}

echo json_encode($data);
