<?php

use App\Console\Commands\ServeCommand;
use App\Exceptions\AppointmentSlotUnavailableException;
use App\Exceptions\AppointmentStateException;
use App\Http\Middleware\EnsureHcpIsVerified;
use App\Http\Middleware\RedirectIfAuthenticatedToJson;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'guest' => RedirectIfAuthenticatedToJson::class,
            'hcp.verified' => EnsureHcpIsVerified::class,
        ]);
    })
    ->withCommands([
        ServeCommand::class,
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(
            fn (AppointmentSlotUnavailableException $exception) => response()->json([
                'message' => $exception->getMessage(),
            ], 409)
        );
        $exceptions->render(
            fn (AppointmentStateException $exception) => response()->json([
                'message' => $exception->getMessage(),
            ], 409)
        );
    })->create();
