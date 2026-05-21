<?php

declare(strict_types=1);

use App\Mcp\JazeOsServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/jazeos', JazeOsServer::class)
    ->middleware('auth.agent')
    ->name('mcp.jazeos');
