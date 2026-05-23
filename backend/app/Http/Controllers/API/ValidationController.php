<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Society;
use App\Models\Validation;
use App\Models\Validator;
use Illuminate\Http\Request;

class ValidationController extends Controller
{
    public function validation(Request $request) {
        $token = $request->query("token");

        if(!$token) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        $society = Society::where("login_tokens", $token)->first();

        if(!$society) {
            return response()->json([
                "message" => "Unauthorized user"
            ], 401);
        }

        $alreadySubmit = Validation::where("society_id", $society->id)->first();

        if($alreadySubmit) {
            return response()->json([
                "message" => "You already Submited  validation"
            ]);
        }

        $request->validate([
            "work_experience" => "required",
            "job_category_id" => "required|exists:job_categories,id",
            "job_position" => "required",
            "reason_accepted" => "required"
        ]);


        Validation::create([
            "job_category_id" => $request->job_category_id,
            "society_id" => $society->id,
            "status" => "pending",
            "work_experience" => $request->work_experience,
            "job_position" => $request->job_position,
            "reason_accepted" => $request->reason_accepted,
        ]);


        return response()->json([
            "message" => "Request data  validation sent"
        ], 200);
    }


    public function getValidation(Request $request) {
        $token = $request->query("token");

        if(!$token) {
            return response()->json([
                "message" => "Invalid Token"
            ], 401);
        }

        $society = Society::where("login_tokens", $token)->first();

        if(!$society) {
            return response()->json([
                "message" => "Unauthorized user"
            ], 401);
        }

        $validation = Validation::where("society_id", $society->id)->first();

        return response()->json([
            "validation" => [
                "id" => $validation->id,
                "status" => $validation->status,
                "work_experience" => $validation->work_experience,
                "job_category_id" => $validation->job_category_id,
                "job_position" => $validation->job_position,
                "reason_accepted" => $validation->reason_accepted,
                "validator_notes" => $validation->validator_notes,
                "validator" => $validation->validator,
            ]
        ], 200);
    }
}
