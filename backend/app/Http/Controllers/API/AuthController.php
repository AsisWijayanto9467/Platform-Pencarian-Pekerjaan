<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Society;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function Login(Request $request) {
        $request->validate([
            "id_card_number" => "required",
            "password" => "required"
        ]);

        $society = Society::with("regional")->where("id_card_number", $request->id_card_number)->first();

        if(!$society || !Hash::check($request->password, $society->password)) {
            return response()->json([
                "message" => "ID Card Number or Password incorrect"
            ], 401);
        }

        $token = md5($request->password);

        $society->update([
            "login_tokens" => $token
        ]);

        return response()->json([
            "name" => $society->name,
            "born_date" => $society->born_date,
            "gender" => $society->gender,
            "address" => $society->address,
            "token" => $token,
            "regional" => [
                "id" => $society->regional->id,
                "province" => $society->regional->province,
                "district" => $society->regional->district,
            ]
        ], 200);
    }

    public function Logout(Request $request) {
        $token = $request->query("token");

        if(!$token) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        $society = Society::where("login_tokens",  $token)->first();

        if(!$society) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        $society->update([
            "login_tokens" => null
        ]);

        return response()->json([
            "message" => "Logout success"
        ], 200);
    }
}
