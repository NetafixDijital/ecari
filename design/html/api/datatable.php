<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowed = [
    'fatura-satis',
    'fatura-alis',
    'fatura-rapor-satis',
    'fatura-rapor-alis',
    'irsaliye-satis',
    'irsaliye-alis',
    'irsaliye-rapor-satis',
    'irsaliye-rapor-alis',
    'cari-liste',
    'cari-hareketler',
    'stok-liste',
    'servis-liste',
    'gorev-liste',
    'masraf-liste',
    'dashboard-faturalar',
];

$table = preg_replace('/[^a-z0-9\-]/', '', $_GET['table'] ?? '');
if (!in_array($table, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz tablo']);
    exit;
}

$path = dirname(__DIR__) . '/assets/json/tables/' . $table . '.json';
if (!is_file($path)) {
    http_response_code(404);
    echo json_encode(['error' => 'Veri bulunamadı']);
    exit;
}

$payload = json_decode((string) file_get_contents($path), true);
$allRows = $payload['data'] ?? [];
if (!is_array($allRows)) {
    $allRows = [];
}

$draw = (int) ($_GET['draw'] ?? 1);
$start = max(0, (int) ($_GET['start'] ?? 0));
$length = (int) ($_GET['length'] ?? 10);
$search = trim((string) ($_GET['search']['value'] ?? ''));
$statusFilter = trim((string) ($_GET['status_filter'] ?? ''));

$rows = $allRows;

if ($statusFilter !== '' && $statusFilter !== 'all') {
    $rows = array_values(array_filter($rows, static function ($row) use ($statusFilter) {
        return isset($row['status']) && (string) $row['status'] === $statusFilter;
    }));
}

if ($search !== '') {
    $rows = array_values(array_filter($rows, static function ($row) use ($search) {
        foreach ($row as $value) {
            if (is_scalar($value) && stripos((string) $value, $search) !== false) {
                return true;
            }
        }
        return false;
    }));
}

$recordsTotal = count($allRows);
$recordsFiltered = count($rows);

$orderColIndex = (int) ($_GET['order'][0]['column'] ?? 0);
$orderDir = (($_GET['order'][0]['dir'] ?? 'asc') === 'desc') ? 'desc' : 'asc';
$colData = $_GET['columns'][$orderColIndex]['data'] ?? null;

if (is_string($colData) && $colData !== '' && $colData !== 'actions') {
    usort($rows, static function ($a, $b) use ($colData, $orderDir) {
        $left = $a[$colData] ?? '';
        $right = $b[$colData] ?? '';
        $cmp = strnatcasecmp((string) $left, (string) $right);
        return $orderDir === 'desc' ? -$cmp : $cmp;
    });
}

if ($length === -1) {
    $page = $rows;
} else {
    $page = array_slice($rows, $start, max(0, $length));
}

echo json_encode([
    'draw' => $draw,
    'recordsTotal' => $recordsTotal,
    'recordsFiltered' => $recordsFiltered,
    'data' => array_values($page),
], JSON_UNESCAPED_UNICODE);
