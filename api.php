<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// غيّر كلمة المرور قبل النشر
$ADMIN_PASSWORD = 'Abeer2050*';
$DATA_FILE = __DIR__ . '/data/data.json';

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function readData($file) {
    if (!file_exists($file)) return ['settings' => new stdClass(), 'products' => []];
    $data = json_decode(file_get_contents($file), true);
    return $data ?: ['settings' => new stdClass(), 'products' => []];
}
function isAdmin() {
    return isset($_SESSION['abeer_admin']) && $_SESSION['abeer_admin'] === true;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'data':
        respond(readData($DATA_FILE));
        break;
    case 'login':
        if ($method !== 'POST') respond(['error' => 'method'], 405);
        $body = json_decode(file_get_contents('php://input'), true);
        if (($body['password'] ?? '') === $ADMIN_PASSWORD) {
            $_SESSION['abeer_admin'] = true;
            respond(['ok' => true]);
        }
        respond(['ok' => false, 'error' => 'كلمة المرور غير صحيحة'], 401);
        break;
    case 'status':
        respond(['admin' => isAdmin()]);
        break;
    case 'logout':
        $_SESSION = []; session_destroy(); respond(['ok' => true]);
        break;
    case 'save':
        if ($method !== 'POST') respond(['error' => 'method'], 405);
        if (!isAdmin()) respond(['error' => 'unauthorized'], 401);
        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body) || !isset($body['products'], $body['settings'])) respond(['error' => 'بيانات غير صالحة'], 400);
        $tmp = $DATA_FILE . '.tmp';
        if (file_put_contents($tmp, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)) === false)
            respond(['error' => 'تعذّر الحفظ'], 500);
        rename($tmp, $DATA_FILE);
        respond(['ok' => true]);
        break;
    case 'upload':
        if ($method !== 'POST') respond(['error' => 'method'], 405);
        if (!isAdmin()) respond(['error' => 'unauthorized'], 401);
        if (empty($_FILES['image'])) respond(['error' => 'لم يتم اختيار صورة'], 400);
        $file = $_FILES['image'];
        if ($file['error'] !== UPLOAD_ERR_OK) respond(['error' => 'فشل رفع الملف'], 400);
        if ($file['size'] > 6 * 1024 * 1024) respond(['error' => 'حجم الصورة أكبر من 6MB'], 400);
        $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']); finfo_close($finfo);
        if (!isset($allowed[$mime])) respond(['error' => 'نوع غير مدعوم (jpg/png/webp/gif)'], 400);
        $dir = __DIR__ . '/assets/uploads';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $name = 'img_' . date('Ymd_His') . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $allowed[$mime];
        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) respond(['error' => 'تعذّر حفظ الصورة'], 500);
        respond(['ok' => true, 'url' => 'assets/uploads/' . $name]);
        break;
    default:
        respond(['error' => 'إجراء غير معروف'], 404);
}
