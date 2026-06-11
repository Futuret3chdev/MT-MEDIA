<?php
header('Content-Type: application/json');

if (!isset($_GET['url'])) {
    echo json_encode(['success' => false, 'error' => 'No URL provided']);
    exit;
}

$url = filter_var($_GET['url'], FILTER_VALIDATE_URL);
if (!$url) {
    echo json_encode(['success' => false, 'error' => 'Invalid URL']);
    exit;
}

try {
    $html = file_get_contents($url);
    $doc = new DOMDocument();
    @$doc->loadHTML($html); // Suppress warnings for malformed HTML
    $metas = $doc->getElementsByTagName('meta');

    $preview = [
        'title' => '',
        'description' => '',
        'image' => ''
    ];

    foreach ($metas as $meta) {
        if ($meta->getAttribute('property') === 'og:title') {
            $preview['title'] = $meta->getAttribute('content');
        } elseif ($meta->getAttribute('property') === 'og:description') {
            $preview['description'] = $meta->getAttribute('content');
        } elseif ($meta->getAttribute('property') === 'og:image') {
            $preview['image'] = $meta->getAttribute('content');
        }
    }

    if (!$preview['title']) {
        $titles = $doc->getElementsByTagName('title');
        if ($titles->length > 0) {
            $preview['title'] = $titles->item(0)->textContent;
        }
    }

    echo json_encode(['success' => true, 'preview' => $preview]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to fetch preview: ' . $e->getMessage()]);
}
?>