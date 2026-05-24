<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Society;
use App\Models\User;
use App\Models\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            "email" => "required|email",
            "password" => "required"
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                "message" => "Email or Password incorrect"
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                "message" => "Account is inactive"
            ], 401);
        }

        // Generate token
        $token = Str::random(60);

        $user->update([
            "login_tokens" => $token,
            "last_login_at" => now()
        ]);

        $responseData = [
            "user" => [
                "id" => $user->id,
                "email" => $user->email,
                "role" => $user->role,
            ],
            "token" => $token,
            "token_type" => "Bearer"
        ];

        switch ($user->role) {
            case 'admin':
                $admin = Admin::find($user->userable_id);
                if ($admin) {
                    $responseData['profile'] = [
                        "name" => $admin->name,
                        "email" => $admin->email
                    ];
                }
                break;

            case 'officer':
            case 'validator':
                $validator = Validator::with('regional')->where('user_id', $user->id)->first();
                if ($validator) {
                    $responseData['profile'] = [
                        "name" => $validator->name,
                        "employee_id" => $validator->employee_id,
                        "phone" => $validator->phone,
                        "role" => $validator->role,
                        "regional" => $validator->regional ? [
                            "id" => $validator->regional->id,
                            "province" => $validator->regional->province,
                            "district" => $validator->regional->district,
                        ] : null
                    ];
                }
                break;

            case 'society':
                $society = Society::with('regional')->find($user->userable_id);
                if ($society) {
                    $society->update([
                        "login_tokens" => $token
                    ]);

                    $responseData['profile'] = [
                        "id_card_number" => $society->id_card_number,
                        "name" => $society->name,
                        "born_date" => $society->born_date,
                        "gender" => $society->gender,
                        "address" => $society->address,
                        "regional" => $society->regional ? [
                            "id" => $society->regional->id,
                            "province" => $society->regional->province,
                            "district" => $society->regional->district,
                        ] : null
                    ];
                }
                break;
        }

        return response()->json([
            "message" => "Login successful",
            "data" => $responseData
        ], 200);
    }

    // Register khusus society
    public function registerSociety(Request $request)
    {
        $request->validate([
            "email" => "required|email|unique:users,email",
            "password" => "required|min:6",
            "id_card_number" => "required|size:8|unique:societies,id_card_number",
            "name" => "required|string|max:255",
            "born_date" => "required|date",
            "gender" => "required|in:male,female",
            "address" => "required|string",
            "regional_id" => "required|exists:regionals,id"
        ]);

        $society = Society::create([
            "id_card_number" => $request->id_card_number,
            "password" => Hash::make($request->password),
            "name" => $request->name,
            "born_date" => $request->born_date,
            "gender" => $request->gender,
            "address" => $request->address,
            "regional_id" => $request->regional_id,
            "login_tokens" => null
        ]);

        // Generate token
        $token = Str::random(60);

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'society',
            'userable_type' => 'App\Models\Society',
            'userable_id' => $society->id,
            'login_tokens' => $token,
            'last_login_at' => now(),
            'is_active' => true
        ]);

        $society->update([
            "login_tokens" => $token
        ]);

        return response()->json([
            "message" => "Registration successful",
            "data" => [
                "user" => [
                    "id" => $user->id,
                    "email" => $user->email,
                    "role" => "society",
                ],
                "profile" => [
                    "id_card_number" => $society->id_card_number,
                    "name" => $society->name,
                    "born_date" => $society->born_date,
                    "gender" => $society->gender,
                    "address" => $society->address,
                    "regional_id" => $society->regional_id
                ],
                "token" => $token,
                "token_type" => "Bearer"
            ]
        ], 201);
    }

    // Logout untuk semua role
    public function logout(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                "message" => "Unauthenticated"
            ], 401);
        }

        $user->update([
            "login_tokens" => null
        ]);

        if ($user->role == 'society') {
            $society = Society::find($user->userable_id);
            if ($society) {
                $society->update([
                    "login_tokens" => null
                ]);
            }
        }

        return response()->json([
            "message" => "Logout success"
        ], 200);
    }

    // Refresh token
    public function refreshToken(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                "message" => "Unauthenticated"
            ], 401);
        }

        // Generate token baru
        $newToken = Str::random(60);

        $user->update([
            "login_tokens" => $newToken
        ]);

        // Update di society jika perlu
        if ($user->role == 'society') {
            $society = Society::find($user->userable_id);
            if ($society) {
                $society->update([
                    "login_tokens" => $newToken
                ]);
            }
        }

        return response()->json([
            "message" => "Token refreshed successfully",
            "data" => [
                "token" => $newToken,
                "token_type" => "Bearer"
            ]
        ], 200);
    }

    // Get profile
    public function profile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                "message" => "Unauthenticated"
            ], 401);
        }

        $profileData = [
            "id" => $user->id,
            "email" => $user->email,
            "role" => $user->role,
            "last_login_at" => $user->last_login_at,
            "is_active" => $user->is_active
        ];

        switch ($user->role) {
            case 'society':
                $society = Society::with('regional')->find($user->userable_id);
                if ($society) {
                    $profileData['society_data'] = [
                        "id_card_number" => $society->id_card_number,
                        "name" => $society->name,
                        "born_date" => $society->born_date,
                        "gender" => $society->gender,
                        "address" => $society->address,
                        "regional" => $society->regional ? [
                            "id" => $society->regional->id,
                            "province" => $society->regional->province,
                            "district" => $society->regional->district,
                        ] : null
                    ];
                }
                break;

            case 'officer':
            case 'validator':
                $validator = Validator::with('regional')->where('user_id', $user->id)->first();
                if ($validator) {
                    $profileData['validator_data'] = [
                        "employee_id" => $validator->employee_id,
                        "name" => $validator->name,
                        "phone" => $validator->phone,
                        "role" => $validator->role,
                        "regional" => $validator->regional ? [
                            "id" => $validator->regional->id,
                            "province" => $validator->regional->province,
                            "district" => $validator->regional->district,
                        ] : null,
                        "is_active" => $validator->is_active
                    ];
                }
                break;

            case 'admin':
                $admin = Admin::find($user->userable_id);
                if ($admin) {
                    $profileData['admin_data'] = [
                        "name" => $admin->name,
                        "email" => $admin->email
                    ];
                }
                break;
        }

        return response()->json([
            "message" => "Profile retrieved successfully",
            "data" => $profileData
        ], 200);
    }

    // Update profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                "message" => "Unauthenticated"
            ], 401);
        }

        switch ($user->role) {
            case 'society':
                $request->validate([
                    "name" => "sometimes|string|max:255",
                    "born_date" => "sometimes|date",
                    "gender" => "sometimes|in:male,female",
                    "address" => "sometimes|string",
                    "regional_id" => "sometimes|exists:regionals,id"
                ]);

                $society = Society::find($user->userable_id);
                if ($society) {
                    $society->update($request->only([
                        'name', 'born_date', 'gender', 'address', 'regional_id'
                    ]));
                }
                break;

            case 'officer':
            case 'validator':
                $request->validate([
                    "name" => "sometimes|string|max:255",
                    "phone" => "sometimes|string|max:20"
                ]);

                $validator = Validator::where('user_id', $user->id)->first();
                if ($validator) {
                    $validator->update($request->only(['name', 'phone']));
                }
                break;

            case 'admin':
                $request->validate([
                    "name" => "sometimes|string|max:255"
                ]);

                $admin = Admin::find($user->userable_id);
                if ($admin) {
                    $admin->update(['name' => $request->name]);
                }
                break;
        }

        return response()->json([
            "message" => "Profile updated successfully"
        ], 200);
    }

    // Change password
    public function changePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                "message" => "Unauthenticated"
            ], 401);
        }

        $request->validate([
            "current_password" => "required",
            "new_password" => "required|min:6|different:current_password"
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                "message" => "Current password is incorrect"
            ], 400);
        }

        $newHashedPassword = Hash::make($request->new_password);

        $user->update([
            "password" => $newHashedPassword
        ]);

        switch ($user->role) {
            case 'society':
                $society = Society::find($user->userable_id);
                if ($society) {
                    $society->update(["password" => $newHashedPassword]);
                }
                break;

            case 'admin':
                $admin = Admin::find($user->userable_id);
                if ($admin) {
                    $admin->update(["password" => $newHashedPassword]);
                }
                break;
        }

        return response()->json([
            "message" => "Password changed successfully"
        ], 200);
    }

    // Forgot password
    public function forgotPassword(Request $request)
    {
        $request->validate([
            "email" => "required|email"
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                "message" => "If the email exists, a password reset link will be sent"
            ], 200);
        }

        $resetToken = Str::random(64);

        $user->update([
            "login_tokens" => "reset_" . $resetToken
        ]);

        return response()->json([
            "message" => "If the email exists, a password reset link will be sent",
        ], 200);
    }
}
