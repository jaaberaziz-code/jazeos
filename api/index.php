<?php

/**
 * Vercel PHP Runtime Entry Point for JazeOS
 * 
 * This file bootstraps Laravel within Vercel's serverless PHP runtime.
 * It handles:
 * 1. Serving static assets from /public
 * 2. Routing all other requests through Laravel's index.php
 */

// Serve static files if they exist
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if ($uri !== '/' && file_exists(__DIR__ . '/../public' . $uri)) {
    return false;
}

// Bootstrap Laravel
require __DIR__ . '/../public/index.php';
