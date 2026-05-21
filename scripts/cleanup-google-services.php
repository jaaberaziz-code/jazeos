<?php
// Cleanup unused Google API services to reduce deployment size
$srcDir = dirname(__DIR__) . '/vendor/google/apiclient-services/src';
if (!is_dir($srcDir)) {
    echo "Google services dir not found, skipping cleanup.\n";
    return;
}

$keep = ['Gmail', 'Oauth2'];
$dirs = glob($srcDir . '/*', GLOB_ONLYDIR);
$removed = 0;

foreach ($dirs as $dir) {
    $name = basename($dir);
    if (!in_array($name, $keep, true)) {
        // Remove all files in the directory first
        $files = glob($dir . '/*');
        foreach ($files as $file) {
            unlink($file);
        }
        rmdir($dir);
        $removed++;
    }
}

echo "Google services cleanup: removed {$removed} unused services, kept: " . implode(', ', $keep) . "\n";
