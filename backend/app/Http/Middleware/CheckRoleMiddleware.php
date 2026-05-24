<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                "message" => "Token not provided"
            ], 401);
        }

        $user = User::where("login_tokens", $token)->first();

        if (!$user) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                "message" => "Unauthorized. Required role: " . implode(', ', $roles)
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                "message" => "Account is inactive"
            ], 403);
        }

        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }
}
