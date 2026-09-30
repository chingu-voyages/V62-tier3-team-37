<?php

use App\Http\Middleware\EnsureEmailIsVerified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

require __DIR__.'/auth.php';

Route::get('/test-verified', function (Request $request) {
    return response()->json([
        'message' => 'You have access.',
        'email' => $request->user()->email,
    ]);
})->middleware([
    'auth:sanctum',
    EnsureEmailIsVerified::class,
]);
